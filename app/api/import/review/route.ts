import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../auth'
import { createClient as createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ReviewAction {
  id: string
  action: 'add' | 'edit' | 'ignore'
  updates?: {
    amount?: number
    category?: string
    merchant?: string
    date?: string
    type?: 'expense' | 'income'
  }
}

/**
 * POST /api/import/review
 * Body: { actions: ReviewAction[] }
 * Approves, edits-and-adds, or discards pending import items.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let payload: { actions?: ReviewAction[] }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const actions = Array.isArray(payload.actions) ? payload.actions.slice(0, 100) : []
  if (actions.length === 0) {
    return NextResponse.json({ error: 'No actions provided' }, { status: 400 })
  }

  const server = await createServerClient()

  let added = 0
  let ignored = 0
  const errors: string[] = []

  for (const act of actions) {
    if (!act.id || !['add', 'edit', 'ignore'].includes(act.action)) continue

    // Fetch the pending row (must belong to this user).
    const { data: pending, error: fetchErr } = await server
      .from('pending_transactions')
      .select('*')
      .eq('id', act.id)
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .single()

    if (fetchErr || !pending) {
      errors.push(`Pending item ${act.id} not found`)
      continue
    }

    if (act.action === 'ignore') {
      await server
        .from('pending_transactions')
        .update({ status: 'resolved' })
        .eq('id', act.id)
      ignored++
      continue
    }

    // add or edit: insert into transactions.
    const transactionType = act.updates?.type === 'income' ? 'income' : (pending.transaction_type === 'CREDIT' ? 'income' : 'expense')
    const amount = act.updates?.amount ?? pending.amount ?? 0
    const description = act.updates?.merchant
      || pending.merchant
      || `${pending.bank_name || 'Bank'} transaction`
    const category = (act.updates?.category || pending.suggested_category || null) as string | null
    const merchant = act.updates?.merchant ?? pending.merchant ?? null
    const txnDate = act.updates?.date || pending.transaction_date || new Date().toISOString().slice(0, 10)

    const record = {
      user_id: auth.userId,
      type: transactionType,
      amount,
      description,
      date: txnDate,
      category: category && category !== 'other' ? category : null,
      merchant,
      account_last4: pending.account_last4 || null,
      bank_name: pending.bank_name || null,
      reference_number: pending.reference_number || null,
      transaction_channel: pending.transaction_channel || null,
      external_transaction_id: pending.reference_number || null,
      parsing_confidence: pending.parsing_confidence,
      source: 'SMS',
      import_metadata: { sender: pending.sender, time: pending.transaction_time },
    }

    try {
      const { error: insErr } = await server.from('transactions').insert(record)
      if (insErr) throw new Error(insErr.message)

      // Mark pending as resolved (raw preview deleted).
      await server
        .from('pending_transactions')
        .update({ status: 'resolved' })
        .eq('id', act.id)

      added++
    } catch (err) {
      if (err instanceof Error && /duplicate|uq_transactions_external/i.test(err.message)) {
        await server
          .from('pending_transactions')
          .update({ status: 'resolved' })
          .eq('id', act.id)
        errors.push(`Skipped duplicate ${act.id}`)
      } else {
        errors.push(`Failed ${act.id}: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }
  }

  return NextResponse.json({ added, ignored, errors })
}