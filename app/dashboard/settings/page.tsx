'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import { getUserTransactionsClient, getUserIncomeClient, getUserExpensesClient, getUserRecurringExpensesClient } from '@/lib/database-client'
import { formatCurrency } from '@/lib/format'
import {
  getPushStatus, notifPref, setNotifPref,
  NOTIF_PREF_BILLS, NOTIF_PREF_BUDGET, NOTIF_PREF_INCOME, type PushStatus,
} from '@/lib/push'
import {
  LayoutDashboard, ArrowLeftRight, Calendar, PieChart,
  BarChart2, Bot, Settings, Bell,
  User, MoreHorizontal, Download, Trash2,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LANGUAGES, t, getStoredLanguage, storeLanguage, type LangCode } from '@/lib/i18n'

// ── Types ──────────────────────────────────────────────────────────────────
interface Colors {
  bg: string; sidebar: string; card: string; cardBorder: string
  text: string; textSub: string; accent: string; accentSoft: string
  positive: string; danger: string; warning: string; inputBg: string; hover: string
}

const colors: Colors = {
  bg: '#FEFBFE',
  sidebar: '#ffffff',
  card: 'linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.45))',
  cardBorder: 'rgba(255,255,255,0.7)',
  text: '#0f172a',
  textSub: '#64748b',
  accent: '#0A193D',
  accentSoft: '#EEF1F8',
  positive: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  inputBg: 'rgba(255,255,255,0.65)',
  hover: '#f1f5f9',
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

const MONTHS_BACK = 12
const exportMonthOptions = Array.from({ length: MONTHS_BACK }, (_, i) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - i)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})
const exportMonthLabel = (m: string) => new Date(m + '-01').toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })

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
  const [hasAuth, setHasAuth] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  const [currency, setCurrency] = useState('PKR')
  const [exportMonth, setExportMonth] = useState('all')
  const [exportModal, setExportModal] = useState<'pdf' | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState('')
  const [notifBills, setNotifBills] = useState(() => notifPref(NOTIF_PREF_BILLS, true))
  const [notifBudget, setNotifBudget] = useState(() => notifPref(NOTIF_PREF_BUDGET, true))
  const [notifIncome, setNotifIncome] = useState(() => notifPref(NOTIF_PREF_INCOME, true))
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')
  const [lang, setLang] = useState<LangCode>('en')

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)
      setUser(data.session.user)
      const metaCurrency = data.session.user.user_metadata?.currency as string | undefined
      if (metaCurrency && CURRENCIES.includes(metaCurrency)) setCurrency(metaCurrency)
      const metaLang = data.session.user.user_metadata?.language as string | undefined
      if (metaLang && LANGUAGES.some((l) => l.code === metaLang)) setLang(metaLang as LangCode)
    }

    checkAuth()
  }, [supabase.auth, router])

  useEffect(() => {
    void getPushStatus().then(setPushStatus)
  }, [])

  useEffect(() => {
    setLang(getStoredLanguage())
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

  const changeCurrency = (c: string) => {
    setCurrency(c)
    void supabase.auth.updateUser({ data: { currency: c } }).catch(() => {})
  }

  const changeLang = (l: LangCode) => {
    setLang(l)
    storeLanguage(l)
    void supabase.auth.updateUser({ data: { language: l } }).catch(() => {})
  }

  const inExportMonth = (date?: string | null) =>
    exportMonth === 'all' || !date ? true : (date || '').slice(0, 7) === exportMonth

  const handleExportPDF = async () => {
    if (exporting) return
    setExporting(true)
    setExportMsg('')
    try {
      const [transactions, income, expenses, recurring] = await Promise.all([
        getUserTransactionsClient(),
        getUserIncomeClient(),
        getUserExpensesClient(),
        getUserRecurringExpensesClient(),
      ])
      const txns = transactions.filter((t) => inExportMonth(t.date))
      const inc = income.filter((i) => inExportMonth(i.date))
      const exp = expenses.filter((e) => inExportMonth(e.date))

      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 16
      const fmt = (n: number) => formatCurrency(Number(n || 0), currency)
      let y = margin

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(99, 102, 241)
      doc.text('Finlo - Data Export', margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(120, 120, 120)
      doc.text(`Exported: ${new Date().toLocaleString()}  |  User: ${displayName || email || '-'}`, margin, y)
      y += 5
      doc.text(`Period: ${exportMonth === 'all' ? 'All months (full history)' : exportMonthLabel(exportMonth)}`, margin, y)
      y += 14

      const drawSectionHeader = (title: string) => {
        if (y > pageH - 24) { doc.addPage(); y = margin }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(99, 102, 241)
        doc.text(title, margin, y)
        y += 6
        doc.setDrawColor(99, 102, 241)
        doc.setLineWidth(0.4)
        doc.line(margin, y, pageW - margin, y)
        y += 5
      }

      const drawRow = (left: string, right: string, color: [number, number, number] = [60, 60, 60]) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...color)
        doc.text(left, margin, y)
        doc.text(right, pageW - margin - doc.getTextWidth(right), y)
        y += 5
      }

      drawSectionHeader('Summary')
      drawRow('Total Income', fmt(inc.reduce((s, i) => s + Number(i.amount), 0)), [16, 185, 129])
      drawRow('Total Expenses', fmt(exp.reduce((s, e) => s + Number(e.amount), 0)), [239, 68, 68])
      drawRow(
        'Net',
        fmt(inc.reduce((s, i) => s + Number(i.amount), 0) - exp.reduce((s, e) => s + Number(e.amount), 0))
      )
      drawRow('Transactions (records)', String(txns.length))
      drawRow('Recurring Payments', String(recurring.length))
      y += 8

      drawSectionHeader(`Income (${inc.length})`)
      inc.forEach((i) => {
        if (y > pageH - 24) { doc.addPage(); y = margin }
        drawRow(`${i.notes || 'Income'}  (${String(i.date || '').slice(0, 10)})`, fmt(i.amount), [16, 185, 129])
      })
      y += 8

      drawSectionHeader(`Expenses (${exp.length})`)
      exp.forEach((e) => {
        if (y > pageH - 24) { doc.addPage(); y = margin }
        drawRow(`${e.description || 'Expense'}  (${String(e.date || '').slice(0, 10)})`, fmt(e.amount), [239, 68, 68])
      })
      y += 8

      drawSectionHeader(`Recurring Payments (${recurring.length})`)
      recurring.forEach((r) => {
        if (y > pageH - 24) { doc.addPage(); y = margin }
        drawRow(`${r.name}  (${String(r.next_due_date || '').slice(0, 10)})`, fmt(r.amount))
      })
      y += 8

      drawSectionHeader('Recent Transactions')
      txns.forEach((t) => {
        if (y > pageH - 24) { doc.addPage(); y = margin }
        const c: [number, number, number] = t.type === 'income' ? [16, 185, 129] : [239, 68, 68]
        drawRow(`${t.description || 'Transaction'}  (${String(t.date || '').slice(0, 10)})  [${t.type}]`, fmt(t.amount), c)
      })

      doc.save(`finlo-export-${exportMonth === 'all' ? 'all' : exportMonth}-${new Date().toISOString().slice(0, 10)}.pdf`)
      setExportMsg('✓ PDF exported')
    } catch (err) {
      setExportMsg('PDF export failed, please try again')
      console.error(err)
    } finally {
      setExporting(false)
    }
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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>F</div>
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
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{sidebarInitial}</div>
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
                <span style={{ color: colors.accent }}>👤</span> {t(lang, 'profile.title')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>{initial}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{displayName}</div>
                    <div style={{ fontSize: 13, color: colors.textSub, marginTop: 2 }}>{email}</div>
                  </div>
                </div>
                <button onClick={() => router.push('/dashboard/profile')} style={{ border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.text, borderRadius: 9, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {t(lang, 'profile.edit')}
                </button>
              </div>
            </div>

            {/* Currency */}
            <SectionCard colors={colors} icon="💲" title={t(lang, 'currency.title')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CURRENCIES.map((c) => {
                  const active = currency === c
                  return (
                    <button key={c} onClick={() => changeCurrency(c)}
                      style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${active ? colors.accent : colors.cardBorder}`, background: active ? colors.accentSoft : colors.card, color: active ? colors.accent : colors.text, fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer' }}>
                      {c}
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            {/* Language */}
            <SectionCard colors={colors} icon="🌐" title={t(lang, 'language.title')}>
              <select value={lang} onChange={(e) => changeLang(e.target.value as LangCode)}
                style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.native} — {l.name}</option>
                ))}
              </select>
            </SectionCard>

            {/* Notifications */}
            <SectionCard colors={colors} icon="🔔" title={t(lang, 'notif.title')}>
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
                              : 'Automatic hain — app kholte hi apne aap enable ho jayengi. Agar mobile par enable nahi ho raha to pehle browser menu se "Add to Home Screen" karein (iPhone ke liye zaroori).'}
                    </div>
                  </div>
                  <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, flexShrink: 0, background: pushStatus === 'enabled' ? 'rgba(16,185,129,0.14)' : 'rgba(148,163,184,0.14)', color: pushStatus === 'enabled' ? '#10b981' : colors.textSub }}>
                    {pushStatus === 'enabled' ? 'ON' : pushStatus === 'denied' ? 'BLOCKED' : 'AUTO'}
                  </span>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#142453,#0A193D)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: fbSubmitting ? 'not-allowed' : 'pointer', opacity: fbSubmitting ? 0.7 : 1 }}>
                    {fbSubmitting ? 'Sending…' : 'Send feedback'}
                  </button>
                  {fbMsg && <span style={{ fontSize: 12.5, fontWeight: 600, color: fbMsg.ok ? colors.positive : colors.danger, lineHeight: 1.4 }}>{fbMsg.text}</span>}
                </div>
              </div>
            </SectionCard>

            {/* Data & Privacy */}
            <SectionCard colors={colors} icon="⬇️" title={t(lang, 'data.title')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button onClick={() => { setExportMonth('all'); setExportModal('pdf') }} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.text, borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}>
                  <Download size={14} /> {exporting ? 'Exporting...' : t(lang, 'data.export')}
                </button>
                {exportMsg && <span style={{ fontSize: 13, fontWeight: 600, color: exportMsg.includes('✓') ? colors.positive : colors.danger }}>{exportMsg}</span>}
                <button onClick={() => { setConfirmDelete(true); setDeleteErr('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.danger}`, background: 'transparent', color: colors.danger, borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <Trash2 size={14} /> {t(lang, 'account.delete')}
                </button>
              </div>

              {exportModal && createPortal(
                <div onClick={() => setExportModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px, 100%)', maxHeight: '92vh', overflowY: 'auto', borderRadius: 20, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', padding: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: colors.text, marginBottom: 4 }}>Export PDF Statement</div>
                    <div style={{ fontSize: 12.5, color: colors.textSub, marginBottom: 16 }}>Kis month ka data export karna hai? (last 1 year ke months available hain)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <button onClick={() => setExportMonth('all')} style={{ padding: '9px 4px', borderRadius: 9, border: `1px solid ${exportMonth === 'all' ? '#0A193D' : colors.cardBorder}`, background: exportMonth === 'all' ? 'rgba(10,25,61,0.1)' : 'transparent', color: exportMonth === 'all' ? '#0A193D' : colors.textSub, fontSize: 12, fontWeight: exportMonth === 'all' ? 700 : 500, cursor: 'pointer' }}>
                        All history
                      </button>
                      {exportMonthOptions.map((m) => (
                        <button key={m} onClick={() => setExportMonth(m)} style={{ padding: '9px 4px', borderRadius: 9, border: `1px solid ${exportMonth === m ? '#0A193D' : colors.cardBorder}`, background: exportMonth === m ? 'rgba(10,25,61,0.1)' : 'transparent', color: exportMonth === m ? '#0A193D' : colors.textSub, fontSize: 12, fontWeight: exportMonth === m ? 700 : 500, cursor: 'pointer' }}>
                          {exportMonthLabel(m)}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                      <button disabled={exporting} onClick={() => { setExportModal(null); void handleExportPDF() }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#0A193D', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1 }}>
                        {exporting ? 'Exporting...' : 'Download PDF'}
                      </button>
                      <button onClick={() => setExportModal(null)} style={{ padding: '11px 18px', borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: 'transparent', color: colors.textSub, fontSize: 13.5, cursor: 'pointer' }}>
                        {t(lang, 'common.cancel')}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {confirmDelete && (
                <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.3)` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.danger, marginBottom: 6 }}>Delete account?</div>
                  <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.5, marginBottom: 12 }}>
                    This permanently removes your Supabase account, all data, transactions, income, expenses, recurring payments, and budgets. This action cannot be undone.
                  </div>
                  {deleteErr && <div style={{ fontSize: 12, color: colors.danger, marginBottom: 10 }}>{deleteErr}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleDeleteAccount} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: 'none', background: colors.danger, color: '#fff', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                      <Trash2 size={14} /> {deleting ? 'Deleting...' : t(lang, 'common.yesDelete')}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: 'transparent', color: colors.text, fontSize: 13, cursor: 'pointer' }}>
                      {t(lang, 'common.cancel')}
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
