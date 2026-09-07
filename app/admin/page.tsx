'use client'

import { useEffect } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { Users, UserCheck, UserPlus, AlertTriangle, Inbox, MessageSquare, Activity } from 'lucide-react'
import { useApi } from './_components/useApi'
import { Card, Skeleton, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, ace } from './_components/ui'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  SUSPENDED: '#f59e0b',
  DELETED: '#64748b',
}

export default function AdminOverviewPage() {
  const { data, loading, error, notReady, reload } = useApi<{
    stats: { totalUsers: number; activeUsers: number; newThisWeek: number; errors24h: number; openErrors: number; pendingReviews: number; feedbackOpen: number }
    signups: { date: string; count: number }[]
    statusBreakdown: { status: string; count: number }[]
    recentActivity: { id: string; description: string; activity_type: string; created_at: string; user_email: string }[]
  }>('/api/admin/overview')

  // Auto-refresh running stats every 30s while the overview is open.
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) reload()
    }, 30_000)
    return () => clearInterval(t)
  }, [reload])

  if (notReady) {
    return (
      <>
        <PageHeader title="Overview" desc="High-level admin stats at a glance" />
        <NotReadyBanner onRefresh={reload} />
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Overview" desc="High-level admin stats at a glance" />
        <ErrorBanner message={error} />
      </>
    )
  }

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Overview" desc="High-level admin stats at a glance" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 18 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={96} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Skeleton height={280} />
          <Skeleton height={280} />
        </div>
      </>
    )
  }

  const s = data.stats
  const totalStatus = (data.statusBreakdown ?? []).reduce((a: number, b: { status: string; count: number }) => a + b.count, 0)
  const statsCards = [
    { label: 'Total users', value: s.totalUsers, icon: <Users size={17} />, tone: '#818cf8' },
    { label: 'Active (7d)', value: s.activeUsers, icon: <UserCheck size={17} />, tone: '#34d399' },
    { label: 'New this week', value: s.newThisWeek, icon: <UserPlus size={17} />, tone: '#60a5fa' },
    { label: 'Errors (24h)', value: s.errors24h, icon: <AlertTriangle size={17} />, tone: s.errors24h > 0 ? '#f87171' : '#34d399' },
    { label: 'Open errors', value: s.openErrors, icon: <AlertTriangle size={17} />, tone: s.openErrors > 0 ? '#f87171' : '#64748b' },
    { label: 'Pending review', value: s.pendingReviews, icon: <Inbox size={17} />, tone: s.pendingReviews > 0 ? '#fbbf24' : '#64748b' },
    { label: 'Open feedback', value: s.feedbackOpen, icon: <MessageSquare size={17} />, tone: s.feedbackOpen > 0 ? '#a78bfa' : '#64748b' },
  ]

  return (
    <div>
      <PageHeader title="Overview" desc="High-level admin stats at a glance" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        {statsCards.map((c) => (
          <div key={c.label} style={{ background: ace.card, border: `1px solid ${ace.cardBorder}`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.tone, fontSize: 12.5, fontWeight: 600 }}>
              {c.icon} {c.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: ace.text, marginTop: 8, letterSpacing: '-0.5px' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card title="New signups (last 14 days)" icon={<Activity size={16} />} style={{ minWidth: 0 }}>
          {data.signups.every((d) => d.count === 0) ? (
            <EmptyState title="No signups yet" desc="Growth chart will appear here." />
          ) : (
            <div style={{ width: '100%', height: 250, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.signups} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ace-card-border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--ace-sub)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--ace-sub)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--ace-card)', border: '1px solid var(--ace-card-border)', borderRadius: 10, fontSize: 12, color: 'var(--ace-text)' }} labelStyle={{ color: 'var(--ace-text)' }} itemStyle={{ color: 'var(--ace-sub)' }} />
                  <Area type="monotone" dataKey="count" name="Signups" stroke="#818cf8" strokeWidth={2} fill="url(#gSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Users by account status" icon={<Users size={16} />} style={{ minWidth: 0 }}>
          {totalStatus === 0 ? (
            <EmptyState title="No user data" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: '100%', height: 140, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" innerRadius={40} outerRadius={64} paddingAngle={2} stroke="none">
                      {data.statusBreakdown.map((e) => (
                        <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--ace-card)', border: '1px solid var(--ace-card-border)', borderRadius: 10, fontSize: 12, color: 'var(--ace-text)' }} itemStyle={{ color: 'var(--ace-sub)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.statusBreakdown.map((e) => (
                  <div key={e.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: STATUS_COLORS[e.status] ?? '#64748b' }} />
                    <span style={{ color: ace.sub, flex: 1, textTransform: 'capitalize' }}>{e.status.toLowerCase()}</span>
                    <span style={{ color: ace.text, fontWeight: 700 }}>{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent activity" icon={<Activity size={16} />}>
        {data.recentActivity.length === 0 ? (
          <EmptyState title="No activity logged yet" desc="Sign-ins, imports and feedback will appear here as users interact with Finlo." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.recentActivity.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--ace-card-border)' }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: ace.softBg, color: ace.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: ace.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.description || a.activity_type}
                  </div>
                  <div style={{ fontSize: 11.5, color: ace.sub }}>{a.user_email || 'unknown user'}</div>
                </div>
                <span style={{ fontSize: 11.5, color: ace.sub, flexShrink: 0 }}>
                  {new Date(a.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}