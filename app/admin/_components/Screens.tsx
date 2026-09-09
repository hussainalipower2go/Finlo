import Link from 'next/link'
import { ShieldX, Database, ChevronLeft } from 'lucide-react'

const colors = {
  bg: 'var(--ace-shell-bg)',
  card: 'var(--ace-card)',
  border: 'var(--ace-card-border)',
  text: 'var(--ace-text)',
  sub: 'var(--ace-sub)',
  accent: '#0A193D',
}

function Shell({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Montserrat', -apple-system, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 520, width: '100%', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 20, padding: '36px 32px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 18px auto', borderRadius: 16, background: 'rgba(10,25,61,0.12)', border: '1px solid rgba(10,25,61,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accent }}>
          {icon}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: '0 0 8px 0' }}>{title}</h1>
        <p style={{ fontSize: 14, color: colors.sub, lineHeight: 1.6, margin: '0 0 24px 0' }}>{desc}</p>
        {children}
      </div>
    </div>
  )
}

export function ForbiddenScreen({ reason = 'not_admin' }: { reason?: string }) {
  const desc =
    reason === 'inactive'
      ? 'Your admin account is not active. Contact another administrator if you believe this is a mistake.'
      : 'This area is restricted to administrators. Sign in with an admin account to continue.'
  return (
    <Shell icon={<ShieldX size={26} />} title="You do not have permission to access this area." desc={desc}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: colors.accent, color: '#fff', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
        >
          <ChevronLeft size={16} /> Back to app
        </Link>
      </div>
    </Shell>
  )
}

export function NotReadyScreen() {
  return (
    <Shell
      icon={<Database size={26} />}
      title="Admin database is not ready yet"
      desc={`The admin tables shipped in a migration but have not been applied to this database. Run supabase db push, or paste the file into the Supabase SQL editor, then refresh.`}
    >
      <code style={{ display: 'block', padding: '10px 12px', background: 'var(--ace-input-bg)', border: '1px solid var(--ace-card-border)', borderRadius: 10, fontSize: 12, color: colors.sub, marginBottom: 16, wordBreak: 'break-all' }}>
        supabase/migrations/20260907000000_admin_dashboard.sql
      </code>
      <Link
        href="/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: colors.accent, color: '#fff', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
      >
        <ChevronLeft size={16} /> Back to app
      </Link>
    </Shell>
  )
}