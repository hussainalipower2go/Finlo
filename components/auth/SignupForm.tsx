'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { createClient } from '@/lib/supabase'
import { AuthInput } from '@/components/auth/AuthInput'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'

export function SignupForm({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email || !password || !confirmPassword) return

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      toast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms & Privacy Policy')
      toast({ type: 'error', message: 'Please agree to the Terms & Privacy Policy' })
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      toast({ type: 'error', message: signUpError.message })
      setLoading(false)
      return
    }

    // If a session exists (email confirmation disabled), go to onboarding
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      toast({ type: 'success', message: 'Account created. Welcome to Finlo.' })
      setLoading(false)
      router.push('/onboarding')
    } else {
      toast({ type: 'success', message: 'Check your email to confirm your account.' })
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative z-[1] w-full max-w-[580px] mt-10 lg:mt-16 rounded-[24px] px-6 py-8 sm:px-12 sm:py-11 ${className}`}
      style={{
        background: 'rgba(16,12,42,0.75)',
        border: '1px solid rgba(109,40,217,0.25)',
        boxShadow: '0 4px 60px rgba(50,20,160,0.18), inset 0 1px 0 rgba(255,255,255,0.035)',
      }}
    >
      <h2 className="mb-1.5 text-[26px] font-bold text-white">Create account 🚀</h2>
      <p className="mb-8 text-sm text-[#9482c8]/60">Sign up to get started with Finlo</p>

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
          <label htmlFor="password" className="mb-2 block text-[13px] font-medium text-[#c4b5fd]/85">
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

        <div className="mb-5">
          <label htmlFor="confirmPassword" className="mb-2 block text-[13px] font-medium text-[#c4b5fd]/85">
            Confirm password
          </label>
          <AuthInput
            id="confirmPassword"
            label=""
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        <div className="mb-6 flex items-center">
          <label className="flex cursor-pointer items-center gap-2.5">
            <span
              role="checkbox"
              aria-checked={agreeTerms}
              onClick={() => setAgreeTerms((v) => !v)}
              className="flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[5px]"
              style={{
                background: agreeTerms ? '#7c3aed' : 'rgba(109,40,217,0.12)',
                border: agreeTerms ? 'none' : '1px solid rgba(109,40,217,0.3)',
              }}
            >
              {agreeTerms && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </span>
            <span className="text-[13px] text-[#c4b5fd]/75">
              I agree to the <Link href="/terms" className="text-[#8b5cf6] no-underline">Terms</Link>{' '}
              & <Link href="/privacy" className="text-[#8b5cf6] no-underline">Privacy Policy</Link>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mb-6 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-none text-[16px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            fontFamily: 'inherit',
            background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)',
            boxShadow: '0 4px 24px rgba(109,40,217,0.35)',
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {loading ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Create account
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </>
          )}
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(109,40,217,0.18)' }} />
          <span className="whitespace-nowrap text-[13px] text-[#826ebe]/50">or continue with</span>
          <div className="h-px flex-1" style={{ background: 'rgba(109,40,217,0.18)' }} />
        </div>

        <div className="mb-7">
          <SocialLoginButtons />
        </div>

        <p className="text-center text-sm text-[#826eb4]/60">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-[#8b5cf6] no-underline transition-colors hover:text-[#7c3aed]">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
