'use client'

import { useState, useEffect, useCallback } from 'react'
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { TrendingUp, Store, Tag } from 'lucide-react'
import { NOT_READY_CODE } from '../_components/useApi'
import { Card, Badge, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, Skeleton, ace } from '../_components/ui'

interface SeriesPoint { date: string; signups: number; txn_volume: number; income: number; expense: number }
interface AnalyticsData {
  series: SeriesPoint[]
  topMerchants: { merchant: string; total: number }[]
  topCategories: { category: string; total: number }[]
  totals: { income: number; expense: number; volume: number; signups: number }
}

const RANGES = [
  { key: 'daily', label: 'Last 14 days' },
  { key: 'weekly', label: 'Last 28 days' },
  { key: 'monthly', label: 'Last 90 days' },
] as const

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('daily')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.status === 409 && json.code === NOT_READY_CODE) setNotReady(true)
      else if (!res.ok) setError(json.error || `Request failed (${res.status})`)
      else setData(json)
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { void (async () => await load())() }, [load])

  if (notReady) {
    return (
      <>
        <PageHeader title="Analytics" desc="User growth and transaction trends across all users (aggregated server-side)" />
        <NotReadyBanner onRefresh={load} />
      </>
    )
  }

  const hasSeries = (data?.series ?? []).some((p) => p.signups + p.income + p.expense + p.txn_volume > 0)

  return (
    <div>
      <PageHeader
        title="Analytics"
        desc="User growth and transaction trends across all users (aggregated server-side)"
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{ padding: '7px 13px', borderRadius: 9, border: `1px solid ${range === r.key ? '#818cf8' : ace.cardBorder}`, background: range === r.key ? ace.softBg : 'transparent', color: range === r.key ? ace.accentText : ace.sub, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {loading && !data ? (
        <div className="ace-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      ) : !data ? (
        <EmptyState title="No analytics yet" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 16 }}>
            <MiniStat label="Signups" value={`${data.totals.signups}`} tone="#818cf8" />
            <MiniStat label="Income" value={`${fmt(data.totals.income)}`} tone="#10b981" />
            <MiniStat label="Expenses" value={`${fmt(data.totals.expense)}`} tone="#f87171" />
            <MiniStat label="Net" value={`${fmt(data.totals.income - data.totals.expense)}`} tone={data.totals.income - data.totals.expense >= 0 ? '#34d399' : '#f87171'} />
          </div>

          <div className="ace-grid-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card title="Income vs expenses" icon={<TrendingUp size={16} />} style={{ minWidth: 0 }}>
              {!hasSeries ? (
                <EmptyState title="No transactions yet" desc="Charts will populate as users add data." />
              ) : (
                <div style={{ width: '100%', height: 280, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.series} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ace-card-border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--ace-sub)', fontSize: 9.5 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'var(--ace-sub)', fontSize: 9.5 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v))} />
                      <Tooltip contentStyle={{ background: 'var(--ace-card)', border: '1px solid var(--ace-card-border)', borderRadius: 10, fontSize: 12, color: 'var(--ace-text)' }} labelStyle={{ color: 'var(--ace-text)' }} />
                      <Legend wrapperStyle={{ fontSize: 11.5, color: 'var(--ace-sub)' }} />
                      <Line type="monotone" dataKey="income" name="Income" stroke="#34d399" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expense" name="Expenses" stroke="#f87171" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Signups" icon={<TrendingUp size={16} />} style={{ minWidth: 0 }}>
              {!hasSeries ? (
                <EmptyState title="No signups yet" />
              ) : (
                <div style={{ width: '100%', height: 280, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.series} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gAnalyticsSignups" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: 'var(--ace-sub)', fontSize: 9.5 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'var(--ace-sub)', fontSize: 9.5 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: 'var(--ace-card)', border: '1px solid var(--ace-card-border)', borderRadius: 10, fontSize: 12, color: 'var(--ace-text)' }} labelStyle={{ color: 'var(--ace-text)' }} />
                      <Area type="monotone" dataKey="signups" name="Signups" stroke="#818cf8" strokeWidth={2} fill="url(#gAnalyticsSignups)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="ace-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card title="Transaction volume by day" icon={<TrendingUp size={16} />} style={{ minWidth: 0 }}>
              {!hasSeries ? (
                <EmptyState title="No data yet" />
              ) : (
                <div style={{ width: '100%', height: 240, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.series} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ace-card-border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--ace-sub)', fontSize: 9.5 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'var(--ace-sub)', fontSize: 9.5 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v))} />
                      <Tooltip contentStyle={{ background: 'var(--ace-card)', border: '1px solid var(--ace-card-border)', borderRadius: 10, fontSize: 12, color: 'var(--ace-text)' }} labelStyle={{ color: 'var(--ace-text)' }} cursor={{ fill: 'var(--ace-soft-bg)' }} />
                      <Bar dataKey="txn_volume" name="Volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card title="Top merchants" icon={<Store size={16} />}>
                {data.topMerchants.length === 0 ? <EmptyState title="No merchant data" desc="Merchant names appear on imported transactions." /> : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.topMerchants.map((m, i) => <RankRow key={m.merchant} rank={i + 1} label={m.merchant} value={m.total} />)}
                  </div>
                )}
              </Card>
              <Card title="Top categories" icon={<Tag size={16} />}>
                {data.topCategories.length === 0 ? <EmptyState title="No category data" /> : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.topCategories.map((c, i) => <RankRow key={c.category} rank={i + 1} label={c.category} value={c.total} />)}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ background: ace.card, border: `1px solid ${ace.cardBorder}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: ace.sub }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: tone, marginTop: 4 }}>{value}</div>
    </div>
  )
}

function RankRow({ rank, label, value }: { rank: number; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--ace-card-border)' }}>
      <span style={{ width: 20, height: 20, borderRadius: 6, background: ace.softBg, color: ace.accentText, fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{rank}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: ace.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <Badge>{fmt(value)}</Badge>
    </div>
  )
}