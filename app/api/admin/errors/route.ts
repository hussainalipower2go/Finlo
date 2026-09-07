import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser, adminDb, audit } from '@/lib/admin/helpers'
import type { ErrorLogRow } from '@/lib/admin/types'

export const runtime = 'nodejs'

const FILTERS = ['All', 'Critical', 'Error', 'Warning', 'Resolved'] as const

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'resolved', 'ignored']),
  note: z.string().max(2000).optional(),
})

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') ?? 'All'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = 30

  try {
    let query = adminDb()
      .from('system_errors')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filter === 'Resolved') query = query.eq('status', 'resolved')
    else if (filter === 'Critical') query = query.eq('level', 'critical')
    else if (filter === 'Error') query = query.eq('level', 'error')
    else if (filter === 'Warning') query = query.eq('level', 'warning')

    const { data, error, count } = await query
    if (error) {
      // Table likely missing on old DBs → graceful empty.
      return NextResponse.json({ errors: [], total: 0, page, perPage, filters: FILTERS })
    }

    const errors: ErrorLogRow[] = (data ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      error_code: r.error_code,
      service: r.service,
      level: r.level,
      message: r.message,
      stack_trace: r.stack_trace,
      metadata: r.metadata ?? {},
      status: r.status,
      note: r.note,
      resolved_by: r.resolved_by,
      resolved_at: r.resolved_at,
      created_at: r.created_at,
    }))

    const start = (page - 1) * perPage
    return NextResponse.json({ errors: errors.slice(start, start + perPage), total: count ?? errors.length, page, perPage, filters: FILTERS })
  } catch (err) {
    console.error('errors route error:', err)
    return NextResponse.json({ error: 'Failed to load errors' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  let body
  try {
    body = StatusSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const next: { status: string; note?: string; resolved_by?: string | null; resolved_at?: string | null } = { status: body.status }
    if (body.note !== undefined) next.note = body.note
    if (body.status === 'resolved') {
      next.resolved_by = admin.userId
      next.resolved_at = new Date().toISOString()
    } else if (body.status === 'open') {
      next.resolved_by = null
      next.resolved_at = null
    }

    const { error } = await adminDb().from('system_errors').update(next).eq('id', body.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await audit(admin.userId, `update_error_status`, 'error', body.id, { status: body.status })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('error status update error:', err)
    return NextResponse.json({ error: 'Failed to update error' }, { status: 500 })
  }
}