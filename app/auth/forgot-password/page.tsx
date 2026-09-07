'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, Container, GlassButton, Input } from '@/components/ui'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12">
        <Container size="sm">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Check your email
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
              </p>
            </div>

            <Card isGlass={true} padding="lg" className="text-center space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Didn&apos;t receive an email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  try again
                </button>
              </p>
            </Card>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Back to login
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12">
      <Container size="sm">
        <div className="space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Reset Password
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enter your email to receive a password reset link
            </p>
          </div>

          {/* Form Card */}
          <Card isGlass={true} padding="lg" className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <GlassButton
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
                disabled={loading}
              >
                Send Reset Link
              </GlassButton>
            </form>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to login
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  )
}
