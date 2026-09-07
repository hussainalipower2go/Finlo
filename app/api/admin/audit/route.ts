import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, adminDb } from '@/lib/admin/helpers'
import type { AuditLogRow } from '@/lib/admin/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  try {
    const { data, error } = await adminDb()
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ logs: [] })
    }

    const adminIds = [...new Set((data ?? []).map((r) => r.admin_user_id))]
    const byId: Record<string, string> = {}
    if (adminIds.length) {
      const { data: profs } = await adminDb().from('profiles').select('id, email').in('id', adminIds)
      ;(profs ?? []).forEach((p) => (byId[p.id] = p.email ?? ''))
    }

    const logs: AuditLogRow[] = (data ?? []).map((r) => ({
      id: r.id,
      admin_user_id: r.admin_user_id,
      admin_email: byId[r.admin_user_id] ?? null,
      action: r.action,
      target_type: r.target_type,
      target_id: r.target_id,
      metadata: r.metadata ?? {},
      created_at: r.created_at,
    }))

    return NextResponse.json({ logs })
  } catch (err) {
    console.error('audit route error:', err)
    return NextResponse.json({ error: 'Failed to load audit logs' }, { status: 500 })
  }
}