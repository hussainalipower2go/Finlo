import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { adminDb } from '@/lib/admin/helpers'
import { getAuthUser } from '../auth'
import { analyzeSms, findDuplicate } from '@/services/sms-parser/index'
import { looksFinancial } from '@/services/sms-parser/banks'
import { isFlagEnabled } from '@/lib/admin/features'

export const runtime = 'nodejs'
export const maxDuration = 60

interface IncomingMessage {
  sender?: string
  body: string
}

function truncatePreview(s: string): string {
  return s.length > 160 ? `${s.slice(0, 157)}…` : s
}

/**
 * POST /api/import/sms
 * Body: { messages: [{ sender, body }], mode?: 'auto'|'review', source?: 'SMS' }
 * Runs the parser pipeline over a set of SMS messages, dedupes, then either
 * auto-adds (mode=auto + confidence threshold) or queues for review.
 */
export async function POST(req: NextRequest) {
  let auth = await getAuthUser(req)
  if (!auth.ok) {
    // External SMS-forwarder apps use a stable personal import token.
    const token = req.headers.get('x-finlo-import-token')?.trim()
    if (token) {
      try {
        const { data: row } = await adminDb()
          .from('sms_import_settings')
          .select('user_id')
          .eq('import_token', token)
          .maybeSingle()
        if (row?.user_id) auth = { ok: true, userId: row.user_id }
      } catch {
        /* fall through to 401 */
      }
    }
  }
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!(await isFlagEnabled('sms_import_enabled'))) {
    return NextResponse.json({ error: 'SMS import is temporarily disabled' }, { status: 403 })
  }

  let payload: { messages?: IncomingMessage[]; mode?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(0, 500) : []
  if (messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  // Only ever process messages that look financial (defense in depth).
  const financial = messages.filter((m) => m.body && looksFinancial(m.body))

  const server = await createServerClient()

  // Settings (default to review mode when not configured yet).
  let settings: { import_mode: string; auto_add_confidence: number; excluded_senders: string[]; enabled: boolean } = {
    import_mode: 'review',
    auto_add_confidence: 0.9,
    excluded_senders: [],
    enabled: false,
  }
  try {
    const { data, error } = await server
      .from('sms_import_settings')
      .select('*')
      .eq('user_id', auth.userId)
      .single()
    if (!error && data) {
      settings = {
        import_mode: data.import_mode === 'auto' ? 'auto' : 'review',
        auto_add_confidence: Number(data.auto_add_confidence) ?? 0.9,
        excluded_senders: Array.isArray(data.excluded_senders) ? data.excluded_senders : [],
        enabled: !!data.enabled,
      }
    }
  } catch {
    // Table may not exist yet (migration not applied) — fall back to defaults.
  }

  const mode = payload.mode === 'auto' ? 'auto' : settings.import_mode
  const useAuto = mode === 'auto' && settings.enabled

  // Existing transactions for duplicate detection (merge across source tables).
  const existing: Parameters<typeof findDuplicate>[1] = []
  try {
    const [{ data: txns }, { data: exp }, { data: inc }] = await Promise.all([
      server.from('transactions').select('id,type,amount,date,description,merchant,reference_number,external_transaction_id').eq('user_id', auth.userId),
      server.from('expenses').select('id,title,amount,date').eq('user_id', auth.userId),
      server.from('income').select('id,title,amount,date').eq('user_id', auth.userId),
    ])
    for (const r of txns ?? []) existing.push(r)
    for (const r of exp ?? []) existing.push({ id: r.id, type: 'expense', amount: r.amount, date: r.date, description: r.title })
    for (const r of inc ?? []) existing.push({ id: r.id, type: 'income', amount: r.amount, date: r.date, description: r.title })
  } catch {
    // ignore — dedupe best effort
  }

  let created = 0
  let duplicates = 0
  let queued = 0
  const createdIds: string[] = []
  const pendingIds: string[] = []

  for (const msg of financial) {
    const sender = msg.sender || ''
    if (settings.excluded_senders.some((s) => sender.toLowerCase().includes(s.toLowerCase()))) continue

    const outcome = analyzeSms({ sender, body: msg.body })
    if (outcome.status === 'unsupported') continue

    const p = outcome.parsed
    if (!p || !p.amount || p.amount <= 0) continue

    // Skip auth/OTP defensively at the API layer too (never stored).
    if (outcome.status === 'review' && outcome.reason === 'auth') continue

    const dup = findDuplicate(p, existing)
    if (dup.isDuplicate) {
      duplicates++
      continue
    }

    if (useAuto && outcome.status === 'parsed' && p.confidence >= settings.auto_add_confidence) {
      const record = {
        user_id: auth.userId,
        type: p.transactionType === 'CREDIT' ? 'income' : 'expense',
        amount: p.amount,
        description: p.description || p.merchant || p.bankName || 'SMS transaction',
        date: p.date || new Date().toISOString().slice(0, 10),
        category: p.suggestedCategory === 'other' ? null : p.suggestedCategory,
        merchant: p.merchant || null,
        account_last4: p.accountLast4 || null,
        bank_name: p.bankName,
        reference_number: p.referenceNumber || null,
        transaction_channel: p.transactionChannel || null,
        external_transaction_id: p.externalTransactionId || p.referenceNumber || null,
        parsing_confidence: p.confidence,
        source: 'SMS',
        import_metadata: { sender: sender || null, time: p.time || null },
      }
      try {
        const { data, error } = await server.from('transactions').insert(record).select('id').single()
        if (error) throw new Error(error.message)
        created++
        createdIds.push(data.id)
        existing.push({ id: data.id, type: record.type, amount: record.amount, date: record.date, description: record.description, reference_number: record.external_transaction_id })
      } catch (err) {
        if (err instanceof Error && /duplicate|uq_transactions_external/i.test(err.message)) {
          duplicates++
        }
      }
    } else {
      // Queue for review.
      const pendingRow = {
        user_id: auth.userId,
        sender: sender || null,
        raw_sms_preview: truncatePreview(msg.body),
        amount: p.amount,
        currency: p.currency,
        transaction_type: p.transactionType,
        bank_name: p.bankName,
        account_last4: p.accountLast4 || null,
        merchant: p.merchant || null,
        transaction_date: p.date || null,
        transaction_time: p.time || null,
        reference_number: p.referenceNumber || null,
        transaction_channel: p.transactionChannel || null,
        parsing_confidence: p.confidence,
        suggested_category: p.suggestedCategory === 'other' ? null : p.suggestedCategory,
        status: 'pending',
      }
      try {
        const { data, error } = await server.from('pending_transactions').insert(pendingRow).select('id').single()
        if (error) throw new Error(error.message)
        queued++
        pendingIds.push(data.id)
      } catch (err) {
        if (err instanceof Error && /duplicate|uq/i.test(err.message)) duplicates++
      }
    }
  }

  // Record import history.
  try {
    await server.from('import_history').insert({
      user_id: auth.userId,
      provider: 'SMS',
      message_count: financial.length,
      created_count: created,
      duplicate_count: duplicates,
      status: queued > 0 ? 'needs_review' : 'processed',
    })
  } catch {
    // best effort
  }

  return NextResponse.json({
    received: messages.length,
    processed: financial.length,
    created,
    duplicates,
    queued,
    createdIds,
    pendingIds,
  })
}