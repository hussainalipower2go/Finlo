'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, Inbox, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { NOT_READY_CODE } from '../_components/useApi'
import { Card, Badge, statusTone, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, Skeleton, ace } from '../_components/ui'

interface ImportHealthData {
  importTablesReady: boolean
  pendingReviews: number
  totalBatches: number
  providers: { provider: string; messages: number; created: number; duplicates: number; attempts: number; failures: number }[]
  recent: { provider: string; message_count: number; created_count: number; duplicate_count: number; status: string; created_at: string }[]
  recentErrors: { service: string; message: string; created_at: string; status: string }[]
}

export default function AdminImportHealthPage() {
  const [data, setData] = useState<ImportHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/import-health', { cache: 'no-store' })
      const json = await res.json()
      if (res.status === 409 && json.code === NOT_READY_CODE) setNotReady(true)
      else if (!res.ok) setError(json.error || `Request failed (${res.status})`)
      else setData(json)
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void (async () => await load())() }, [load])

  if (notReady) {
    return (
      <>
        <PageHeader title="Import Health" desc="SMS / CSV import pipeline health and history" />
        <NotReadyBanner onRefresh={load} />
      </>
    )
  }

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Import Health" desc="SMS / CSV import pipeline health and history" />
        <Skeleton height={160} />
        <div style={{ marginTop: 16 }}><Skeleton height={240} /></div>
      </>
    )
  }

  const failureTotal = data.providers.reduce((a, p) => a + p.failures, 0)

  return (
    <div>
      <PageHeader title="Import Health" desc="SMS / CSV import pipeline health and history" />

      {!data.importTablesReady && (
        <div style={{ marginBottom: 14, padding: 13, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', fontSize: 12.5, color: '#fbbf24', lineHeight: 1.6 }}>
          The import tables shipped in <code>supabase/migrations/20260906000000_sms_transaction_import.sql</code> but are not applied to this database. History will stay empty until then.
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 16 }}>
        <MiniStat label="Pending reviews" value={`${data.pendingReviews}`} tone={data.pendingReviews > 0 ? '#fbbf24' : '#10b981'} icon={<Inbox size={15} />} />
        <MiniStat label="Import batches" value={`${data.totalBatches}`} tone="#818cf8" icon={<RefreshCw size={15} />} />
        <MiniStat label="Providers" value={`${data.providers.length}`} tone="#60a5fa" icon={<Database size={15} />} />
        <MiniStat label="Failed batches" value={`${failureTotal}`} tone={failureTotal > 0 ? '#f87171' : '#34d399'} icon={<AlertTriangle size={15} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card title="Providers" icon={<Database size={16} />} style={{ minWidth: 0 }}>
          {data.providers.length === 0 ? (
            <EmptyState title="No import activity yet" desc="Batches will appear here as SMS/CSV imports run." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr>
                    {['Provider', 'Messages', 'Created', 'Duplicates', 'Failures'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: ace.sub, padding: '6px 8px', borderBottom: `1px solid ${ace.cardBorder}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.providers.map((p) => (
                    <tr key={p.provider} style={{ borderBottom: '1px solid var(--ace-card-border)' }}>
                      <td style={{ padding: '8px', fontSize: 13, fontWeight: 600, color: ace.text, textTransform: 'uppercase' }}>{p.provider}</td>
                      <td style={{ padding: '8px', fontSize: 12.5, color: ace.sub }}>{p.messages}</td>
                      <td style={{ padding: '8px', fontSize: 12.5, color: '#34d399' }}>{p.created}</td>
                      <td style={{ padding: '8px', fontSize: 12.5, color: ace.sub }}>{p.duplicates}</td>
                      <td style={{ padding: '8px', fontSize: 12.5, color: p.failures > 0 ? '#f87171' : '#34d399' }}>{p.failures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Recent errors (24h)" icon={<AlertTriangle size={16} />} style={{ minWidth: 0 }}>
          {data.recentErrors.length === 0 ? (
            <EmptyState icon={<CheckCircle size={22} />} title="No import errors in the last 24 hours" desc="Import-related system errors will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recentErrors.map((e, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--ace-card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <Badge tone={statusTone(e.status)}>{e.service}</Badge>
                    <span style={{ fontSize: 11, color: ace.sub }}>{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: ace.text, lineHeight: 1.4, wordBreak: 'break-word' }}>{e.message}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent import batches" icon={<RefreshCw size={16} />}>
        {data.recent.length === 0 ? (
          <EmptyState title="No batches yet" desc="Every SMS/CSV import run will be listed here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  {['When', 'Provider', 'Status', 'Messages', 'Created', 'Duplicates'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: ace.sub, padding: '6px 8px', borderBottom: `1px solid ${ace.cardBorder}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--ace-card-border)' }}>
                    <td style={{ padding: '8px', fontSize: 12, color: ace.sub, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</td>
                    <td style={{ padding: '8px', fontSize: 12.5, fontWeight: 600, color: ace.text, textTransform: 'uppercase' }}>{r.provider}</td>
                    <td style={{ padding: '8px' }}><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td style={{ padding: '8px', fontSize: 12.5, color: ace.sub }}>{r.message_count}</td>
                    <td style={{ padding: '8px', fontSize: 12.5, color: '#34d399' }}>{r.created_count}</td>
                    <td style={{ padding: '8px', fontSize: 12.5, color: ace.sub }}>{r.duplicate_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function MiniStat({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: ace.card, border: `1px solid ${ace.cardBorder}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: tone }}>
        {icon} <span style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: ace.text, marginTop: 6 }}>{value}</div>
    </div>
  )
}