/**
 * Normalized Transaction Import Provider architecture.
 *
 * Every import source (manual, AI text, receipt, SMS, CSV, future bank API)
 * produces a `NormalizedTransaction`. The transaction system only ever reads
 * this shape, never provider-specific formats.
 */

import type { Json } from './types'

/** Transaction provenance, matching the `transactions.source` column. */
export type ImportSource = 'MANUAL' | 'AI_TEXT' | 'RECEIPT' | 'SMS' | 'CSV' | 'BANK_API'

/** Web/Android consent + processing mode. */
export type ImportMode = 'review' | 'auto'

export const IMPORT_SOURCES: ImportSource[] = ['MANUAL', 'AI_TEXT', 'RECEIPT', 'SMS', 'CSV', 'BANK_API']

/** Debit = money left the account. Credit = money entered the account. */
export type SmsTransactionType = 'DEBIT' | 'CREDIT'

/** Normalized output produced by any import provider. */
export interface NormalizedTransaction {
  amount: number
  currency: string
  transactionType: SmsTransactionType | 'EXPENSE' | 'INCOME'
  category?: string
  merchant?: string
  bankName?: string
  accountLast4?: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  referenceNumber?: string
  transactionChannel?: string
  externalTransactionId?: string
  source: ImportSource
  /** Internal app type: expense (debit) or income (credit). */
  appType: 'expense' | 'income'
  description: string
  parsingConfidence: number
  metadata?: Json
}

/** A transaction awaiting user review before it becomes a real transaction. */
export interface PendingImport {
  id: string
  sender?: string | null
  rawSmsPreview?: string | null
  amount: number | null
  currency: string | null
  transactionType: SmsTransactionType | null
  bankName?: string | null
  accountLast4?: string | null
  merchant?: string | null
  date: string | null
  time?: string | null
  referenceNumber?: string | null
  transactionChannel?: string | null
  parsingConfidence: number
  suggestedCategory?: string | null
  duplicateOf?: string | null
  status: 'pending' | 'resolved'
  createdAt: string
}

/** Result of running one SMS through the parsing pipeline. */
export interface SmsParseOutcome {
  status: 'parsed' | 'unsupported' | 'review'
  parsed?: NormalizedTransaction & { bankName: string }
  reason?: string
}

/** Import provider contract. */
export interface TransactionImportProvider {
  readonly id: ImportSource
  readonly label: string
  /** Turn provider payload into normalized transactions. */
  normalize(payload: unknown): Promise<NormalizedTransaction[]>
}

export const SOURCE_LABELS: Record<ImportSource, string> = {
  MANUAL: 'Manual',
  AI_TEXT: 'AI Text',
  RECEIPT: 'Receipt Scan',
  SMS: 'SMS Import',
  CSV: 'CSV Import',
  BANK_API: 'Bank API',
}

export const SOURCE_BADGE_COLORS: Record<ImportSource, string> = {
  MANUAL: '#94a3b8',
  AI_TEXT: '#8b5cf6',
  RECEIPT: '#06b6d4',
  SMS: '#10b981',
  CSV: '#f59e0b',
  BANK_API: '#6366f1',
} as const

/** Map a debit/credit classification onto the app's income/expense model. */
export function toAppType(t: SmsTransactionType | 'EXPENSE' | 'INCOME'): 'expense' | 'income' {
  if (t === 'CREDIT' || t === 'INCOME') return 'income'
  return 'expense'
}

/** Status text for SmsParseOutcome */
export type { Json }