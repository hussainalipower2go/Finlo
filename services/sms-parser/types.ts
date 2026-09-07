/** Shared types for the SMS transaction parsing engine. */

export type DebitCredit = 'DEBIT' | 'CREDIT'

export interface ParsedSms {
  amount: number
  currency: string
  transactionType: DebitCredit
  bankName: string
  accountLast4?: string
  merchant?: string
  date?: string // YYYY-MM-DD
  time?: string // HH:MM
  referenceNumber?: string
  transactionChannel?: string
  sender: string
  confidence: number
  suggestedCategory?: string
  description?: string
  appType?: 'expense' | 'income'
  externalTransactionId?: string
}

export interface SmsParseOutcome {
  /** parsed = machine-readable ok (still respects import mode), review = needs manual confirm, unsupported = not a supported transaction alert */
  status: 'parsed' | 'review' | 'unsupported'
  parsed?: ParsedSms
  reason?: string
}

export interface ExistingTxnLike {
  id?: string
  type?: string
  amount?: number | string
  date?: string | null
  description?: string
  merchant?: string | null
  reference_number?: string | null
  external_transaction_id?: string | null
}

export interface DuplicateMatch {
  isDuplicate: boolean
  score: number
  matchedId?: string
  reasons: string[]
}