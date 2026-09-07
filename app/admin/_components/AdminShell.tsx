'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, Users, BarChart2, Database, AlertTriangle,
  MessageSquare, Settings, ShieldCheck, LogOut, ExternalLink, Sun, Moon,
} from 'lucide-react'

const NAV = [
  { id: 'overview', label: 'Overview', href: '/admin', icon: <LayoutDashboard size={17} /> },
  { id: 'users', label: 'Users', href: '/admin/users', icon: <Users size={17} /> },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: <BarChart2 size={17} /> },
  { id: 'import-health', label: 'Import Health', href: '/admin/import-health', icon: <Database size={17} /> },
  { id: 'errors', label: 'Errors', href: '/admin/errors', icon: <AlertTriangle size={17} /> },
  { id: 'feedback', label: 'Feedback', href: '/admin/feedback', icon: <MessageSquare size={17} /> },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: <Settings size={17} /> },
]

const colors = {
  bg: 'var(--ace-shell-bg)',
  sidebar: 'var(--ace-sidebar)',
  border: 'var(--ace-sidebar-border)',
  text: 'var(--ace-sidebar-text)',
  sub: 'var(--ace-sidebar-sub)',
  accent: '#818cf8',
  hover: 'rgba(129,140,248,0.1)',
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const activeId = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))?.id ?? 'overview'
  const currentLabel = NAV.find((n) => n.id === activeId)?.label ?? 'Finlo Admin'

  const [viewerEmail, setViewerEmail] = useState('')
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('finlo_theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setViewerEmail(data.user?.email ?? '')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('finlo_theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.classList.toggle('light', !next)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const SidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 18px 14px 18px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <ShieldCheck size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.text, lineHeight: 1.1 }}>Finlo Admin</div>
          <div style={{ fontSize: 10.5, color: colors.sub }}>Internal dashboard</div>
        </div>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.sub, cursor: 'pointer', flexShrink: 0 }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 10px', flex: 1 }}>
        {NAV.map((n) => {
          const active = activeId === n.id
          return (
            <Link
              key={n.id}
              href={n.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9,
                color: active ? colors.text : colors.sub, fontSize: 13.5, fontWeight: active ? 700 : 500,
                background: active ? colors.hover : 'transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: active ? colors.accent : colors.sub }}>{n.icon}</span>
              {n.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '10px 12px 14px 12px', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', fontSize: 12, color: colors.sub }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewerEmail || 'admin'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleSignOut}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.sub, fontSize: 12.5, cursor: 'pointer' }}
          >
            <LogOut size={14} /> Sign out
          </button>
          <Link
            href="/dashboard"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.sub, fontSize: 12.5, textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> App
          </Link>
        </div>
      </div>
    </>
  )

  const MobileNav = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingRight: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <ShieldCheck size={16} />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.text, whiteSpace: 'nowrap' }}>Finlo Admin</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentLabel}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Link
          href="/admin/settings"
          aria-label="Settings"
          title="Settings"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: activeId === 'settings' ? colors.accent : colors.sub, cursor: 'pointer', textDecoration: 'none' }}
        >
          <Settings size={15} />
        </Link>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.sub, cursor: 'pointer' }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.sub, cursor: 'pointer' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )

  const MobileBottomNav = (
    <nav className="admin-bottom-nav" aria-label="Admin sections">
      {NAV.filter((n) => n.id !== 'settings').map((n) => {
        const active = activeId === n.id
        return (
          <Link
            key={n.id}
            href={n.href}
            className={active ? 'admin-bnav-item active' : 'admin-bnav-item'}
          >
            <span className="admin-bnav-icon">{n.icon}</span>
            <span className="admin-bnav-label">{n.label.split(' ')[0]}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'Montserrat', -apple-system, 'Segoe UI', sans-serif" }}>
      <div className="admin-shell-row" style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Desktop sidebar */}
        <aside className="admin-sidebar" style={{ width: 216, flexShrink: 0, background: colors.sidebar, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
          {SidebarContent}
        </aside>

        {/* Mobile top header */}
        <div className="admin-mobile-header" style={{ display: 'none', position: 'sticky', top: 0, zIndex: 30, padding: '10px 12px' }}>
          {MobileNav}
        </div>

        <main className="admin-main-pad" style={{ flex: 1, minWidth: 0, padding: '24px 28px 48px 28px' }}>
          {children}
        </main>
      </div>

      {MobileBottomNav}
    </div>
  )
}