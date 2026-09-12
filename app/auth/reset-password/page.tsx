'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LoaderCircle } from 'lucide-react'
import { ParentBrand } from '@/components/parent-brand'

const p = {
  line: 'rgba(10,25,61,0.22)',
  text: '#0f172a',
  desc: 'rgba(100,116,139,0.85)',
  label: 'rgba(51,65,85,0.9)',
  iconMuted: 'rgba(100,116,139,0.6)',
  inputBg: 'rgba(255,255,255,0.95)',
  inputText: 'rgba(15,23,42,0.92)',
}

function PasswordField({
  id, label, value, onChange, show, onToggle, onClearError, placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  onClearError: () => void
  placeholder: string
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: p.label, marginBottom: '8px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: p.iconMuted, pointerEvents: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete="new-password"
          onChange={e => { onChange(e.target.value); onClearError() }}
          placeholder={placeholder}
          style={{ width: '100%', padding: '14px 48px 14px 44px', background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: '12px', fontSize: '14px', color: p.inputText, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'rgba(10,25,61,0.55)'}
          onBlur={e => e.target.style.borderColor = p.line}
        />
        <button type="button" onClick={onToggle} aria-label="Toggle password"
          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: p.iconMuted, padding: '4px', display: 'flex' }}>
          {show
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
        </button>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Invalid reset link. Please request a new password reset.')
      }
      setIsReady(true)
    }
    checkSession()
  }, [supabase.auth])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
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

        {!isReady ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg,#142453,#0A193D)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 1.2s infinite' }}>
              <LoaderCircle className="h-5 w-5 animate-spin" color="#fff" />
            </div>
            <p style={{ fontSize: '14px', color: p.desc }}>Loading...</p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>✓</span>
              </div>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: p.text, margin: '0 0 8px 0' }}>Password reset</h2>
            <p style={{ fontSize: '14px', color: p.desc, margin: 0 }}>Your password has been successfully reset. Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: p.text, margin: '0 0 6px 0' }}>Set new password</h2>
            <p style={{ fontSize: '14px', color: p.desc, margin: '0 0 28px 0' }}>Create a new password for your account</p>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#b91c1c', fontSize: '13px', fontFamily: 'inherit' }}>{error}</div>
            )}

            {!error && (
              <form onSubmit={handleResetPassword} noValidate>
                <PasswordField
                  id="rp-password"
                  label="New Password"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  onClearError={() => setError('')}
                  placeholder="Enter new password"
                />
                <PasswordField
                  id="rp-confirm"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(!showConfirm)}
                  onClearError={() => setError('')}
                  placeholder="Re-enter new password"
                />
                <p style={{ fontSize: '12px', color: p.desc, margin: '-8px 0 20px 0' }}>At least 8 characters</p>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #142453 0%, #0A193D 100%)', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 2px 10px rgba(10,25,61,0.22)', opacity: loading ? 0.6 : 1 }}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                  {loading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        <ParentBrand companyName="ELVA" logo="/branding/elva-logo.svg" />
      </div>
    </div>
  )
}