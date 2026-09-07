'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToggleLeft, Settings, History, RefreshCw, Database } from 'lucide-react'
import { NOT_READY_CODE, postJson } from '../_components/useApi'
import { Card, Badge, EmptyState, NotReadyBanner, ErrorBanner, PageHeader, Skeleton, ace } from '../_components/ui'
import type { FlagRow, AuditLogRow } from '@/lib/admin/types'

interface SettingsEntry { key: string; value: unknown }

const FLAG_DESCRIPTIONS: Record<string, string> = {
  sms_import_enabled: 'SMS bank import (Settings → SMS Bank Import)',
  receipt_scanning_enabled: 'Receipt scanning (extract-receipt)',
  ai_assistant_enabled: 'AI assistant chat',
  csv_import_enabled: 'CSV import',
  maintenance_mode: 'Maintenance screen for end users (admins never locked out)',
}

export default function AdminSettingsPage() {
  const searchParams = useSearchParams()
  const [flags, setFlags] = useState<FlagRow[] | null>(null)
  const [flagsReady, setFlagsReady] = useState(false)
  const [flagsError, setFlagsError] = useState<string | null>(null)
  const [notReady, setNotReady] = useState(false)
  const [busyFlag, setBusyFlag] = useState<string | null>(null)

  const [appName, setAppName] = useState('Finlo')
  const [supportEmail, setSupportEmail] = useState('support@finlo.app')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [logs, setLogs] = useState<AuditLogRow[] | null>(null)
  const [logsBusy, setLogsBusy] = useState(false)

  const [themeSaving, setThemeSaving] = useState(false)
  const [themeMsg, setThemeMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    setFlagsError(null)
    const res = await fetch('/api/admin/flags', { cache: 'no-store' })
    const json = await res.json()
    if (res.status === 409 && json.code === NOT_READY_CODE) setNotReady(true)
    else if (!res.ok) setFlagsError(json.error || 'Failed')
    else {
      setFlags(json.flags)
      setFlagsReady(json.ready)
    }
  }, [])

  useEffect(() => { void (async () => await load())() }, [load])

  const initialTheme = searchParams.get("theme") as "light" | "dark" | null
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    if (initialTheme) return initialTheme
    if (typeof window === 'undefined') return 'light'
    const storedTheme = localStorage.getItem("finlo_theme") as "light" | "dark" | null
    if (storedTheme) return storedTheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(appTheme)
  }, [appTheme])

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      const json = await res.json()
      json.settings?.forEach((s: SettingsEntry) => {
        if (s.key === 'app_name') setAppName(String(s.value ?? 'Finlo'))
        if (s.key === 'support_email') setSupportEmail(String(s.value ?? ''))
      })
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => { void (async () => await loadSettings())() }, [loadSettings])

  const loadLogs = useCallback(async () => {
    setLogsBusy(true)
    try {
      const res = await fetch('/api/admin/audit', { cache: 'no-store' })
      const json = await res.json()
      setLogs(json.logs ?? [])
    } catch {
      setLogs([])
    } finally {
      setLogsBusy(false)
    }
  }, [])

  useEffect(() => { void (async () => await loadLogs())() }, [loadLogs])

  const toggleFlag = async (key: string, enabled: boolean) => {
    setBusyFlag(key)
    setFlagsError(null)
    const res = await postJson('/api/admin/flags', { key, enabled })
    if (!res.ok) setFlagsError(res.error || 'Failed to toggle')
    else setFlags((prev) => prev?.map((f) => (f.key === key ? { ...f, enabled } : f)) ?? prev)
    setBusyFlag(null)
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    setSettingsMsg(null)
    let ok = true
    const appRes = await postJson('/api/admin/settings', { key: 'app_name', value: appName.trim() })
    if (!appRes.ok) ok = false
    const emailRes = await postJson('/api/admin/settings', { key: 'support_email', value: supportEmail.trim() })
    if (!emailRes.ok) ok = false
    setSettingsSaving(false)
    setSettingsMsg({ ok, text: ok ? 'Settings saved ✓' : 'One or more fields failed to save' })
  }

  const applyTheme = (next: 'light' | 'dark') => {
    setThemeMsg(null)
    setAppTheme(next)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(next)
    localStorage.setItem("finlo_theme", next)
    setThemeSaving(true)
    postJson('/api/admin/settings', { key: 'theme_mode', value: next })
      .then(() => setThemeSaving(false))
      .catch(() => {
        setThemeSaving(false)
        setThemeMsg({ ok: false, text: 'Failed to save theme' })
      })
  }

  if (notReady) {
    return (
      <>
        <PageHeader title="Settings" desc="Feature flags, app settings and the admin audit log" />
        <NotReadyBanner onRefresh={load} />
      </>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" desc="Feature flags, app settings and the admin audit log" />

      {flagsError && <div style={{ marginBottom: 12 }}><ErrorBanner message={flagsError} /></div>}

      <div className="ace-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card title="Feature flags" icon={<ToggleLeft size={16} />} style={{ minWidth: 0 }}>
          {!flagsReady ? (
            flags ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {flags.map((f) => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--ace-soft-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 12 }}>
                    <Toggle on={f.enabled} disabled={busyFlag === f.key} onClick={() => toggleFlag(f.key, !f.enabled)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: ace.text }}>{f.key}</div>
                      <div style={{ fontSize: 11.5, color: ace.sub }}>{FLAG_DESCRIPTIONS[f.key] || f.description}</div>
                    </div>
                    <Badge tone={f.enabled ? 'green' : 'default'}>{f.enabled ? 'ON' : 'OFF'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={54} />)}
              </div>
            )
          ) : (
            <EmptyState title="Feature flag table not ready" desc="The feature_flags table hasn't been created yet." />
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="App settings" icon={<Settings size={16} />} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="App name" value={appName} onChange={setAppName} />
              <Field label="Support email" value={supportEmail} onChange={setSupportEmail} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={saveSettings} disabled={settingsSaving} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: settingsSaving ? 'not-allowed' : 'pointer' }}>
                  {settingsSaving ? 'Saving…' : 'Save settings'}
                </button>
                {settingsMsg && <span style={{ fontSize: 12.5, fontWeight: 600, color: settingsMsg.ok ? '#34d399' : '#f87171' }}>{settingsMsg.text}</span>}
              </div>
            </div>
          </Card>

          <Card title="Appearance" icon={<Settings size={16} />} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: ace.text }}>
                <span>Theme</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => applyTheme('light')}
                  disabled={themeSaving}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, border: `1px solid ${ace.cardBorder}`,
                    background: appTheme === 'light' ? '#10b981' : 'transparent', color: appTheme === 'light' ? '#fff' : ace.sub,
                    fontSize: 12, fontWeight: 600, cursor: themeSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <line x1="12" y1="3" x2="12" y2="21"/>
                    <line x1="19" y1="8" x2="19" y2="15"/>
                    <line x1="5" y1="8" x2="12" y2="15"/>
                  </svg>
                  Light
                </button>
                <button
                  onClick={() => applyTheme('dark')}
                  disabled={themeSaving}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, border: `1px solid ${ace.cardBorder}`,
                    background: appTheme === 'dark' ? '#10b981' : 'transparent', color: appTheme === 'dark' ? '#fff' : ace.sub,
                    fontSize: 12, fontWeight: 600, cursor: themeSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  Dark
                </button>
              </div>
              {themeMsg && (
                <div style={{ fontSize: 12, color: themeMsg.ok ? '#10b981' : '#f87171' }}>
                  {themeMsg.text}
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Migration status"
            icon={<Database size={16} />} style={{ minWidth: 0 }}
          >
            <div style={{ fontSize: 12.5, color: ace.sub, lineHeight: 1.6, marginBottom: 8 }}>
              The admin dashboard reads from <code>public.profiles</code> plus a handful of admin tables defined in:
            </div>
            <code style={{ display: 'block', fontSize: 11.5, color: 'var(--ace-accent-text)', background: 'var(--ace-input-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 9, padding: 9, wordBreak: 'break-all' }}>
              supabase/migrations/20260907000000_admin_dashboard.sql
            </code>
            <div style={{ marginTop: 10, fontSize: 12, color: ace.sub, lineHeight: 1.5 }}>
              After applying, promote a user to admin:
              <code style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--ace-accent-text)' }}>
                UPDATE public.profiles SET role = &#39;ADMIN&#39; WHERE id = &#39;&lt;auth_users_id&gt;&#39;;
              </code>
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Admin audit log"
        icon={<History size={16} />}
        style={{ minWidth: 0 }}
        right={
          <button onClick={loadLogs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 8, border: `1px solid ${ace.cardBorder}`, background: 'transparent', color: ace.sub, fontSize: 12, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        }
      >
        {logsBusy && !logs ? (
          <Skeleton height={120} />
        ) : !logs || logs.length === 0 ? (
          <EmptyState title="No audit entries yet" desc="Administrative actions (role changes, status changes, flag toggles) are recorded here." />
        ) : (
          <>
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  {['When', 'Admin', 'Action', 'Target', 'Details'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: ace.sub, padding: '7px 8px', borderBottom: `1px solid ${ace.cardBorder}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--ace-card-border)' }}>
                    <td style={{ padding: '8px', fontSize: 11.5, color: ace.sub, whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString()}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: ace.text, whiteSpace: 'nowrap' }}>{l.admin_email || '—'}</td>
                    <td style={{ padding: '8px' }}><Badge>{l.action.replace(/_/g, ' ')}</Badge></td>
                    <td style={{ padding: '8px', fontSize: 12, color: ace.sub, whiteSpace: 'nowrap' }}>{l.target_type ?? '—'}{l.target_id ? ` · ${l.target_id.slice(0, 8)}…` : ''}</td>
                    <td style={{ padding: '8px', fontSize: 11.5, color: ace.sub, maxWidth: 260 }}>
                      {Object.keys(l.metadata ?? {}).length ? JSON.stringify(l.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-audit-cards">
            {logs.map((l) => (
              <div key={l.id} style={{ background: 'var(--ace-soft-bg)', border: `1px solid ${ace.cardBorder}`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge>{l.action.replace(/_/g, ' ')}</Badge>
                  <span style={{ fontSize: 11, color: ace.sub, marginLeft: 'auto' }}>{new Date(l.created_at).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, color: ace.text }}>
                  <b style={{ fontWeight: 600 }}>Admin:</b> {l.admin_email || '—'}
                </div>
                <div style={{ marginTop: 2, fontSize: 12, color: ace.sub }}>
                  <b style={{ fontWeight: 600, color: ace.text }}>Target:</b> {l.target_type ?? '—'}{l.target_id ? ` · ${l.target_id.slice(0, 8)}…` : ''}
                </div>
                <div style={{ marginTop: 8, fontSize: 11.5, color: ace.sub, wordBreak: 'break-word', background: ace.inputBg, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, padding: 8 }}>
                  {Object.keys(l.metadata ?? {}).length ? JSON.stringify(l.metadata) : '—'}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </Card>
    </div>
  )
}

function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      style={{ width: 40, height: 22, borderRadius: 999, border: 'none', background: on ? '#10b981' : ace.cardBorder, position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, padding: 0, opacity: disabled ? 0.6 : 1 }}
    >
      <span style={{ position: 'absolute', top: 3, left: on ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)', transition: 'left 0.12s ease' }} />
    </button>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: ace.sub }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '9px 11px', background: ace.inputBg, border: `1px solid ${ace.cardBorder}`, borderRadius: 9, color: ace.text, fontSize: 13, outline: 'none' }} />
    </label>
  )
}