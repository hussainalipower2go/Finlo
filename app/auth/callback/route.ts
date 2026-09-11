import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { hasExistingUserData } from '@/lib/user-data'

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

  let target: string
  try {
    const u = new URL(redirectTo, requestUrl.origin)
    if (u.origin !== requestUrl.origin) target = '/dashboard'
    else target = u.pathname + u.search + u.hash
  } catch {
    target = '/dashboard'
  }

  const meta = data.user.user_metadata as Record<string, unknown> | undefined
  const onboarded = meta?.onboarded === true
  if (!onboarded) {
    const hasData = await hasExistingUserData(supabase)
    if (hasData) {
      supabase.auth.updateUser({ data: { onboarded: true } }).catch(() => {})
    } else if (target === '/dashboard' || target === '/') {
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    }
  }
  return NextResponse.redirect(new URL(target, requestUrl.origin))
}