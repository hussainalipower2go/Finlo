/**
 * SMS transaction detection pipeline (platform agnostic, pure TS).
 *
 *   incoming SMS
 *     → SMS Filter (auth/OTP excluded, non-financial rejected)
 *     → Bank Pattern Detection (specific → generic → reject)
 *     → Transaction Parser (amount, date, type, channel, ref)
 *     → Debit/Credit Classification
 *     → Data Extraction
 *     → Merchant Recognition
 *     → Category Suggestion
 *     → [Duplicate Detection — done by callers with user data]
 *     → User Transaction Database
 *
 * This module is safe to import from both the Next.js server (API routes)
 * and the browser (Import Center preview tool). No Node-only imports.
 */

import { isAuthExcluded, looksFinancial, matchBank } from './banks'
import { parseMessage, ParseInput } from './parser'
import { SmsParseOutcome } from './types'

/**
 * Classify a single SMS as parsed / needs-review / unsupported.
 */
export function analyzeSms(input: ParseInput): SmsParseOutcome {
  const { sender, body } = input

  if (isAuthExcluded(body)) {
    return { status: 'unsupported', reason: 'auth' }
  }

  const bank = matchBank(sender, body)

  if (!bank && !looksFinancial(body)) {
    return { status: 'unsupported', reason: 'not-financial' }
  }

  const result = parseMessage(input, bank)
  if (!result) {
    return { status: 'unsupported', reason: 'unparseable' }
  }

  return result.needsReview
    ? { status: 'review', parsed: result.parsed, reason: 'low-conf' }
    : { status: 'parsed', parsed: result.parsed }
}

export { matchBank, looksFinancial, parseMessage }
export * from './types'
export { suggestCategory, categoryFromMerchant, APP_CATEGORIES } from './category-engine'
export { findDuplicate } from './duplicate-detector'