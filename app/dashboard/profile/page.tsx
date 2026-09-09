'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, ArrowLeftRight, Calendar, PieChart,
  BarChart2, Bot, Settings, Bell, Moon, Sun, LogOut,
  User, MoreHorizontal, ShieldCheck, Mail, Check,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark'

interface Colors {
  bg: string; sidebar: string; card: string; cardBorder: string
  text: string; textSub: string; accent: string; accentLight: string
  positive: string; danger: string; warning: string; inputBg: string; hover: string
}

function buildColors(isDark: boolean): Colors {
  return {
    bg: isDark ? 'linear-gradient(160deg,#0b1220 0%,#111a35 55%,#0b1024 100%)' : 'linear-gradient(160deg,#142453 0%,#e9edfb 55%,#0A193D 100%)',
    sidebar: isDark ? '#1e293b' : '#ffffff',
    card: isDark ? "linear-gradient(145deg,rgba(43,55,84,0.7),rgba(26,34,60,0.42))" : 'linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.45))',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    accent: '#0A193D',
    accentLight: isDark ? 'rgba(10,25,61,0.18)' : 'rgba(10,25,61,0.08)',
    positive: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    inputBg: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.65)',
    hover: isDark ? '#334155' : '#f1f5f9',
  }
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={18} /> },
  { id: 'upcoming', label: 'Upcoming', icon: <Calendar size={18} /> },
  { id: 'budgets', label: 'Budgets', icon: <PieChart size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { id: 'ai', label: 'AI Assistant', icon: <Bot size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]

export default function ProfilePage() {
  const [theme, setTheme] = useState<Theme>('light')
  const [hasAuth, setHasAuth] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const isDark = theme === 'dark'
  const colors = buildColors(isDark)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)
      const u = data.session.user
      setUser(u)
      const currentName =
        (u.user_metadata?.full_name as string) ||
        (u.user_metadata?.name as string) ||
        u.email?.split('@')[0] ||
        ''
      setName(currentName)
      setEmail(u.email || '')
    }

    checkAuth()
  }, [supabase.auth, router])

  const firstName = (name || 'User').split(' ')[0] || 'User'
  const initial = firstName.charAt(0).toUpperCase() || 'U'

  const handleGo = (id: string) => {
    if (id === 'settings') {
      router.push('/dashboard/settings')
      return
    }
    router.push('/dashboard')
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      })
      if (error) {
        alert(error.message)
        return
      }
      alert('Name updated successfully! ✓')
    } catch {
      alert('Failed to update name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!email.trim()) return
    setIsSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() })
      if (error) {
        alert(error.message)
        return
      }
      alert('Email change initiated. Please verify the new email to confirm the update.')
    } catch {
      alert('Failed to update email')
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!hasAuth) return null

  return (
    // Robust app-shell: root is full height, sidebar fixed, only main scrolls.
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: colors.bg, color: colors.text, fontFamily: "'Montserrat', -apple-system, sans-serif", fontSize: 14 }}>
      {/* ── Left Sidebar ── */}
      <aside className="finlo-ps-aside" style={{
        width: 220, height: '100vh', flexShrink: 0, zIndex: 10,
        background: colors.sidebar, borderRight: `1px solid ${colors.cardBorder}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>F</div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.4px' }}>Fin<span style={{ color: colors.accent }}>lo</span></span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = false
            return (
              <button key={item.id} onClick={() => handleGo(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: active ? colors.accentLight : 'transparent',
                  color: active ? colors.accent : colors.textSub,
                  fontWeight: active ? 600 : 400, fontSize: 13.5,
                  marginBottom: 2, textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = colors.hover }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
            )
          })}
          <button onClick={() => router.push('/dashboard/profile')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: colors.accentLight, color: colors.accent,
              fontWeight: 600, fontSize: 13.5, marginBottom: 2, textAlign: 'left',
            }}
          >
            <span style={{ flexShrink: 0 }}><User size={18} /></span>
            <span style={{ whiteSpace: 'nowrap' }}>Profile</span>
          </button>
        </nav>

        {/* Upgrade Banner */}
        <div style={{ margin: '0 12px 14px', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(20,36,83,0.12),rgba(10,25,61,0.08))', border: '1px solid rgba(10,25,61,0.2)' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>👑</div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: colors.text }}>Upgrade to Premium</div>
          <div style={{ fontSize: 11.5, color: colors.textSub, marginBottom: 10, lineHeight: 1.4 }}>Unlock advanced analytics, custom categories and more.</div>
          <button style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: `1px solid ${colors.accent}`, background: 'transparent', color: colors.accent, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Upgrade Now
          </button>
        </div>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'User'}</div>
            <div style={{ fontSize: 11, color: colors.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'No email'}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSub, padding: 2 }}><MoreHorizontal size={16} /></button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="finlo-ps-topbar" style={{ flexShrink: 0, padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.cardBorder}`, background: colors.card }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard" className="finlo-ps-back" style={{ display: 'none', width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>←</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>Profile</div>
              <div style={{ fontSize: 12, color: colors.textSub }}>Manage your account details</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="finlo-ps-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 28px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Profile Header */}
            <div style={{ padding: '22px 24px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color="#0A193D" /> Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24, flexShrink: 0 }}>{initial}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: colors.text }}>{name || 'User'}</div>
                  <div style={{ fontSize: 13, color: colors.textSub }}>{user?.email || 'No email'}</div>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div style={{ padding: '22px 24px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={16} color="#0A193D" /> Display Name</div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textSub, marginBottom: 6 }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: colors.textSub }}>Shown on your dashboard. Stored against your account.</span>
                <button onClick={handleSaveName} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: 'none', background: colors.accent, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                  <Check size={14} /> {isSaving ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </div>

            {/* Email */}
            <div style={{ padding: '22px 24px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={16} color="#0A193D" /> Email</div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textSub, marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: colors.textSub }}>Changing email requires verification.</span>
                <button onClick={handleSaveEmail} disabled={isSavingEmail} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: 'none', background: colors.accent, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: isSavingEmail ? 0.6 : 1 }}>
                  <Check size={14} /> {isSavingEmail ? 'Saving...' : 'Save Email'}
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div style={{ padding: '22px 24px', borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><MoreHorizontal size={16} color="#0A193D" /> Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textSub, marginBottom: 6 }}>User ID</label>
                  <input
                    type="text"
                    value={user?.id || ''}
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.textSub, fontSize: 13.5, outline: 'none', cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: colors.textSub, marginBottom: 6 }}>Account Created</label>
                  <input
                    type="text"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.textSub, fontSize: 13.5, outline: 'none', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 18px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: colors.danger, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
