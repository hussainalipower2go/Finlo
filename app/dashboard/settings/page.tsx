'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  getPushStatus, enablePush, disablePush, notifPref, setNotifPref,
  NOTIF_PREF_BILLS, NOTIF_PREF_BUDGET, NOTIF_PREF_INCOME, type PushStatus,
} from '@/lib/push'
import {
  LayoutDashboard, ArrowLeftRight, Calendar, PieChart,
  BarChart2, Bot, Settings, Bell, Moon, Sun,
  User, MoreHorizontal, Download, Trash2,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark'

interface Colors {
  bg: string; sidebar: string; card: string; cardBorder: string
  text: string; textSub: string; accent: string; accentSoft: string
  positive: string; danger: string; warning: string; inputBg: string; hover: string
}

function buildColors(isDark: boolean): Colors {
  return {
    bg: isDark ? 'linear-gradient(160deg,#0b1220 0%,#111a35 55%,#0b1024 100%)' : 'linear-gradient(160deg,#f4f6ff 0%,#e9edfb 55%,#f7f8ff 100%)',
    sidebar: isDark ? '#1e293b' : '#ffffff',
    card: isDark ? "linear-gradient(145deg,rgba(43,55,84,0.7),rgba(26,34,60,0.42))" : 'linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.45))',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    accent: '#6366f1',
    accentSoft: isDark ? 'rgba(99,102,241,0.15)' : '#eef0ff',
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
]

const CURRENCIES = ['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR']

function Toggle({ on, onClick, colors }: { on: boolean; onClick: () => void; colors: Colors }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 44, height: 24, borderRadius: 999, border: 'none',
        background: on ? colors.accent : colors.cardBorder,
        position: 'relative', cursor: 'pointer', flexShrink: 0, padding: 0,
        transition: 'background 0.12s ease',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)', transition: 'left 0.12s ease',
        }}
      />
    </button>
  )
}

