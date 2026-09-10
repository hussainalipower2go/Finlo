import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchange error:', error.message)
      return NextResponse.redirect(
        new URL(`/login?error=callback&reason=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
  }

  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data.user) {
    console.error('[auth/callback] no session:', userError?.message)
    return NextResponse.redirect(
      new URL(`/login?error=no-session&reason=${encodeURIComponent(userError?.message || 'no user')}`, requestUrl.origin)
    )
  }

  const redirectTo = next && next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}