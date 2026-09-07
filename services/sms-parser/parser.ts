/**
 * Deterministic SMS → transaction parser.
 * Regex/pattern based first, bank-specific config second. No AI here —
 * see index.ts for where AI may be offered as an ambiguous-case fallback.
 */

import { BankPattern, isAuthExcluded, looksFinancial } from './banks'
import { merchantFromText, suggestCategory } from './category-engine'
import { DebitCredit, ParsedSms } from './types'

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7,
  aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

const CURRENCY_LABELS = ['PKR', 'Rs.', 'Rs', '₹', 'AED', 'SAR', 'USD', 'EUR', 'GBP']

function normalizeCurrencyLabel(label: string): string {
  const upper = label.replace('.', '').toUpperCase()
  if (upper === 'RS') return 'PKR'
  if (upper === '₹' || upper === 'INR') return 'INR'
  if (upper === 'PKR' || upper === 'USD' || upper === 'AED' || upper === 'SAR' || upper === 'GBP' || upper === 'EUR') return upper
  return 'PKR'
}

function sanitizeNumber(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, '').replace(/^₹/, '')
  return Number(cleaned)
}

// ── Amount ────────────────────────────────────────────────────────────────────
export function extractAmount(body: string, labels: string[] = CURRENCY_LABELS): { amount: number; currency: string } | null {
  const labelRe = new RegExp(`(?:${labels.join('|').replace(/\./g, '\\.')})\\s*([\\d][\\d,]*(?:\\.\\d{1,2})?)`, 'i')
  const m = body.match(labelRe)
  if (m) {
    const amount = sanitizeNumber(m[1])
    if (isFinite(amount) && amount > 0) {
      const raw = m[0]
      const currency = labels
        .map((l) => ({ l, i: raw.toLowerCase().indexOf(l.toLowerCase()) }))
        .filter((x) => x.i >= 0)
        .sort((a, b) => a.i - b.i)[0]?.l || 'PKR'
      return { amount, currency: normalizeCurrencyLabel(currency) }
    }
  }
  // Amount glued to a transaction verb without a currency label
  const verbRe = /(?:debited|credited|received|sent|paid|withdrawn|deposited|spent)\s+([\d][\d,]*(?:\.\d{1,2})?)\b/i
  const v = body.match(verbRe)
  if (v) {
    const amount = sanitizeNumber(v[1])
    if (isFinite(amount) && amount > 0) return { amount, currency: 'PKR' }
  }
  // "...(the) amount <num> ..." (PK banks often omit the currency symbol), e.g.
  // "payment for the amount 76400.00 received on 02/11/2024."
  const amtWordRe = /(?:for ?the ?)?amount(?: of)?\s+(?:PKR\s+|Rs\.?\s+)?([\d][\d,]*(?:\.\d{1,2})?)\b/i
  const aw = body.match(amtWordRe)
  if (aw) {
    const amount = sanitizeNumber(aw[1])
    if (isFinite(amount) && amount > 0) {
      const currency = /PKR|Rs/i.test(aw[0]) ? 'PKR' : 'PKR'
      return { amount, currency }
    }
  }
  return null
}

// ── Debit/Credit classification ───────────────────────────────────────────────
export function classify(body: string, bank: BankPattern | null): DebitCredit | undefined {
  const debit = bank?.debitKeywords || []
  const credit = bank?.creditKeywords || []
  const genericDebit = ['debited', 'debit', 'deducted', 'paid', 'withdrawn', 'sent', 'transferred out', 'spent', 'purchase']
  const genericCredit = ['credited', 'credit', 'received', 'deposited', 'added to', 'paid in', 'transferred in', 'salary', 'refund']

  // "your [Bank] Credit Card payment ... received" — the card issuer received
  // payment FROM the user, i.e. the user paid off their own card → outflow/DEBIT.
  // (Plain "received ... card payment" from a third party stays ambiguous.)
  if (/\byour\b[\s\S]{0,80}?\bcard\s+payment\b[\s\S]{0,40}?\breceived\b/i.test(body) ||
      /\bpayment for your\b[\s\S]{0,40}?\breceived\b/i.test(body)) {
    return 'DEBIT'
  }

  const debitHits = countMatches(body, [...debit, ...genericDebit])
  const creditHits = countMatches(body, [...credit, ...genericCredit])

  // Prefer the keyword set adjacent to the amount ("…500 rupees debited from…").
  const amount = extractAmount(body)
  const amtIndex = amount ? body.toLowerCase().indexOf(String(amount.amount)) : -1
  if (amtIndex >= 0) {
    const windowText = body.slice(Math.max(0, amtIndex - 60), amtIndex + 60).toLowerCase()
    const wDebit = countMatches(windowText, [...debit, ...genericDebit])
    const wCredit = countMatches(windowText, [...credit, ...genericCredit])
    if (wDebit > 0 || wCredit > 0) {
      return wCredit > wDebit ? 'CREDIT' : wDebit > wCredit ? 'DEBIT' : undefined
    }
  }

  if (creditHits > debitHits) return 'CREDIT'
  if (debitHits > creditHits) return 'DEBIT'
  return undefined
}

