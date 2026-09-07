'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, Container, GlassButton, Input } from '@/components/ui'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">₹</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
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
                Password Reset
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your password has been successfully reset. Redirecting to dashboard...
              </p>
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
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Set New Password
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create a new password for your account
            </p>
          </div>

          <Card isGlass={true} padding="lg" className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {!error && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  helper="At least 8 characters"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Reset Password
                </GlassButton>
              </form>
            )}
          </Card>
        </div>
      </Container>
    </div>
  )
}
