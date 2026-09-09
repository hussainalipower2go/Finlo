'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { createClient } from '@/lib/supabase'
import { AuthInput } from '@/components/auth/AuthInput'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'

export function LoginForm({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email || !password) return

    setLoading(true)
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      toast({ type: 'error', message: loginError.message })
      setLoading(false)
      return
    }

    toast({ type: 'success', message: 'Welcome back to Finlo.' })
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div
      className={`relative z-[1] w-full max-w-[580px] rounded-[24px] px-8 py-10 sm:px-14 sm:py-12 ${className}`}
      style={{
        background: 'rgba(16,12,42,0.75)',
        border: '1px solid rgba(10,25,61,0.25)',
        boxShadow: '0 4px 60px rgba(50,20,160,0.18), inset 0 1px 0 rgba(255,255,255,0.035)',
      }}
    >
      <h2 className="mb-1.5 text-[26px] font-bold text-white">Welcome back 👋</h2>
      <p className="mb-8 text-sm text-[#0A193D]/60">Login to continue to your account</p>

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          error={error}
          onChange={setEmail}
        />

        <div className="mb-5">
          <label htmlFor="password" className="mb-2 block text-[13px] font-medium text-[#0A193D]/85">
            Password
          </label>
          <AuthInput
            id="password"
            label=""
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMe}
            onClick={() => setRememberMe((v) => !v)}
            className="flex cursor-pointer items-center gap-2.5 border-none bg-transparent"
          >
            <span
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px]"
              style={{
                background: rememberMe ? '#0A193D' : 'rgba(10,25,61,0.12)',
                border: rememberMe ? 'none' : '1px solid rgba(10,25,61,0.3)',
              }}
            >
              {rememberMe && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </span>
            <span className="text-[13px] text-[#0A193D]/75">Remember me</span>
          </button>
          <Link href="/auth/forgot-password" className="text-[13px] text-[#0A193D] no-underline transition-colors hover:text-[#0A193D]">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mb-6 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-none text-[16px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            fontFamily: 'inherit',
            background: 'linear-gradient(90deg, #142453 0%, #0A193D 100%)',
            boxShadow: '0 4px 24px rgba(10,25,61,0.35)',
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #142453 0%, #0A193D 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #142453 0%, #0A193D 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {loading ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Log in
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </>
          )}
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(10,25,61,0.18)' }} />
          <span className="whitespace-nowrap text-[13px] text-[#0A193D]/50">or continue with</span>
          <div className="h-px flex-1" style={{ background: 'rgba(10,25,61,0.18)' }} />
        </div>

        <div className="mb-7">
          <SocialLoginButtons />
        </div>

        <p className="text-center text-sm text-[#0A193D]/60">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-[#0A193D] no-underline transition-colors hover:text-[#0A193D]">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