function SectionCard({ icon, title, children, colors }: { icon: React.ReactNode; title: string; children: React.ReactNode; colors: Colors }) {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
        <span style={{ color: colors.accent }}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [appTheme, setAppTheme] = useState<Theme>('light')
  const [hasAuth, setHasAuth] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  const [currency, setCurrency] = useState('PKR')
  const [notifBills, setNotifBills] = useState(() => notifPref(NOTIF_PREF_BILLS, true))
  const [notifBudget, setNotifBudget] = useState(() => notifPref(NOTIF_PREF_BUDGET, true))
  const [notifIncome, setNotifIncome] = useState(() => notifPref(NOTIF_PREF_INCOME, true))
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')

  const [fbType, setFbType] = useState<'bug_report' | 'feature_request' | 'general'>('general')
  const [fbTitle, setFbTitle] = useState('')
  const [fbMessage, setFbMessage] = useState('')
  const [fbSubmitting, setFbSubmitting] = useState(false)
  const [fbMsg, setFbMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const isDark = appTheme === 'dark'
  const colors = buildColors(isDark)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)
      setUser(data.session.user)
    }

    checkAuth()
  }, [supabase.auth, router])

  useEffect(() => {
    void getPushStatus().then(setPushStatus)
  }, [])

  const toggleBills = () => {
    const next = !notifBills
    setNotifBills(next)
    setNotifPref(NOTIF_PREF_BILLS, next)
  }

  const toggleBudget = () => {
    const next = !notifBudget
    setNotifBudget(next)
    setNotifPref(NOTIF_PREF_BUDGET, next)
  }

  const toggleIncome = () => {
    const next = !notifIncome
    setNotifIncome(next)
    setNotifPref(NOTIF_PREF_INCOME, next)
  }

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split('@')[0] ||
    'User'
  const email = user?.email || 'No email'
  const initial = displayName.charAt(0).toUpperCase() || 'U'

  const handleGo = (id: string) => {
    if (id === 'profile') {
      router.push('/dashboard/profile')
      return
    }
    router.push('/dashboard')
  }

  const handleDeleteAccount = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteErr('')
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        const tables = ['transactions', 'income', 'expenses', 'recurring_expenses', 'budgets'] as const
        for (const table of tables) {
          const { error } = await supabase.from(table).delete().eq('user_id', user.id)
          if (error) throw new Error(error.message)
        }
        throw new Error(json.error || 'Could not delete the account')
      }

      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'Could not delete account')
      setDeleting(false)
    }
  }

  const firstName = displayName.split(' ')[0] || 'User'
  const sidebarInitial = firstName.charAt(0).toUpperCase() || 'U'

  const handleSubmitFeedback = async () => {
    if (!fbTitle.trim() || !fbMessage.trim() || fbSubmitting) {
      if (!fbTitle.trim() || !fbMessage.trim()) setFbMsg({ ok: false, text: 'Please add a short title and a message.' })
      return
    }
    setFbSubmitting(true)
    setFbMsg(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: fbType, title: fbTitle.trim(), message: fbMessage.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFbMsg({ ok: false, text: json.error || 'Failed to send feedback' })
      } else {
        setFbMsg({ ok: true, text: 'Thanks! Your feedback has been sent to the team.' })
        setFbTitle('')
        setFbMessage('')
        setFbType('general')
      }
    } catch {
      setFbMsg({ ok: false, text: 'Network error — please try again.' })
    } finally {
      setFbSubmitting(false)
    }
  }

  if (!hasAuth) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: colors.bg, color: colors.text, fontFamily: "'Montserrat', -apple-system, sans-serif", fontSize: 14 }}>
      {/* ── Left Sidebar ── */}
      <aside className="finlo-ps-aside" style={{
        width: 220, height: '100vh', flexShrink: 0, zIndex: 10,
        background: colors.sidebar, borderRight: `1px solid ${colors.cardBorder}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '22px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>F</div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.4px' }}>Fin<span style={{ color: colors.accent }}>lo</span></span>
        </div>

        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleGo(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: 'transparent', color: colors.textSub, fontWeight: 400,
                fontSize: 13.5, marginBottom: 2, textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.hover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          ))}
          <button onClick={() => router.push('/dashboard/settings')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: colors.accentSoft, color: colors.accent,
              fontWeight: 600, fontSize: 13.5, marginBottom: 2, textAlign: 'left',
            }}
          >
            <span style={{ flexShrink: 0 }}><Settings size={18} /></span>
            <span style={{ whiteSpace: 'nowrap' }}>Settings</span>
          </button>
          <button onClick={() => router.push('/dashboard/profile')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'transparent', color: colors.textSub, fontWeight: 400,
              fontSize: 13.5, marginBottom: 2, textAlign: 'left',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.hover }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <span style={{ flexShrink: 0 }}><User size={18} /></span>
            <span style={{ whiteSpace: 'nowrap' }}>Profile</span>
          </button>
        </nav>

        <div style={{ padding: '12px 14px', borderTop: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{sidebarInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: colors.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSub, padding: 2 }}><MoreHorizontal size={16} /></button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="finlo-ps-topbar" style={{ flexShrink: 0, padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.cardBorder}`, background: colors.sidebar }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard" className="finlo-ps-back" style={{ display: 'none', width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>←</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Settings</div>
              <div style={{ fontSize: 12, color: colors.textSub }}>Manage your preferences and account</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setAppTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="finlo-ps-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 28px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profile summary */}
            <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                <span style={{ color: colors.accent }}>👤</span> Profile
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>{initial}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{displayName}</div>
                    <div style={{ fontSize: 13, color: colors.textSub, marginTop: 2 }}>{email}</div>
                  </div>
                </div>
                <button onClick={() => router.push('/dashboard/profile')} style={{ border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.text, borderRadius: 9, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Currency */}
            <SectionCard colors={colors} icon="💲" title="Currency">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CURRENCIES.map((c) => {
                  const active = currency === c
                  return (
                    <button key={c} onClick={() => setCurrency(c)}
                      style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${active ? colors.accent : colors.cardBorder}`, background: active ? colors.accentSoft : colors.card, color: active ? colors.accent : colors.text, fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer' }}>
                      {c}
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            {/* Appearance */}
            <SectionCard colors={colors} icon="☀️" title="Appearance">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{isDark ? 'Dark Mode' : 'Light Mode'}</div>
                  <div style={{ fontSize: 12.5, color: colors.textSub, marginTop: 2 }}>Switch between light and dark theme</div>
                </div>
                <Toggle colors={colors} on={isDark} onClick={() => setAppTheme(isDark ? 'light' : 'dark')} />
              </div>
            </SectionCard>

            {/* Notifications */}
            <SectionCard colors={colors} icon="🔔" title="Notifications">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0 14px', borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Mobile notifications</div>
                    <div style={{ fontSize: 12.5, color: colors.textSub, marginTop: 2 }}>
                      {pushStatus === 'enabled'
                        ? 'Chalu hain — due payments par phone ke home screen par push aayegi'
                        : pushStatus === 'denied'
                          ? 'Browser settings se notifications allow karein (padlock → Site settings → Notifications)'
                          : pushStatus === 'unsupported'
                            ? 'Is browser mein push notifications supported nahi'
                            : pushStatus === 'error'
                              ? 'Status check nahi ho saka. Dobara try karein.'
                              : 'Enable karo taake app band hone par bhi due payments ka alert mobile par aaye. Agar mobile par enable nahi ho raha to pehle browser menu se "Add to Home Screen" karein (iPhone ke liye zaroori).'}
                    </div>
                  </div>
                  {pushStatus === 'enabled'
                    ? <button onClick={async () => { await disablePush(); await getPushStatus().then(setPushStatus) }} style={{ padding: '8px 14px', borderRadius: 9, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: colors.danger, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Disable</button>
                    : pushStatus !== 'unsupported' && (
                      <button onClick={async () => { await enablePush(); await getPushStatus().then(setPushStatus) }} style={{ padding: '8px 14px', borderRadius: 9, background: colors.accent, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Enable</button>
                    )}
                </div>
                {[
                  { title: 'Upcoming bill reminders', desc: 'Get notified 2 days before bills are due', on: notifBills, toggle: toggleBills },
                  { title: 'Budget alerts', desc: 'Alert when spending reaches 80% of budget', on: notifBudget, toggle: toggleBudget },
                  { title: 'Income confirmations', desc: 'Notify when expected income arrives', on: notifIncome, toggle: toggleIncome },
                ].map((row, i, arr) => (
                  <div key={row.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{row.title}</div>
                      <div style={{ fontSize: 12.5, color: colors.textSub, marginTop: 2 }}>{row.desc}</div>
                    </div>
                    <Toggle colors={colors} on={row.on} onClick={row.toggle} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Send feedback */}
            <SectionCard colors={colors} icon="💬" title="Send feedback">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    { k: 'general', label: 'General' },
                    { k: 'feature_request', label: 'Feature request' },
                    { k: 'bug_report', label: 'Bug report' },
                  ] as const).map((t) => (
                    <button key={t.k} onClick={() => setFbType(t.k)}
                      style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${fbType === t.k ? colors.accent : colors.cardBorder}`, background: fbType === t.k ? colors.accentSoft : colors.card, color: fbType === t.k ? colors.accent : colors.text, fontWeight: fbType === t.k ? 700 : 500, fontSize: 13, cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input value={fbTitle} onChange={(e) => setFbTitle(e.target.value)} placeholder="Short summary" maxLength={120}
                  style={{ padding: '11px 13px', borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }} />
                <textarea value={fbMessage} onChange={(e) => setFbMessage(e.target.value)} placeholder="Tell us what happened, what you'd love to see, or general thoughts…" rows={4} maxLength={4000}
                  style={{ padding: '11px 13px', borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={handleSubmitFeedback} disabled={fbSubmitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#6366f1,#818cf8)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: fbSubmitting ? 'not-allowed' : 'pointer', opacity: fbSubmitting ? 0.7 : 1 }}>
                    {fbSubmitting ? 'Sending…' : 'Send feedback'}
                  </button>
                  {fbMsg && <span style={{ fontSize: 12.5, fontWeight: 600, color: fbMsg.ok ? colors.positive : colors.danger, lineHeight: 1.4 }}>{fbMsg.text}</span>}
                </div>
              </div>
            </SectionCard>

            {/* Data & Privacy */}
            <SectionCard colors={colors} icon="⬇️" title="Data & Privacy">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.text, borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <Download size={14} /> Export Data
                </button>
                <button onClick={() => { setConfirmDelete(true); setDeleteErr('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.danger}`, background: 'transparent', color: colors.danger, borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>

              {confirmDelete && (
                <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.3)` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.danger, marginBottom: 6 }}>Delete account?</div>
                  <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.5, marginBottom: 12 }}>
                    This permanently removes your Supabase account, all data, transactions, income, expenses, recurring payments, and budgets. This action cannot be undone.
                  </div>
                  {deleteErr && <div style={{ fontSize: 12, color: colors.danger, marginBottom: 10 }}>{deleteErr}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleDeleteAccount} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: 'none', background: colors.danger, color: '#fff', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                      <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Yes, delete everything'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: 'transparent', color: colors.text, fontSize: 13, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  )
}
