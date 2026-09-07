import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, adminDb, listAllAuthUsers } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const DAY = 24 * 60 * 60 * 1000

async function countRows(table: string, filters: Record<string, unknown>): Promise<number> {
  try {
    let q = adminDb().from(table).select('id', { count: 'exact', head: true })
    for (const [key, value] of Object.entries(filters)) {
      q = q.eq(key, value)
    }
    const { count, error } = await q
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function countRowsGte(table: string, column: string, value: string): Promise<number> {
  try {
    const { count, error } = await adminDb()
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte(column, value)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

function lastNDays(n: number): { date: string; iso: string }[] {
  const out: { date: string; iso: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const iso = d.toISOString().slice(0, 10)
    out.push({ date: iso, iso })
  }
  return out
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  try {
    const now = Date.now()
    const users = await listAllAuthUsers()
    const totalUsers = users.length
    const newThisWeek = users.filter((u) => typeof u.created_at === 'string' && u.created_at >= new Date(now - 7 * DAY).toISOString()).length
    const activeUsers = users.filter((u) => typeof u.last_sign_in_at === 'string' && u.last_sign_in_at >= new Date(now - 7 * DAY).toISOString()).length

    const errors24h = await countRowsGte('system_errors', 'created_at', new Date(now - DAY).toISOString())
    const openErrors = await countRows('system_errors', { status: 'open' })
    const pendingReviews = await countRows('pending_transactions', { status: 'pending' })
    const feedbackOpen = await countRows('user_feedback', { status: 'open' })

    const signupBins = new Map<string, number>()
    const days = lastNDays(14)
    days.forEach((d) => signupBins.set(d.iso, 0))
    users.forEach((u) => {
      const day = new Date(u.created_at).toISOString().slice(0, 10)
      if (signupBins.has(day)) signupBins.set(day, (signupBins.get(day) ?? 0) + 1)
    })
    const signups = days.map((d) => ({ date: d.date, count: signupBins.get(d.iso) ?? 0 }))

    const statusBreakdown = new Map<string, number>()
    try {
      const { data } = await adminDb().from('profiles').select('account_status')
      ;(data ?? []).forEach((p) => {
        const key = (p.account_status as string) || 'ACTIVE'
        statusBreakdown.set(key, (statusBreakdown.get(key) ?? 0) + 1)
      })
    } catch {
      /* ignore */
    }
    if (statusBreakdown.size === 0) statusBreakdown.set('ACTIVE', totalUsers)

    let recentActivity: { id: string; description: string; activity_type: string; created_at: string; user_email: string }[] = []
    try {
      const { data } = await adminDb()
        .from('user_activity_logs')
        .select('id, activity_type, description, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(8)
      const ids = [...new Set((data ?? []).map((r) => r.user_id))]
      const byId: Record<string, string> = {}
      if (ids.length) {
        const { data: profs } = await adminDb().from('profiles').select('id, email').in('id', ids)
        ;(profs ?? []).forEach((p) => (byId[p.id] = p.email ?? ''))
      }
      recentActivity = (data ?? []).map((r) => ({
        id: r.id,
        activity_type: r.activity_type,
        description: r.description ?? '',
        created_at: r.created_at,
        user_email: byId[r.user_id] ?? '',
      }))
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        newThisWeek,
        errors24h,
        openErrors,
        pendingReviews,
        feedbackOpen,
      },
      signups,
      statusBreakdown: [...statusBreakdown.entries()].map(([status, count]) => ({ status, count })),
      recentActivity,
    })
  } catch (err) {
    console.error('overview route error:', err)
    return NextResponse.json({ error: 'Failed to load admin overview' }, { status: 500 })
  }
}