function countMatches(text: string, terms: string[]): number {
  let n = 0
  for (const t of terms) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}(?! out of| from your savings)`, 'gi')
    n += (text.match(re) || []).length
  }
  return n
}

// ── Date ───────────────────────────────────────────────────────────────────────
export function extractDate(body: string): string | undefined {
  // 1) numeric  d/m/y  or  m/d/y  (PK banks use day-first; we fall back day-first)
  const num = body.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/)
  if (num) {
    const a = num[1]
    const b = num[2]
    const y = num[3]
    let day = Number(a)
    let month = Number(b)
    let year = Number(y)
    if (month < 1 || month > 12) {
      // swap (US style: mm/dd)
      month = day
      day = Number(b)
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      if (year < 100) year = 2000 + year
      if (year < 1970 || year > 2100) return undefined
      const d = new Date(Date.UTC(year, month - 1, day))
      if (d.getUTCMonth() === month - 1) {
        return d.toISOString().slice(0, 10)
      }
    }
    return undefined
  }
  // 2) Mon d, yyyy  /  d Mon yyyy  /  06-Sep-26
  const named =
    body.match(/\b([A-Za-z]{3,9})\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/) ||
    body.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s/.-]+([A-Za-z]{3,9})[\s/.-]+(\d{2,4})\b/)
  if (named) {
    let month: number
    let day: number
    let year: number
    if (/^\d/.test(named[1])) {
      // d Mon yyyy → (day, month, year)
      day = Number(named[1])
      month = MONTHS[named[2].toLowerCase().slice(0, 3)]
      year = Number(named[3])
    } else {
      // Mon d, yyyy → (month, day, year)
      month = MONTHS[named[1].toLowerCase().slice(0, 3)]
      day = Number(named[2])
      year = Number(named[3])
    }
    if (!month) return undefined
    if (year < 100) year = 2000 + year
    if (year < 1970 || year > 2100) return undefined
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10)
  }
  return undefined
}

// ── Time ───────────────────────────────────────────────────────────────────────
export function extractTime(body: string): string | undefined {
  const m = body.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/)
  if (!m) return undefined
  let h = Number(m[1])
  const min = Number(m[2])
  const ampm = (m[3] || '').toUpperCase()
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  if (h > 23 || min > 59) return undefined
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// ── Account last 4 ─────────────────────────────────────────────────────────────
export function extractAccountLast4(body: string): string | undefined {
  const m = body.match(/(?:card|account|acct|a\/c|ending|last|wallet)[^0-9]{0,14}(?:\*{2,}|\*|-)?(\d{4})\b/i)
  return m?.[1] || undefined
}

// ── Reference ──────────────────────────────────────────────────────────────────
export function extractReference(body: string): string | undefined {
  const patterns = [
    /(?:ref(?:erence)?(?:\.|\s*#\s*|\s*no\.?\s*|\s*id\s*)?[:#]\s*)([A-Z0-9][A-Z0-9-]{5,})/i,
    /\bTID\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{5,})/i,
    /\b(?:transaction|trx|txn)\s*(?:id|no)\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{5,})/i,
  ]
  for (const p of patterns) {
    const m = body.match(p)
    if (m) return m[1]
  }
  // Long numeric strings that look like a bank reference (not a phone/OTP)
  const num = body.match(/(?<![A-Za-z])\d{10,16}(?![A-Za-z])/)
  if (num && !/^\d{10}$/.test(num[0])) return num[0]
  return undefined
}

// ── Channel ────────────────────────────────────────────────────────────────────
export function extractChannel(body: string, bank: BankPattern | null): string | undefined {
  const hints = bank?.channelHints || ['ATM', 'POS', 'IBFT', 'Wallet', 'Mobile', 'SMS', 'Omni']
  for (const h of hints) {
    if (new RegExp(`\\b${h}\\b`, 'i').test(body)) return h
  }
  return undefined
}

// ── Merchant ───────────────────────────────────────────────────────────────────
export function extractMerchant(body: string, bankName: string): string | undefined {
  const patterns = [
    /\b(?:at|from|to|ref)[^a-zA-Z0-9]{1,6}([A-Za-z][A-Za-z0-9 &'()\-]{2,48})/gi,
    /(?:spent|paid|purchase|bought)[^a-zA-Z0-9]{1,12}([A-Za-z][A-Za-z0-9 &'()\-]{2,48})/gi,
    /(?:debited to|credited by|received from|sent to)[^a-zA-Z0-9]{1,8}([A-Za-z][A-Za-z0-9 &'()\-]{2,48})/gi,
  ]
  const candidates: { index: number; raw: string }[] = []
  for (const p of patterns) {
    for (const m of body.matchAll(p)) {
      const raw = m[1]
      // Cut at embedded date/time ("on 05-09-2026", "at 14:34").
      const cut = raw.split(/\s+(\d{1,2}[-/.:]\d{1,2}|\d{1,2}:\d{2}|\son\s+|\svia\s+)/i)[0]
      candidates.push({ index: m.index ?? 0, raw: cut })
    }
  }
  candidates.sort((a, b) => b.index - a.index)
  for (const c of candidates) {
    const cleaned = merchantFromText(c.raw, bankName)
    if (cleaned) return cleaned
  }
  return undefined
}

// ── Confidence ─────────────────────────────────────────────────────────────────
export function computeConfidence(opts: {
  bankSpecific: boolean
  hasAmount: boolean
  hasType: boolean
  hasDate: boolean
  hasMerchant: boolean
  hasReference: boolean
}): number {
  const base = opts.bankSpecific ? 0.55 : 0.35
  let score = base
  if (opts.hasAmount) score += 0.25
  if (opts.hasType) score += 0.15
  if (opts.hasDate) score += 0.15
  if (opts.hasMerchant) score += 0.05
  if (opts.hasReference) score += 0.05
  return Math.min(1, Math.round(score * 100) / 100)
}

export interface ParseInput {
  sender: string
  body: string
}

/**
 * Parse a single SMS message into a normalized transaction description.
 * Returns null when the message is auth/OTP or not financial.
 * confidence < CONFIDENCE_REVIEW marks the result as requiring user review.
 */
export function parseMessage(input: ParseInput, bank: BankPattern | null): { parsed: ParsedSms; needsReview: boolean } | null {
  const { sender, body } = input

  if (isAuthExcluded(body)) return null
  if (!looksFinancial(body) && !bank) return null

  const amountRes = extractAmount(body, bank?.currencyLabels || CURRENCY_LABELS)
  const transactionType = classify(body, bank)
  const date = extractDate(body)
  const time = extractTime(body)
  const accountLast4 = extractAccountLast4(body)
  const referenceNumber = extractReference(body)
  const transactionChannel = extractChannel(body, bank)
  const merchant = extractMerchant(body, bank?.name || 'Bank')
  const currency = amountRes?.currency || 'PKR'

  if (!amountRes) return null
  if (!transactionType) return null

  const bankSpecific = bank !== null
  const confidence = computeConfidence({
    bankSpecific,
    hasAmount: true,
    hasType: true,
    hasDate: !!date,
    hasMerchant: !!merchant,
    hasReference: !!referenceNumber,
  })

  const appType = transactionType === 'CREDIT' ? 'income' : 'expense'
  const description = merchant || (transactionType === 'CREDIT' ? `Income from ${sender || 'bank'}` : `Payment via ${bank?.name || 'card'}`)

  const parsed: ParsedSms = {
    amount: amountRes.amount,
    currency,
    transactionType,
    bankName: bank?.name || 'Unknown Bank',
    accountLast4,
    merchant,
    date,
    time,
    referenceNumber,
    transactionChannel,
    sender,
    confidence,
    suggestedCategory: suggestCategory(merchant, description),
  }
  parsed.description = description
  parsed.appType = appType
  parsed.externalTransactionId = referenceNumber || undefined

  return { parsed, needsReview: confidence < 0.9 }
}