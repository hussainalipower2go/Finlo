import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, adminDb, listAllAuthUsers } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const RANGES = { daily: 14, weekly: 28, monthly: 90 } as const

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

interface Bucket {
  date: string
  signups: number
  txn_volume: number
  income: number
  expense: number
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  const url = new URL(req.url)
  const range = (url.searchParams.get('range') ?? 'daily') as keyof typeof RANGES
  const days = RANGES[range] ?? 14
  const start = daysAgoISO(days)

  try {
    const buckets = new Map<string, Bucket>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      buckets.set(d, { date: d, signups: 0, txn_volume: 0, income: 0, expense: 0 })
    }

    const users = await listAllAuthUsers()
    users.forEach((u) => {
      const day = new Date(u.created_at).toISOString().slice(0, 10)
      const b = buckets.get(day)
      if (b) b.signups += 1
    })

    const topMerchants = new Map<string, number>()
    const topCategories = new Map<string, number>()

    // ── transactions ─────────────────────────────────────────────
    try {
      const { data } = await adminDb()
        .from('transactions')
        .select('date, amount, type, category, merchant')
        .gte('date', start)
      ;(data ?? []).forEach((r) => {
        const day = (r.date as string)?.slice(0, 10)
        const b = buckets.get(day)
        if (!b) return
        const amt = Number(r.amount) || 0
        if (r.type === 'income') b.income += amt
        else b.expense += amt
        b.txn_volume += amt

        const cat = (r.category as string)?.trim()
        if (cat && cat.toLowerCase() !== 'other') topCategories.set(cat, (topCategories.get(cat) ?? 0) + amt)
        const merchant = (r.merchant as string)?.trim()
        if (merchant) topMerchants.set(merchant, (topMerchants.get(merchant) ?? 0) + amt)
      })
    } catch {
      /* some tables may be missing on old schemas */
    }

    // ── income table ─────────────────────────────────────────────
    try {
      const { data } = await adminDb().from('income').select('date, amount').gte('date', start)
      ;(data ?? []).forEach((r) => {
        const day = (r.date as string)?.slice(0, 10)
        const b = buckets.get(day)
        if (b) b.income += Number(r.amount) || 0
      })
    } catch {
      /* ignore */
    }

    // ── expenses table ───────────────────────────────────────────
    try {
      const { data } = await adminDb().from('expenses').select('date, amount, category').gte('date', start)
      ;(data ?? []).forEach((r) => {
        const day = (r.date as string)?.slice(0, 10)
        const b = buckets.get(day)
        if (!b) return
        const amt = Number(r.amount) || 0
        b.expense += amt
        const cat = (r.category as string)?.trim()
        if (cat && cat.toLowerCase() !== 'other') topCategories.set(cat, (topCategories.get(cat) ?? 0) + amt)
      })
    } catch {
      /* ignore */
    }

    const series = [...buckets.values()]

    const topMerchantList = [...topMerchants.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([merchant, total]) => ({ merchant, total }))
    const topCategoryList = [...topCategories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, total]) => ({ category, total }))

    const totals = series.reduce(
      (acc, s) => ({
        income: acc.income + s.income,
        expense: acc.expense + s.expense,
        volume: acc.volume + s.txn_volume,
        signups: acc.signups + s.signups,
      }),
      { income: 0, expense: 0, volume: 0, signups: 0 }
    )

    return NextResponse.json({ series, topMerchants: topMerchantList, topCategories: topCategoryList, totals })
  } catch (err) {
    console.error('analytics route error:', err)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}