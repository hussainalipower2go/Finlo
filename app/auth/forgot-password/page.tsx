'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { LoaderCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const p = {
    line: 'rgba(10,25,61,0.22)',
    text: '#0f172a',
    desc: 'rgba(100,116,139,0.85)',
    label: 'rgba(51,65,85,0.9)',
    iconMuted: 'rgba(100,116,139,0.6)',
    inputBg: 'rgba(255,255,255,0.95)',
    inputText: 'rgba(15,23,42,0.92)',
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
          ? process.env.NEXT_PUBLIC_APP_URL
          : window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/callback?next=/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundImage: "url('/login-bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "var(--font-manrope), 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.38)',
        border: '1px solid rgba(255,255,255,0.75)',
        borderRadius: '28px',
        padding: 'clamp(28px, 4vw, 44px)',
        boxShadow: '0 24px 60px rgba(10,25,61,0.20), inset 0 1px 0 rgba(255,255,255,0.85)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <Image
            src="/finlo-logo-horizontal.png"
            alt="Finlo"
            width={968}
            height={364}
            quality={100}
            style={{ width: 'clamp(180px, 30vw, 240px)', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>✓</span>
              </div>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: p.text, margin: '0 0 8px 0' }}>Check your email</h2>
            <p style={{ fontSize: '14px', color: p.desc, lineHeight: 1.6, margin: '0 0 24px 0' }}>
              We&apos;ve sent a password reset link to <strong style={{ color: p.text }}>{email}</strong>. Check your inbox and follow the link to reset your password.
            </p>
            <p style={{ fontSize: '13px', color: p.desc, margin: '0 0 20px 0' }}>
              Didn&apos;t receive an email? Check your spam folder or{' '}
              <button onClick={() => setSuccess(false)} style={{ background: 'none', border: 'none', padding: 0, color: '#0A193D', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>try again</button>
            </p>
            <Link href="/auth/login" style={{ fontSize: '14px', fontWeight: 600, color: '#0A193D', textDecoration: 'none' }}>Back to login</Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: p.text, margin: '0 0 6px 0' }}>Reset password</h2>
            <p style={{ fontSize: '14px', color: p.desc, margin: '0 0 28px 0' }}>Enter your email to receive a password reset link</p>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#b91c1c', fontSize: '13px', fontFamily: 'inherit' }}>{error}</div>
            )}

            <form onSubmit={handleResetPassword} noValidate>
              <label htmlFor="fp-email" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: p.label, marginBottom: '8px' }}>Email address</label>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: p.iconMuted, pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '14px 14px 14px 44px', background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: '12px', fontSize: '14px', color: p.inputText, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(10,25,61,0.55)'}
                  onBlur={e => e.target.style.borderColor = p.line}
                />
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #142453 0%, #0A193D 100%)', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 2px 10px rgba(10,25,61,0.22)', marginBottom: '20px', opacity: loading ? 0.6 : 1 }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '14px', color: p.desc }}>
              <Link href="/auth/login" style={{ color: '#0A193D', textDecoration: 'none', fontWeight: 500 }}>Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}