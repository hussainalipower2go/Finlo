'use client'

/**
 * Lightweight app-wide gate that wraps every /dashboard page:
 *  - maintenance_mode flag  -> full-screen maintenance cover (admins bypass)
 *  - account_status SUSPENDED / DELETED -> "account suspended" cover
 * Reads feature_flags + profiles with RLS (signed-in user). Any DB error
 * (missing migration) is ignored so the app keeps working normally.
 */
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Construction, Lock } from 'lucide-react'

type GateState =
  | { kind: 'ok' }
  | { kind: 'maintenance' }
  | { kind: 'suspended' }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<GateState>({ kind: 'ok' })
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session) return
        const uid = data.session.user.id

        const isAdmin =
          (data.session.user.app_metadata?.role as string | undefined) === 'ADMIN'

        let status: string | null = null
        let maintenance = false

        try {
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('account_status, role')
            .eq('id', uid)
            .maybeSingle()
          if (!pErr && profile) {
            status = profile.account_status as string | null
            if ((profile.role as string | undefined) === 'ADMIN') {
              if (cancelled) return
              setGate({ kind: 'ok' })
              return
            }
          }
        } catch {
          /* RLS/table gated — ignore */
        }

        try {
          const { data: flags, error: fErr } = await supabase
            .from('feature_flags')
            .select('key, enabled')
            .in('key', ['maintenance_mode'])
          if (!fErr && flags) {
            maintenance = flags.some((f) => f.key === 'maintenance_mode' && f.enabled === true)
          }
        } catch {
          /* ignore */
        }

        if (status === 'SUSPENDED' || status === 'DELETED') {
          if (cancelled) return
          setGate({ kind: 'suspended' })
          return
        }
        if (maintenance && !isAdmin) {
          if (cancelled) return
          setGate({ kind: 'maintenance' })
          return
        }
        if (cancelled) return
        setGate({ kind: 'ok' })
      } catch {
        /* never block the app on a broken check */
      }
    }

    check()
    const t = setInterval(check, 60_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, background: 'linear-gradient(160deg,#080b1a 0%,#111a35 55%,#0b1024 100%)',
    fontFamily: "'Montserrat', -apple-system, sans-serif", textAlign: 'center', flexDirection: 'column',
  }

  if (gate.kind === 'maintenance') {
    return (
      <div style={overlayStyle}>
        <div style={{ width: 62, height: 62, borderRadius: 18, background: 'rgba(10,25,61,0.15)', border: '1px solid rgba(10,25,61,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A193D', marginBottom: 22 }}>
          <Construction size={28} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>Finlo is under maintenance</h1>
        <p style={{ fontSize: 14, color: '#0A193D', lineHeight: 1.7, margin: '0 0 4px 0' }}>
          We&apos;re making things faster and smoother. Hang tight — we&apos;ll be back shortly.
        </p>
        <p style={{ fontSize: 13, color: '#0A193D' }}>Sign in again in a few minutes.</p>
      </div>
    )
  }

  if (gate.kind === 'suspended') {
    return (
      <div style={overlayStyle}>
        <div style={{ width: 62, height: 62, borderRadius: 18, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: 22 }}>
          <Lock size={28} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>Account suspended</h1>
        <p style={{ fontSize: 14, color: '#0A193D', lineHeight: 1.7, margin: '0 0 4px 0' }}>
          Your account is currently suspended. If you believe this is a mistake,
          contact support.
        </p>
        <button
          onClick={() => router.push('/auth/login')}
          style={{ marginTop: 18, padding: '11px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#142453,#0A193D)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Back to login
        </button>
      </div>
    )
  }

  return <>{children}</>
}