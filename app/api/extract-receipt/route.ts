import { NextResponse } from 'next/server'
import { isFlagEnabled } from '@/lib/admin/features'
import { reportError } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest']

async function callGeminiVision(apiKey: string, model: string, imageBase64: string, mimeType: string, timeoutMs = 30000): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const prompt = `Extract transaction details from this receipt/bill image. Return ONLY a JSON object with these fields:
- "amount": the total amount as a number (no currency symbol)
- "description": a short description of what was purchased (merchant name or item, max 30 chars)
- "category": one of exactly these values: "Food", "Transport", "Rent", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Subscriptions", "Family", "Travel", "Other"
- "date": the date in YYYY-MM-DD format (use today if not visible)

If you cannot read a field, use a reasonable default (amount: 0, description: "Unknown", category: "Other", date: today).
Return ONLY the JSON object, no explanation.`

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { maxOutputTokens: 256, temperature: 0.2 },
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error(`Gemini vision ${model} error (${resp.status}):`, errText.slice(0, 300))
      return null
    }

    const data = await resp.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text?.trim() || null
  } catch (err) {
    console.error(`Gemini vision ${model} fetch error:`, err instanceof Error ? err.message : err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isFlagEnabled('receipt_scanning_enabled'))) {
      return NextResponse.json({ error: 'Receipt scanning is temporarily disabled' }, { status: 403 })
    }

    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
    }

    const body = (await request.json()) as { image: string; mimeType?: string }
    if (!body.image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const mimeType = body.mimeType || 'image/jpeg'
    const primaryModel = process.env.AI_MODEL || 'gemini-flash-lite-latest'
    const models = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)]

    for (const model of models) {
      const raw = await callGeminiVision(apiKey, model, body.image, mimeType)
      if (raw) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return NextResponse.json({
            amount: Number(parsed.amount) || 0,
            description: String(parsed.description || '').slice(0, 60),
            category: String(parsed.category || 'Other'),
            date: String(parsed.date || new Date().toISOString().slice(0, 10)),
          })
        }
      }
    }

    return NextResponse.json({ error: 'Could not read receipt' }, { status: 422 })
  } catch (err) {
    console.error('Extract receipt error:', err)
    await reportError({ service: 'receipt_scanning', level: 'warning', message: err instanceof Error ? err.message : 'Receipt extraction failure' })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
