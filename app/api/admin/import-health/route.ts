import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, adminDb } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const DAY = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  try {
    let importTablesReady = false
    let pendingReviews = 0
    let pendingTotal = 0
    let providers: { provider: string; messages: number; created: number; duplicates: number; attempts: number; failures: number }[] = []
    let recent: { provider: string; message_count: number; created_count: number; duplicate_count: number; status: string; created_at: string }[] = []
    let recentErrors: { service: string; message: string; created_at: string; status: string }[] = []

    // pending_transactions (SMS queue)
    try {
      const { count, error } = await adminDb()
        .from('pending_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (!error) {
        pendingReviews = count ?? 0
        importTablesReady = true
      }
    } catch {
      /* tables may not be applied yet */
    }

    // import_history rollup by provider
    try {
      const { data, error } = await adminDb().from('import_history').select('*')
      if (!error) {
        importTablesReady = importTablesReady && true
        const byProvider = new Map<string, { messages: number; created: number; duplicates: number; attempts: number; failures: number }>()
        ;(data ?? []).forEach((r) => {
          const p = r.provider as string
          const cur = byProvider.get(p) ?? { messages: 0, created: 0, duplicates: 0, attempts: 0, failures: 0 }
          cur.messages += Number(r.message_count) || 0
          cur.created += Number(r.created_count) || 0
          cur.duplicates += Number(r.duplicate_count) || 0
          cur.attempts += 1
          if ((r.status as string) !== 'processed' && (r.status as string) !== 'success') {
            cur.failures += 1
          }
          byProvider.set(p, cur)
        })
        pendingTotal = (data ?? []).length
        providers = [...byProvider.entries()].map(([provider, s]) => ({ provider, ...s }))

        recent = (data ?? [])
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .slice(0, 20)
          .map((r) => ({
            provider: r.provider,
            message_count: Number(r.message_count) || 0,
            created_count: Number(r.created_count) || 0,
            duplicate_count: Number(r.duplicate_count) || 0,
            status: r.status,
            created_at: r.created_at,
          }))
      }
    } catch {
      /* ignore */
    }

    // system_errors for import services in the last 24h
    try {
      const cutoff = new Date(Date.now() - DAY).toISOString()
      const { data, error } = await adminDb()
        .from('system_errors')
        .select('service, message, created_at, status')
        .in('service', ['sms_import', 'csv_import', 'receipt_scanning', 'import'])
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(20)
      if (!error) recentErrors = data ?? []
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      importTablesReady,
      pendingReviews,
      totalBatches: pendingTotal,
      providers,
      recent,
      recentErrors,
    })
  } catch (err) {
    console.error('import-health route error:', err)
    return NextResponse.json({ error: 'Failed to load import health' }, { status: 500 })
  }
}