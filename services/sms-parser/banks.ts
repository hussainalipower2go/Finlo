/**
 * Bank parser configuration registry.
 *
 * Add a new bank by appending an entry here — no parser changes needed.
 * Every entry has an ordered precedence; entries earlier in the array are
 * tried first (more specific senders should come first).
 */

export interface BankPattern {
  readonly id: string
  readonly name: string
  /** Matches SMS sender address / name. */
  readonly senderPattern: RegExp
  readonly debitKeywords: string[]
  readonly creditKeywords: string[]
  readonly currencyLabels: string[]
  readonly channelHints: string[]
}

export const SUPPORTED_CURRENCY_LABELS = ['PKR', 'Rs.', 'Rs', '₹', 'USD', 'AED', 'SAR', 'GBP', 'EUR']

export const BANK_PATTERNS: BankPattern[] = [
  {
    id: 'hbl',
    name: 'HBL',
    senderPattern: /HBL/i,
    debitKeywords: ['debited', 'debit', 'paid', 'withdrawn'],
    creditKeywords: ['credited', 'credit', 'received'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['ATM', 'POS', 'IBFT', 'Website', 'Wallet'],
  },
  {
    id: 'meezan',
    name: 'Meezan Bank',
    senderPattern: /Meezan|MEZZAN/i,
    debitKeywords: ['debited from', 'debited', 'payment to'],
    creditKeywords: ['credited to', 'credited', 'received'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['Card', 'POS', 'ATM', 'IBFT'],
  },
  {
    id: 'ubl',
    name: 'UBL',
    senderPattern: /UBL|United Bank/i,
    debitKeywords: ['sent', 'debited', 'paid', 'withdrawn'],
    creditKeywords: ['received', 'credited', 'deposited'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['Omni', 'ATM', 'IBFT', 'POS'],
  },
  {
    id: 'allied',
    name: 'Allied Bank',
    senderPattern: /Allied/i,
    debitKeywords: ['debited', 'paid', 'withdrawn'],
    creditKeywords: ['credited', 'received', 'deposited'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['ATM', 'IBFT', 'POS'],
  },
  {
    id: 'mcb',
    name: 'MCB',
    senderPattern: /MCB|Muslim Commercial/i,
    debitKeywords: ['debited', 'paid', 'withdrawn'],
    creditKeywords: ['credited', 'received', 'deposited'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['ATM', 'IBFT', 'POS'],
  },
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    senderPattern: /Easypaisa|Easy Paisa/i,
    debitKeywords: ['sent', 'debited', 'transfer'],
    creditKeywords: ['received', 'credited', 'added'],
    currencyLabels: ['Rs.', 'Rs', 'PKR'],
    channelHints: ['Mobile', 'Wallet', 'SMS'],
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    senderPattern: /JazzCash|Jazz Cash|MobiCash/i,
    debitKeywords: ['sent', 'debited', 'paid', 'transfer'],
    creditKeywords: ['received', 'credited', 'added', 'top up'],
    currencyLabels: ['Rs.', 'Rs', 'PKR'],
    channelHints: ['Mobile', 'Wallet', 'SMS'],
  },
  {
    id: 'sadapay',
    name: 'SadaPay',
    senderPattern: /SadaPay|sadapay/i,
    debitKeywords: ['spent', 'debited', 'paid'],
    creditKeywords: ['received', 'added', 'credited'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['Card', 'Wallet'],
  },
  {
    id: 'nayapay',
    name: 'NayaPay',
    senderPattern: /NayaPay|nayapay/i,
    debitKeywords: ['spent', 'debited', 'paid'],
    creditKeywords: ['received', 'added', 'credited'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['Card', 'Wallet'],
  },
  {
    id: 'alfalah',
    name: 'Bank Alfalah',
    senderPattern: /Alfalah|Bank Alfalah/i,
    debitKeywords: ['debited', 'debit', 'paid', 'payment', 'sent', 'withdrawn'],
    creditKeywords: ['credited', 'credit', 'received', 'deposited'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['ATM', 'POS', 'IBFT', 'Card'],
  },
  {
    id: 'standard-chartered',
    name: 'Standard Chartered',
    senderPattern: /Standard Chartered|SCB/i,
    debitKeywords: ['debited', 'spent', 'paid'],
    creditKeywords: ['credited', 'received'],
    currencyLabels: ['PKR', 'Rs.', 'Rs'],
    channelHints: ['Card', 'ATM', 'IBFT'],
  },
]

/**
 * Keywords that indicate a NON-financial / authentication message.
 * These are always rejected — nothing from these is ever stored.
 */
export const AUTH_EXCLUSION_PATTERN =
  /OTP|one[\s-]?time pass|verification code|verif[iy]|security code|password|PIN is|login code|log ?in link|expires? in \d|is your code|code is \d|captcha/i

/** Keywords that hint a message is about banking / money even if amount context is loose. */
export const FINANCIAL_HINT_PATTERN =
  /balance|account|debit|credit|paid|received|sent|withdraw|deposit|transaction|transfer|card|ATM|refund|salary|purchase|payment|bill/i

export function isAuthExcluded(body: string): boolean {
  return AUTH_EXCLUSION_PATTERN.test(body)
}

export function looksFinancial(body: string): boolean {
  return FINANCIAL_HINT_PATTERN.test(body)
}

/** Resolve the best bank pattern for a sender+body, else null (generic fallback). */
export function matchBank(sender: string, body: string): BankPattern | null {
  for (const bank of BANK_PATTERNS) {
    if (bank.senderPattern.test(sender) || bank.senderPattern.test(body.slice(0, 80))) {
      return bank
    }
  }
  return null
}