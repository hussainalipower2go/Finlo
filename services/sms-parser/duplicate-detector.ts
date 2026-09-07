/**
 * Duplicate detection for imported transactions.
 * Compares the type/date/amount/merchant/reference-of a candidate against the
 * user's existing transactions. A duplicate is never auto-saved.
 */

import { DuplicateMatch, ExistingTxnLike, ParsedSms } from './types'

function norm(s?: string | null): string {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function titleWords(a?: string | null, b?: string | null): boolean {
  const x = norm(a)
  const y = norm(b)
  if (!x || !y) return true
  return x.includes(y) || y.includes(x)
}

export function findDuplicate(parsed: ParsedSms, existing: ExistingTxnLike[]): DuplicateMatch {
  let best: DuplicateMatch = { isDuplicate: false, score: 0, reasons: [] }

  for (const txn of existing) {
    const reasons: string[] = []
    const score = similarityScore(parsed, txn, reasons)
    if (score > best.score) {
      best = { isDuplicate: score >= 0.85, score, matchedId: txn.id, reasons: [...reasons] }
    }
  }
  return best
}

function similarityScore(parsed: ParsedSms, txn: ExistingTxnLike, reasons: string[]): number {
  reasons.length = 0
  let score = 0

  const sameType =
    (txn.type === 'income' && parsed.transactionType === 'CREDIT') ||
    (txn.type === 'expense' && parsed.transactionType === 'DEBIT')

  // 1) Strong: same external reference (SMS ref, bank API id)
  if (parsed.referenceNumber && txn.reference_number) {
    if (norm(parsed.referenceNumber) === norm(txn.reference_number)) {
      reasons.push('same reference number')
      return 1
    }
  }
  if (parsed.externalTransactionId && txn.external_transaction_id) {
    if (norm(parsed.externalTransactionId) === norm(txn.external_transaction_id)) {
      reasons.push('same external transaction id')
      return 1
    }
  }

  // 2) Same date + same direction
  const sameDate = parsed.date ? parsed.date === (txn.date || '').slice(0, 10) : false
  if (sameDate && sameType) score += 0.45
  else if (sameDate) score += 0.25

  // 3) Amount equality (±1 to allow rounding)
  const candidate = Number(parsed.amount) || 0
  const existingAmt = Number(txn.amount) || 0
  if (candidate > 0 && existingAmt > 0 && Math.abs(candidate - existingAmt) <= 1) {
    score += 0.4
    reasons.push('same amount')
  }

  // 4) Merchant / description overlap
  if (parsed.merchant && titleWords(parsed.merchant, txn.merchant || txn.description)) {
    score += 0.15
    reasons.push('same merchant/description')
  }

  return Math.min(1, score)
}