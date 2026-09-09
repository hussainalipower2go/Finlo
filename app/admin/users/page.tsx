'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { Search, ShieldCheck, ShieldX, UserX, UserCheck, ChevronDown } from 'lucide-react'
import { NOT_READY_CODE } from '../_components/useApi'
import { Card, Badge, statusTone, LoadingCards, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, Pagination, ace } from '../_components/ui'
import type { AdminUser } from '@/lib/admin/types'

function Avatar({ name, email }: { name: string; email: string }) {
  const initial = (name || email || '?').charAt(0).toUpperCase()
  return (
    <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#142453,#0A193D)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </span>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ search: debouncedSearch, role, status, page: String(page), perPage: String(perPage) })
      const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.status === 409 && json.code === NOT_READY_CODE) {
        setNotReady(true)
        setUsers(null)
      } else if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`)
      } else {
        setUsers(json.users)
        setTotal(json.total)
      }
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, role, status, page, perPage])

  useEffect(() => {
    void (async () => await load())()
  }, [load])

  const runAction = async (userId: string, action: 'suspend' | 'reactivate' | 'promote' | 'demote' | 'deactivate') => {
    if (actingId) return
    const dangerous = action === 'deactivate' || action === 'demote'
    if (dangerous && !window.confirm(`Are you sure you want to ${action} this user?`)) return
    setActingId(userId)
    setActionMsg(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const json = await res.json()
      if (!res.ok) {
        setActionMsg({ ok: false, text: json.error || 'Failed' })
      } else {
        setActionMsg({ ok: true, text: `User ${action}d` })
        setUsers((prev) =>
          prev
            ? prev.map((u) => {
                if (u.id !== userId) return u
                if (action === 'suspend') return { ...u, account_status: 'SUSPENDED' }
                if (action === 'reactivate') return { ...u, account_status: 'ACTIVE' }
                if (action === 'promote') return { ...u, role: 'ADMIN' }
                if (action === 'demote') return { ...u, role: 'USER' }
                return { ...u, account_status: 'DELETED' }
              })
            : prev
        )
      }
    } catch {
      setActionMsg({ ok: false, text: 'Network error' })
    } finally {
      setActingId(null)
    }
  }

  const roleOptions = useMemo(() => ['', 'ADMIN', 'USER'], [])
  const statusOptions = useMemo(() => ['', 'ACTIVE', 'SUSPENDED', 'DELETED'], [])

  if (notReady) {
    return (
      <>
        <PageHeader title="Users" desc="Manage roles, account status and user data" />
        <NotReadyBanner onRefresh={load} />
      </>
    )
  }

  return (
    <div>
      <PageHeader title="Users" desc="Manage roles, account status and user data" />

      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: ace.sub, display: 'flex' }}>
              <Search size={15} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              style={{ width: '100%', padding: '9px 12px 9px 34px', background: ace.inputBg, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, color: ace.text, fontSize: 13, outline: 'none' }}
            />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} style={{ background: ace.inputBg, color: ace.text, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, padding: '9px 10px', fontSize: 13 }}>
            {roleOptions.map((r) => <option key={r} value={r}>{r === '' ? 'All roles' : r}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} style={{ background: ace.inputBg, color: ace.text, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, padding: '9px 10px', fontSize: 13 }}>
            {statusOptions.map((s) => <option key={s} value={s}>{s === '' ? 'All statuses' : s}</option>)}
          </select>
        </div>

        {actionMsg && (
          <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 9, fontSize: 12.5, background: actionMsg.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${actionMsg.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, color: actionMsg.ok ? '#34d399' : '#f87171' }}>
            {actionMsg.text}
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        {loading && !users ? (
          <LoadingCards rows={3} />
        ) : !users || (users.length === 0) ? (
          <EmptyState icon={<UserX size={22} />} title="No users found" desc="Try clearing the search or filters." />
        ) : (
          <>
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Last active', 'Data'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: ace.sub, padding: '8px 10px', borderBottom: `1px solid ${ace.cardBorder}` }}>{h}</th>
                  ))}
                  <th style={{ width: 210 }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <Fragment key={u.id}>
                    <tr onClick={() => setExpanded(expanded === u.id ? null : u.id)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--ace-card-border)' }}>
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.full_name} email={u.email} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: ace.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{u.full_name || '—'}</div>
                            <div style={{ fontSize: 11.5, color: ace.sub }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <Badge tone={u.role === 'ADMIN' ? 'violet' : 'default'}>{u.role}</Badge>
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <Badge tone={statusTone(u.account_status)}>{u.account_status}</Badge>
                      </td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: ace.sub, whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: ace.sub, whiteSpace: 'nowrap' }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: ace.sub, whiteSpace: 'nowrap' }}>{u.has_data ? `${u.transaction_count} entries` : 'empty'}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <UserActions u={u} actingId={actingId} onAction={runAction} />
                        <span style={{ display: 'inline-flex', color: ace.sub, marginLeft: 2 }}><ChevronDown size={14} /></span>
                      </td>
                      </tr>
                      {expanded === u.id && (
                        <tr>
                          <td colSpan={7} style={{ padding: '4px 12px 14px 12px', background: 'var(--ace-soft-bg)' }}>
                            <UserDetail u={u} />
                          </td>
                        </tr>
                      )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-users-cards">
            {users.map((u) => (
              <UserCard
                key={u.id}
                u={u}
                actingId={actingId}
                expanded={expanded === u.id}
                onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
                onAction={runAction}
              />
            ))}
          </div>
          </>
        )}

        {users && users.length > 0 && (
          <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1) }} />
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--ace-input-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: ace.sub, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: ace.text }}>{value}</div>
    </div>
  )
}

function iconBtn(color: string) {
  return {
    marginRight: 4, padding: 6, borderRadius: 8, border: `1px solid ${ace.cardBorder}`, background: 'transparent',
    color, cursor: 'pointer' as const, opacity: 0.85,
  }
}

function UserActions({ u, actingId, onAction }: { u: AdminUser; actingId: string | null; onAction: AdminAction }) {
  return (
    <>
      {u.account_status === 'ACTIVE' ? (
        <button disabled={actingId === u.id} onClick={() => onAction(u.id, 'suspend')} title="Suspend" style={iconBtn('#f59e0b')}>
          <ShieldX size={15} />
        </button>
      ) : (
        <button disabled={actingId === u.id} onClick={() => onAction(u.id, 'reactivate')} title="Reactivate" style={iconBtn('#10b981')}>
          <UserCheck size={15} />
        </button>
      )}
      {u.role === 'ADMIN' ? (
        <button disabled={actingId === u.id} onClick={() => onAction(u.id, 'demote')} title="Demote to user" style={iconBtn('#f87171')}>
          <ShieldCheck size={15} />
        </button>
      ) : (
        <button disabled={actingId === u.id} onClick={() => onAction(u.id, 'promote')} title="Make admin" style={iconBtn('#0A193D')}>
          <ShieldCheck size={15} />
        </button>
      )}
      <button disabled={actingId === u.id} onClick={() => onAction(u.id, 'deactivate')} title="Deactivate" style={iconBtn('#64748b')}>
        <UserX size={15} />
      </button>
    </>
  )
}

function UserDetail({ u }: { u: AdminUser }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, fontSize: 12.5 }}>
        <Stat label="Currency" value={u.currency || 'PKR'} />
        <Stat label="Monthly income" value={u.monthly_income != null ? Number(u.monthly_income).toLocaleString() : '—'} />
        <Stat label="Accounts with data" value={u.has_data ? `Yes (${u.transaction_count})` : 'No'} />
        <Stat label="User ID" value={u.id.slice(0, 8) + '…'} />
      </div>
      <p style={{ marginTop: 10, fontSize: 11.5, color: ace.sub, lineHeight: 1.5 }}>
        <ShieldCheck size={11} style={{ verticalAlign: '-1px' }} /> Role changes and status actions are recorded in the audit log.
      </p>
    </div>
  )
}

function UserCard({ u, actingId, expanded, onToggle, onAction }: { u: AdminUser; actingId: string | null; expanded: boolean; onToggle: () => void; onAction: AdminAction }) {
  return (
    <div style={{ background: 'var(--ace-soft-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar name={u.full_name} email={u.email} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ace.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || '—'}</div>
          <div style={{ fontSize: 12, color: ace.sub, marginTop: 1 }}>{u.email}</div>
        </div>
        <button aria-label="Toggle details" onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, border: `1px solid ${ace.cardBorder}`, background: 'transparent', color: ace.sub, cursor: 'pointer' }}>
          <ChevronDown size={15} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.16s' }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <Badge tone={u.role === 'ADMIN' ? 'violet' : 'default'}>{u.role}</Badge>
        <Badge tone={statusTone(u.account_status)}>{u.account_status}</Badge>
        <span style={{ fontSize: 11.5, color: ace.sub, alignSelf: 'center' }}>Joined {new Date(u.created_at).toLocaleDateString()}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, fontSize: 12, color: ace.sub }}>
        <span style={{ background: 'var(--ace-input-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 999, padding: '4px 10px', fontSize: 11.5 }}>
          <b style={{ color: ace.text, fontWeight: 700 }}>Last active:</b> {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}
        </span>
        <span style={{ background: 'var(--ace-input-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 999, padding: '4px 10px', fontSize: 11.5 }}>
          <b style={{ color: ace.text, fontWeight: 700 }}>Data:</b> {u.has_data ? `${u.transaction_count} entries` : 'empty'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          <UserDetail u={u} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, alignItems: 'center' }}>
        <UserActions u={u} actingId={actingId} onAction={onAction} />
      </div>
    </div>
  )
}

type AdminAction = (id: string, action: 'suspend' | 'reactivate' | 'promote' | 'demote' | 'deactivate') => void