import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser, adminDb, audit, listAllAuthUsers } from '@/lib/admin/helpers'
import type { AdminAction, AdminUser } from '@/lib/admin/types'

export const runtime = 'nodejs'

const ActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['suspend', 'reactivate', 'promote', 'demote', 'deactivate']),
})

const ACTION_TO_STATUS: Record<AdminAction, { account_status?: string; role?: string }> = {
  suspend: { account_status: 'SUSPENDED' },
  reactivate: { account_status: 'ACTIVE' },
  promote: { role: 'ADMIN' },
  demote: { role: 'USER' },
  deactivate: { account_status: 'DELETED' },
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  const url = new URL(req.url)
  const search = url.searchParams.get('search') ?? ''
  const role = url.searchParams.get('role') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = Math.min(50, Math.max(5, Number(url.searchParams.get('perPage') ?? 20)))

  try {
    const authUsers = await listAllAuthUsers()

    // Join with profiles to get role/status/currency (authoritative).
    const ids = authUsers.map((u) => u.id)
    const profs: Record<string, { role: string; account_status: string; currency: string | null; avatar_url: string | null; monthly_income: number | null }> = {}
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await adminDb()
        .from('profiles')
        .select('id, role, account_status, currency, avatar_url, monthly_income')
        .in('id', ids.slice(i, i + 200))
      ;(data ?? []).forEach((p) => {
        profs[p.id] = {
          role: p.role,
          account_status: p.account_status,
          currency: p.currency,
          avatar_url: p.avatar_url,
          monthly_income: p.monthly_income,
        }
      })
    }

    // Transaction counts (aggregated server-side only).
    const txCounts: Record<string, number> = {}
    try {
      for (const table of ['transactions', 'income', 'expenses'] as const) {
        const { data: rows } = await adminDb().from(table).select('user_id, id, amount')
        ;(rows ?? []).forEach((r) => {
          txCounts[r.user_id] = (txCounts[r.user_id] ?? 0) + 1
        })
      }
    } catch {
      /* tx counts are best effort */
    }

    const all: AdminUser[] = authUsers.map((u) => {
      const p = profs[u.id] ?? { role: 'USER', account_status: 'ACTIVE', currency: null, avatar_url: null, monthly_income: null }
      return {
        id: u.id,
        email: u.email,
        full_name:
          typeof u.user_metadata?.full_name === 'string'
            ? u.user_metadata.full_name
            : typeof u.user_metadata?.name === 'string'
              ? u.user_metadata.name
              : '',
        role: p.role as AdminUser['role'],
        account_status: p.account_status as AdminUser['account_status'],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        currency: p.currency,
        avatar_url: p.avatar_url,
        monthly_income: p.monthly_income,
        transaction_count: txCounts[u.id] ?? 0,
        has_data: (txCounts[u.id] ?? 0) > 0,
      }
    })

    const filtered = all.filter((u) => {
      const q = search.trim().toLowerCase()
      if (q && !`${u.email} ${u.full_name}`.toLowerCase().includes(q)) return false
      if (role && u.role !== role) return false
      if (status && u.account_status !== status) return false
      return true
    })

    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
    const total = filtered.length
    const start = (page - 1) * perPage
    const items = filtered.slice(start, start + perPage)

    return NextResponse.json({ users: items, total, page, perPage })
  } catch (err) {
    console.error('admin users route error:', err)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  let body
  try {
    body = ActionSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Never allow demoting yourself from ADMIN (self-lockout guard).
  if (body.userId === admin.userId && body.action === 'demote') {
    return NextResponse.json({ error: 'You cannot demote your own admin account.' }, { status: 400 })
  }

  try {
    const updates = ACTION_TO_STATUS[body.action]
    const { data, error } = await adminDb()
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', body.userId)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'User not found' },
        { status: error ? 500 : 404 }
      )
    }

    await audit(admin.userId, `${body.action}_user`, 'user', body.userId, {
      target_email: (data.email as string | null) ?? undefined,
    })

    return NextResponse.json({ ok: true, user: data })
  } catch (err) {
    console.error('admin users action error:', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}