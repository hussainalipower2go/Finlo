import { NextResponse, type NextRequest } from 'next/server'
import { isFlagEnabled } from '@/lib/admin/features'
import { reportError } from '@/lib/admin/helpers'
import { getAuthUser } from '@/app/api/import/auth'

export const runtime = 'nodejs'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest']

async function callGemini(apiKey: string, model: string, prompt: string, timeoutMs = 45000): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error(`Gemini ${model} error (${resp.status}):`, errText.slice(0, 300))
      return null
    }

    const data = await resp.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text?.trim() || null
  } catch (err) {
    console.error(`Gemini ${model} fetch error:`, err instanceof Error ? err.message : err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (!(await isFlagEnabled('ai_assistant_enabled'))) {
      return NextResponse.json({ reply: "The AI Assistant is temporarily disabled. Please try again later." }, { status: 200 })
    }

    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ reply: "The AI assistant isn't configured. Please add an AI_API_KEY in your environment." }, { status: 200 })
    }

    const body = (await request.json()) as {
      messages: ChatMessage[]
      context?: Record<string, string | number>
    }
    const messages = body.messages || []
    const context = body.context || {}

    const contextLines = Object.entries(context)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n')

    const systemPrompt = `You are a helpful, concise financial assistant for a cash flow app.
The user's financial data:
${contextLines || '(No data provided)'}

Answer questions based ONLY on the provided data. Be friendly and concise (2-4 short sentences). Use PKR currency (Rs.). Never invent numbers not in the data.`

    const history = messages
      .slice(0, -1)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')
    const lastUser = messages[messages.length - 1]?.content || ''

    const prompt = `${systemPrompt}

${history ? history + '\n' : ''}User: ${lastUser}
Assistant:`

    const primaryModel = process.env.AI_MODEL || 'gemini-flash-lite-latest'
    const models = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)]

    for (const model of models) {
      const reply = await callGemini(apiKey, model, prompt)
      if (reply) return NextResponse.json({ reply })
    }

    return NextResponse.json({ reply: "I couldn't reach the AI service right now. Please try again in a moment." }, { status: 200 })
  } catch (err) {
    console.error('AI route error:', err)
    await reportError({ service: 'ai', level: 'warning', message: err instanceof Error ? err.message : 'AI route failure' })
    return NextResponse.json({ reply: "Something went wrong. Please try again." }, { status: 200 })
  }
}
