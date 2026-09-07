'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, ChevronDown } from 'lucide-react'
import { NOT_READY_CODE, patchJson } from '../_components/useApi'
import { Card, Badge, statusTone, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, Pagination, LoadingCards, ace } from '../_components/ui'
import type { FeedbackRow } from '@/lib/admin/types'

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const
const TYPES = ['All', 'bug_report', 'feature_request', 'general'] as const

const TYPE_LABEL: Record<string, string> = {
  bug_report: 'Bug report',
  feature_request: 'Feature request',
  general: 'Feedback',
}

interface FeedbackResponse {
  feedback: FeedbackRow[]
  total: number
  page: number
  perPage: number
  statuses: string[]
}

export default function AdminFeedbackPage() {
  const [data, setData] = useState<FeedbackResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [status, setStatus] = useState<string>('All')
  const [type, setType] = useState<string>('All')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const perPage = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, type, page: String(page), perPage: String(perPage) })
      const res = await fetch(`/api/admin/feedback?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.status === 409 && json.code === NOT_READY_CODE) setNotReady(true)
      else if (!res.ok) setError(json.error || `Request failed (${res.status})`)
      else setData(json)
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }, [status, type, page])

  useEffect(() => { void (async () => await load())() }, [load])

  const changeStatus = async (id: string, next: FeedbackRow['status']) => {
    setBusy(id)
    setError(null)
    const res = await patchJson('/api/admin/feedback', { id, status: next })
    if (!res.ok) setError(res.error || 'Failed to update')
    else load()
    setBusy(null)
  }

  const saveNote = async (id: string) => {
    setBusy(id)
    setError(null)
    const res = await patchJson('/api/admin/feedback', { id, admin_note: noteDraft[id] || null })
    if (!res.ok) setError(res.error || 'Failed to save note')
    else load()
    setBusy(null)
  }

  if (notReady) {
    return (
      <>
        <PageHeader title="Feedback" desc="Inbox for user bug reports, feature requests and feedback" />
        <NotReadyBanner onRefresh={load} />
      </>
    )
  }

  return (
    <div>
      <PageHeader title="Feedback" desc="Inbox for user bug reports, feature requests and feedback" />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }} style={filterBtn(status === s)}>{s}</button>
        ))}
        <span style={{ width: 1, background: ace.cardBorder, margin: '0 4px' }} />
        {TYPES.map((t) => (
          <button key={t} onClick={() => { setType(t); setPage(1) }} style={filterBtn(type === t)}>{t === 'All' ? 'All types' : TYPE_LABEL[t]}</button>
        ))}
      </div>

      {error && <div style={{ marginBottom: 12 }}><ErrorBanner message={error} /></div>}

      {loading && !data ? (
        <LoadingCards rows={4} />
      ) : !data || data.feedback.length === 0 ? (
        <Card><EmptyState icon={<MessageSquare size={22} />} title="No feedback here yet" desc="User-submitted feedback will appear in this inbox." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.feedback.map((f) => {
            const isOpen = expanded === f.id
            return (
              <Card key={f.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : f.id)}>
                  <span style={{ color: '#a78bfa', flexShrink: 0, marginTop: 2 }}><MessageSquare size={17} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <Badge tone="violet">{TYPE_LABEL[f.type] ?? f.type}</Badge>
                      <Badge tone={statusTone(f.status)}>{f.status.replace('_', ' ')}</Badge>
                      <span style={{ fontSize: 11, color: ace.sub, marginLeft: 'auto' }}>{new Date(f.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ace.text }}>{f.title}</div>
                    <div style={{ fontSize: 12.5, color: ace.sub, marginTop: 2 }}>from {f.user_email || 'unknown user'}</div>
                  </div>
                  <ChevronDown size={16} style={{ color: ace.sub, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.12s', marginTop: 4 }} />
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${ace.cardBorder}`, paddingTop: 14 }}>
                    <div style={{ fontSize: 13, color: ace.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 14 }}>{f.message}</div>

                    {f.admin_note && (
                      <div style={{ marginBottom: 12, fontSize: 12.5, color: '#fbbf24', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 9, padding: '8px 10px' }}>
                        Admin note: {f.admin_note}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                      {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                        <button key={s} disabled={busy === f.id} onClick={() => changeStatus(f.id, s)} style={filterBtn(f.status === s)}>
                          {s === 'in_progress' ? 'In progress' : s[0].toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={noteDraft[f.id] ?? f.admin_note ?? ''}
                        onChange={(ev) => setNoteDraft((prev) => ({ ...prev, [f.id]: ev.target.value }))}
                        placeholder="Add a note / reply the user will see…"
                        style={{ flex: 1, padding: '9px 10px', background: ace.inputBg, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, color: ace.text, fontSize: 12.5, outline: 'none' }}
                      />
                      <button disabled={busy === f.id} onClick={() => saveNote(f.id)} style={{ padding: '9px 15px', borderRadius: 9, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                        Save note
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          <Pagination page={page} perPage={perPage} total={data.total} onPage={setPage} />
        </div>
      )}
    </div>
  )
}

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: '7px 13px', borderRadius: 9,
    border: `1px solid ${active ? '#818cf8' : ace.cardBorder}`,
    background: active ? ace.softBg : 'transparent',
    color: active ? ace.accentText : ace.sub,
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  }
}