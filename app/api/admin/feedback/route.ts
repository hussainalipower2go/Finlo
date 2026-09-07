import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser, adminDb, audit } from '@/lib/admin/helpers'
import type { FeedbackRow } from '@/lib/admin/types'

export const runtime = 'nodejs'

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  admin_note: z.string().max(4000).optional().nullable(),
})

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'All'
  const type = url.searchParams.get('type') ?? 'All'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const perPage = 20

  try {
    let query = adminDb()
      .from('user_feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status !== 'All') {
      const key = status.toLowerCase().replace(' ', '_')
      query = query.eq('status', key)
    }
    if (type !== 'All') query = query.eq('type', type)

    const { data, error, count } = await query
    if (error) {
      return NextResponse.json({ feedback: [], total: 0, page, perPage, statuses: STATUSES })
    }

    const ids = [...new Set((data ?? []).map((r) => r.user_id))]
    const byId: Record<string, string> = {}
    if (ids.length) {
      const { data: profs } = await adminDb().from('profiles').select('id, email').in('id', ids)
      ;(profs ?? []).forEach((p) => (byId[p.id] = p.email ?? ''))
    }

    const rows: FeedbackRow[] = (data ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      user_email: byId[r.user_id] ?? null,
      type: r.type,
      title: r.title,
      message: r.message,
      status: r.status,
      admin_note: r.admin_note,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }))

    const start = (page - 1) * perPage
    return NextResponse.json({ feedback: rows.slice(start, start + perPage), total: count ?? rows.length, page, perPage, statuses: STATUSES })
  } catch (err) {
    console.error('feedback route error:', err)
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  let body
  try {
    body = UpdateSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const next: { status?: string; admin_note?: string | null; updated_at?: string } = { updated_at: new Date().toISOString() }
    if (body.status) next.status = body.status
    if (body.admin_note !== undefined) next.admin_note = body.admin_note

    const { error } = await adminDb().from('user_feedback').update(next).eq('id', body.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await audit(admin.userId, 'update_feedback', 'feedback', body.id, {
      status: body.status,
      has_note: body.admin_note != null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('feedback update error:', err)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}