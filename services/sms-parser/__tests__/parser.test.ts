import { describe, it, expect } from 'vitest'
import { analyzeSms } from '../index'
import { extractDate, extractAmount, extractTime, extractAccountLast4, extractReference } from '../parser'
import { findDuplicate } from '../duplicate-detector'
import { categoryFromMerchant, suggestCategory } from '../category-engine'
import type { ParsedSms } from '../types'

const OK = (outcome: ReturnType<typeof analyzeSms>): ParsedSms => {
  expect(outcome.status).not.toBe('unsupported')
  return (outcome.parsed ?? {}) as ParsedSms
}

describe('SMS filter', () => {
  it('rejects OTP / verification codes and never parses them', () => {
    const r = analyzeSms({ sender: 'HBL', body: 'Your OTP for online transaction is 482913. Never share it.' })
    expect(r.status).toBe('unsupported')
    expect(r.reason).toBe('auth')
  })

  it('rejects a non-financial personal message', () => {
    const r = analyzeSms({ sender: 'Ali', body: 'Aap ki shadi kitne baje hai kal?' })
    expect(r.status).toBe('unsupported')
    expect(r.reason).toBe('not-financial')
  })

  it('rejects an unrelated bank promo with no transaction data', () => {
    const r = analyzeSms({ sender: 'HBL', body: 'HBL wishes you a blessed Eid. Thank you for banking with us.' })
    expect(r.status).toBe('unsupported')
  })
})

