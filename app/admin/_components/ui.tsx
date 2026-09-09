'use client'

import React from 'react'

export const ace = {
  card: 'var(--ace-card)',
  cardBorder: 'var(--ace-card-border)',
  text: 'var(--ace-text)',
  sub: 'var(--ace-sub)',
  accent: '#0A193D',
  positive: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#60a5fa',
  inputBg: 'var(--ace-input-bg)',
  softBg: 'var(--ace-soft-bg)',
  accentText: 'var(--ace-accent-text)',
}

export function Card({ title, icon, children, style, right }: { title?: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties; right?: React.ReactNode }) {
  return (
    <div className="ace-card" style={{ background: ace.card, border: `1px solid ${ace.cardBorder}`, borderRadius: 16, padding: 20, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14.5, color: ace.text, marginBottom: 16 }}>
          {icon && <span style={{ color: ace.accent, display: 'flex' }}>{icon}</span>}
          <span style={{ flex: 1 }}>{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'green' | 'red' | 'amber' | 'blue' | 'violet' }) {
  const map: Record<string, { bg: string; fg: string }> = {
    default: { bg: 'rgba(148,163,184,0.15)', fg: '#cbd5e1' },
    green: { bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
    red: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171' },
    amber: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24' },
    blue: { bg: 'rgba(96,165,250,0.15)', fg: '#93c5fd' },
    violet: { bg: 'rgba(10,25,61,0.15)', fg: '#0A193D' },
  }
  const t = map[tone]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: t.bg, color: t.fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export function levelTone(level: string | undefined): 'default' | 'green' | 'red' | 'amber' | 'blue' | 'violet' {
  if (level === 'critical') return 'red'
  if (level === 'warning') return 'amber'
  return 'blue'
}

export function statusTone(status: string | undefined): 'default' | 'green' | 'red' | 'amber' | 'blue' | 'violet' {
  if (status === 'resolved' || status === 'closed') return 'green'
  if (status === 'open') return 'red'
  if (status === 'ignored' || status === 'in_progress') return 'amber'
  if (status === 'reactivate' || status === 'ACTIVE') return 'green'
  if (status === 'SUSPENDED' || status === 'DELETED') return 'red'
  return 'default'
}

export function Skeleton({ height = 16, width = '100%' }: { height?: number | string; width?: number | string }) {
  return (
    <div style={{ height, width, borderRadius: 8, background: 'rgba(148,163,184,0.12)', animation: 'admin-pulse 1.4s ease-in-out infinite' }} />
  )
}

export function LoadingCards({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <Skeleton height={14} width="40%" />
          <div style={{ marginTop: 10 }}>
            <Skeleton height={12} width="90%" />
          </div>
          <div style={{ marginTop: 8 }}>
            <Skeleton height={12} width="70%" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, desc }: { icon?: React.ReactNode; title: string; desc?: string }) {
  return (
    <div style={{ padding: '36px 20px', textAlign: 'center', color: ace.sub }}>
      {icon && <div style={{ marginBottom: 10 }}>{icon}</div>}
      <div style={{ fontSize: 14.5, fontWeight: 600, color: ace.text, marginBottom: 4 }}>{title}</div>
      {desc && <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{desc}</div>}
    </div>
  )
}

export function NotReadyBanner({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', fontSize: 13, color: '#fbbf24', lineHeight: 1.6 }}>
      <strong>Admin tables are not ready.</strong> Apply <code>supabase/migrations/20260907000000_admin_dashboard.sql</code> (
      <code>supabase db push</code> or the Supabase SQL editor), then refresh.
      {' '}
      <button onClick={onRefresh} style={{ marginTop: 8, background: 'transparent', border: `1px solid rgba(245,158,11,0.4)`, color: '#fbbf24', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
        Refresh
      </button>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 13, color: '#f87171', lineHeight: 1.5 }}>
      {message}
    </div>
  )
}

export function PageHeader({ title, desc, right }: { title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: ace.text, margin: 0, letterSpacing: '-0.3px' }}>{title}</h1>
        {desc && <p style={{ fontSize: 13, color: ace.sub, margin: '4px 0 0 0' }}>{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export function Pagination({ page, perPage, total, onPage, onPerPage }: { page: number; perPage: number; total: number; onPage: (p: number) => void; onPerPage?: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  const next = Math.min(pages, page + 1)
  const prev = Math.max(1, page - 1)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, color: ace.sub }}>
        {total === 0 ? 'No results' : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onPerPage && (
          <select
            value={perPage}
            onChange={(e) => onPerPage(Number(e.target.value))}
            style={{ background: ace.inputBg, color: ace.text, border: `1px solid ${ace.cardBorder}`, borderRadius: 8, padding: '6px 8px', fontSize: 12.5 }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
        <button onClick={() => onPage(prev)} disabled={page <= 1} style={pageBtnStyle(page <= 1)}>- Prev</button>
        <span style={{ fontSize: 12.5, color: ace.sub }}>{page} / {pages}</span>
        <button onClick={() => onPage(next)} disabled={page >= pages} style={pageBtnStyle(page >= pages)}>Next +</button>
      </div>
    </div>
  )
}

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 8, border: `1px solid ${ace.cardBorder}`,
    background: disabled ? 'transparent' : ace.inputBg, color: disabled ? '#475569' : ace.text,
    fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  }
}