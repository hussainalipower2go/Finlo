'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, ChevronDown, Check, Trash2, StickyNote } from 'lucide-react'
import { NOT_READY_CODE, patchJson } from '../_components/useApi'
import { Card, Badge, levelTone, statusTone, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, Pagination, LoadingCards, ace } from '../_components/ui'
import type { ErrorLogRow } from '@/lib/admin/types'

const FILTERS = ['All', 'Critical', 'Error', 'Warning', 'Resolved'] as const

interface ErrorsResponse {
  errors: ErrorLogRow[]
  total: number
  page: number
  perPage: number
  filters: string[]
}

export default function AdminErrorsPage() {
  const [data, setData] = useState<ErrorsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const perPage = 30

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ filter, page: String(page), perPage: String(perPage) })
      const res = await fetch(`/api/admin/errors?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.status === 409 && json.code === NOT_READY_CODE) setNotReady(true)
      else if (!res.ok) setError(json.error || `Request failed (${res.status})`)
      else setData(json)
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { void (async () => await load())() }, [load])

  const setStatus = async (id: string, status: 'open' | 'resolved' | 'ignored') => {
    setBusy(id)
    setError(null)
    const res = await patchJson('/api/admin/errors', { id, status, note: noteDraft[id] })
    if (!res.ok) setError(res.error || 'Failed to update')
    else load()
    setBusy(null)
  }

  const saveNote = async (id: string) => {
    setBusy(id)
    setError(null)
    const res = await patchJson('/api/admin/errors', { id, status: 'open', note: noteDraft[id] })
    if (!res.ok) setError(res.error || 'Failed to save note')
    else load()
    setBusy(null)
  }

  if (notReady) {
    return (
      <>
        <PageHeader title="Errors" desc="System and user-facing errors with triage workflow" />
        <NotReadyBanner onRefresh={load} />
      </>
    )
  }

  return (
    <div>
      <PageHeader title="Errors" desc="System and user-facing errors with triage workflow" />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${filter === f ? '#0A193D' : ace.cardBorder}`, background: filter === f ? ace.softBg : 'transparent', color: filter === f ? ace.accentText : ace.sub, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      {error && <div style={{ marginBottom: 12 }}><ErrorBanner message={error} /></div>}

      {loading && !data ? (
        <LoadingCards rows={4} />
      ) : !data || data.errors.length === 0 ? (
        <Card>
          <EmptyState icon={<Check size={22} />} title={`No errors in "${filter}"`} desc="When services hit failures, they'll be logged here for triage." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.errors.map((e) => {
            const isOpen = expanded === e.id
            const isUnresolved = e.status !== 'resolved'
            return (
              <Card key={e.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : e.id)}>
                  <span style={{ color: levelTone(e.level) === 'red' ? '#f87171' : levelTone(e.level) === 'amber' ? '#fbbf24' : '#93c5fd', flexShrink: 0, marginTop: 2 }}>
                    <AlertTriangle size={17} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <Badge tone={levelTone(e.level)}>{e.level}</Badge>
                      <Badge>{(e.service || 'unknown').toUpperCase()}</Badge>
                      {e.error_code && <Badge tone="violet">{e.error_code}</Badge>}
                      <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                      <span style={{ fontSize: 11, color: ace.sub, marginLeft: 'auto' }}>{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: ace.text, lineHeight: 1.5, wordBreak: 'break-word' }}>{e.message}</div>
                    {e.user_id && <div style={{ fontSize: 11, color: ace.sub, marginTop: 2 }}>user: {e.user_id.slice(0, 8)}…</div>}
                  </div>
                  <ChevronDown size={16} style={{ color: ace.sub, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.12s', marginTop: 4 }} />
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${ace.cardBorder}`, paddingTop: 14 }}>
                    {e.stack_trace && (
                      <details>
                        <summary style={{ fontSize: 12, fontWeight: 600, color: ace.sub, cursor: 'pointer', marginBottom: 6 }}>Stack trace</summary>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, color: ace.sub, background: 'var(--ace-input-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 10, padding: 10, maxHeight: 220, overflow: 'auto' }}>
                          {e.stack_trace}
                        </pre>
                      </details>
                    )}
                    {Object.keys(e.metadata ?? {}).length > 0 && (
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, color: ace.sub, background: 'var(--ace-input-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 10, padding: 10, marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
                        {JSON.stringify(e.metadata, null, 2)}
                      </pre>
                    )}
                    {e.note && (
                      <div style={{ marginTop: 10, fontSize: 12.5, color: '#fbbf24', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 9, padding: '8px 10px' }}>
                        Admin note: {e.note}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                      {isUnresolved && (
                        <button disabled={busy === e.id} onClick={() => setStatus(e.id, 'resolved')} style={{ padding: '7px 13px', borderRadius: 9, border: 'none', background: '#10b981', color: '#052e1b', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                          <Check size={13} style={{ verticalAlign: '-2px' }} /> Mark resolved
                        </button>
                      )}
                      {e.status !== 'ignored' && (
                        <button disabled={busy === e.id} onClick={() => setStatus(e.id, 'ignored')} style={{ padding: '7px 13px', borderRadius: 9, border: `1px solid ${ace.cardBorder}`, background: 'transparent', color: ace.sub, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                          <Trash2 size={13} style={{ verticalAlign: '-2px' }} /> Ignore
                        </button>
                      )}
                      {e.status === 'ignored' && (
                        <button disabled={busy === e.id} onClick={() => setStatus(e.id, 'open')} style={{ padding: '7px 13px', borderRadius: 9, border: `1px solid ${ace.cardBorder}`, background: 'transparent', color: ace.sub, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                          Reopen
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 220 }}>
                        <input
                          value={noteDraft[e.id] ?? ''}
                          onChange={(ev) => setNoteDraft((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                          placeholder="Add an admin note…"
                          style={{ flex: 1, padding: '8px 10px', background: ace.inputBg, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, color: ace.text, fontSize: 12.5, outline: 'none' }}
                        />
                        <button disabled={busy === e.id || !(noteDraft[e.id] ?? '').trim()} onClick={() => saveNote(e.id)} style={{ padding: '8px 13px', borderRadius: 9, border: `1px solid ${ace.cardBorder}`, background: 'transparent', color: ace.accentText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                          <StickyNote size={13} style={{ verticalAlign: '-2px' }} /> Save note
                        </button>
                      </div>
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