describe('Debit parsing', () => {
  it('parses an HBL card debit (PKR, merchant, date, time, ref, last4)', () => {
    const r = analyzeSms({
      sender: 'HBL',
      body: 'PKR 5,000.00 debit on 06/09/2026 at 14:34 at FoodPanda. Card ending 1234. Available Bal PKR 25,000. Ref# 012345678901.',
    })
    expect(r.status).toBe('parsed')
    const p = OK(r)
    expect(p.amount).toBe(5000)
    expect(p.currency).toBe('PKR')
    expect(p.transactionType).toBe('DEBIT')
    expect(p.bankName).toBe('HBL')
    expect(p.merchant).toBe('FoodPanda')
    expect(p.date).toBe('2026-09-06')
    expect(p.time).toBe('14:34')
    expect(p.accountLast4).toBe('1234')
    expect(p.referenceNumber).toBe('012345678901')
    expect(p.suggestedCategory).toBe('food')
    expect(p.appType).toBe('expense')
    expect(p.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('parses a Meezan Bank card debit with masked card number', () => {
    const r = analyzeSms({
      sender: 'Meezan Bank',
      body: 'Dear Customer, PKR 2,500.00 has been debited from your Meezan card ****1234 on 05-09-2026 at PIZZA HUT. Available balance PKR 10,000.00.',
    })
    const p = OK(r)
    expect(p.amount).toBe(2500)
    expect(p.transactionType).toBe('DEBIT')
    expect(p.accountLast4).toBe('1234')
    expect(p.merchant?.toLowerCase()).toContain('pizza')
    expect(p.date).toBe('2026-09-05')
    expect(p.suggestedCategory).toBe('food')
  })

  it('parses UBL Omni transfer-out and channel', () => {
    const r = analyzeSms({
      sender: 'UBL',
      body: 'Sent PKR 1,500.00 to 0300123456 via UBL Omni on 06/09/26. TID: 7654321.',
    })
    const p = OK(r)
    expect(p.amount).toBe(1500)
    expect(p.transactionType).toBe('DEBIT')
    expect(p.transactionChannel).toBe('Omni')
    expect(p.referenceNumber).toBe('7654321')
    expect(p.date).toBe('2026-09-06')
  })
})

describe('Credit parsing', () => {
  it('parses an Easypaisa incoming credit with AM/PM time', () => {
    const r = analyzeSms({
      sender: 'Easypaisa',
      body: 'Your Easypaisa account received Rs. 1,000 from 03001234567 on 06-Sep-26 at 01:02 PM. Balance Rs. 5,000.',
    })
    expect(r.status).toBe('parsed')
    const p = OK(r)
    expect(p.amount).toBe(1000)
    expect(p.currency).toBe('PKR')
    expect(p.transactionType).toBe('CREDIT')
    expect(p.appType).toBe('income')
    expect(p.date).toBe('2026-09-06')
    expect(p.time).toBe('13:02')
    expect(p.bankName).toBe('Easypaisa')
  })

  it('parses a JazzCash wallet credit (added to)', () => {
    const r = analyzeSms({
      sender: 'JazzCash',
      body: 'Congratulations! Rs. 500 has been added to your JazzCash account on 12-08-2026. New balance: Rs. 2,000. TID: 1234567',
    })
    const p = OK(r)
    expect(p.amount).toBe(500)
    expect(p.transactionType).toBe('CREDIT')
    expect(p.appType).toBe('income')
  })

  it('parses a salary credit alert', () => {
    const r = analyzeSms({
      sender: 'Meezan Bank',
      body: 'Dear Customer, your salary of PKR 150,000.00 has been credited to account ****9901 on 01-03-2026 via IBFT. Ref: 998877665544.',
    })
    const p = OK(r)
    expect(p.amount).toBe(150000)
    expect(p.transactionType).toBe('CREDIT')
    expect(p.appType).toBe('income')
    expect(p.referenceNumber).toBe('998877665544')
  })
})

describe('Bank Alfalah credit card payment', () => {
  it('parses an Alfalah card payment received (amount without currency symbol)', () => {
    const r = analyzeSms({
      sender: '',
      body: 'Dear MR MUHAMMAD DANIYAL\nSAJID, your Bank Alfalah Credit Card payment for the amount\n76400.00 received on 02/11/2024.\nBAL: reply with CC Call/Whatsapp\n021111225111',
    })
    expect(r.status).not.toBe('unsupported')
    const p = OK(r)
    expect(p.amount).toBe(76400)
    expect(p.currency).toBe('PKR')
    expect(p.bankName).toBe('Bank Alfalah')
    expect(p.date).toBe('2024-11-02')
    expect(p.transactionType).toBe('DEBIT')
    expect(p.appType).toBe('expense')
  })
})

describe('Date & time extraction', () => {
  it.each([
    ['06/09/2026', '2026-09-06'],
    ['06-09-26', '2026-09-06'],
    ['06-Sep-26', '2026-09-06'],
    ['05 Sep 2026', '2026-09-05'],
    ['September 5, 2026', '2026-09-05'],
  ])('parses date %s → %s', (input, expected) => {
    expect(extractDate(`Txn on ${input} amount debited`)).toBe(expected)
  })

  it('parses 24h and 12h times', () => {
    expect(extractTime('at 14:34')).toBe('14:34')
    expect(extractTime('at 01:02 PM')).toBe('13:02')
    expect(extractTime('at 9:05 AM')).toBe('09:05')
  })
})

describe('Amount & currency extraction', () => {
  it.each([
    ['PKR 5,000.00', 5000, 'PKR'],
    ['Rs. 1,000', 1000, 'PKR'],
    ['Rs 500', 500, 'PKR'],
    ['₹ 2,400', 2400, 'INR'],
    ['USD 99.50', 99.5, 'USD'],
  ])('extracts %s → amount %s currency %s', (raw, amt, cur) => {
    const res = extractAmount(`${raw} debited from account`)
    expect(res?.amount).toBe(amt)
    expect(res?.currency).toBe(cur)
  })
})

describe('Account & reference extraction', () => {
it('finds masked account last4', () => {
    expect(extractAccountLast4('card ****1234')).toBe('1234')
    expect(extractAccountLast4('Account ending 9901')).toBe('9901')
  })

  it('finds reference and TID numbers', () => {
    expect(extractReference('Ref# 012345678901')).toBe('012345678901')
    expect(extractReference('TID: 7654321')).toBe('7654321')
  })
})

describe('Merchant → category engine', () => {
  it('maps known merchants deterministically', () => {
    expect(categoryFromMerchant('FoodPanda')).toBe('food')
    expect(categoryFromMerchant('Uber')).toBe('transport')
    expect(categoryFromMerchant('Amazon')).toBe('shopping')
    expect(categoryFromMerchant('Spotify')).toBe('subscriptions')
  })

  it('falls back to keyword classification', () => {
    expect(suggestCategory(undefined, 'Grocery shopping at hyper mart')).toBe('shopping')
    expect(suggestCategory(undefined, 'paid electricity bill online')).toBe('utilities')
    expect(suggestCategory(undefined, 'unknown merchant')).toBe('other')
  })
})

describe('Duplicate detection', () => {
  const parsed: ParsedSms = {
    amount: 5000,
    currency: 'PKR',
    transactionType: 'DEBIT',
    bankName: 'HBL',
    merchant: 'FoodPanda',
    date: '2026-09-06',
    referenceNumber: '012345678901',
    sender: 'HBL',
    confidence: 0.98,
  }

  it('flags exact reference number match as duplicate', () => {
    const dup = findDuplicate(parsed, [
      { id: 't1', type: 'expense', amount: 5000, date: '2026-09-06', description: 'FoodPanda', reference_number: '012345678901' },
    ])
    expect(dup.isDuplicate).toBe(true)
    expect(dup.score).toBe(1)
    expect(dup.matchedId).toBe('t1')
  })

  it('flags same date + amount + merchant as duplicate', () => {
    const dup = findDuplicate(parsed, [
      { id: 't2', type: 'expense', amount: 5000.0, date: '2026-09-06', description: 'foodpanda' },
    ])
    expect(dup.isDuplicate).toBe(true)
    expect(dup.score).toBeGreaterThanOrEqual(0.85)
  })

  it('does NOT flag a different transaction as duplicate', () => {
    const notDup = findDuplicate(parsed, [
      { id: 't3', type: 'expense', amount: 700, date: '2026-08-01', description: 'Cafe' },
    ])
    expect(notDup.isDuplicate).toBe(false)
  })
})