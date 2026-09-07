import { NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

/** Result of authenticating an API request. */
export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; status: number }

export const BEARER_PREFIX = 'Bearer '

/**
 * Authenticate the requesting user.
 *
 * Web (cookie session): uses the SSR server client.
 * Native Android: uses `Authorization: Bearer <access_token>`.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')

  if (authHeader && authHeader.startsWith(BEARER_PREFIX)) {
    const token = authHeader.slice(BEARER_PREFIX.length).trim()
    if (!token) return { ok: false, error: 'Missing access token', status: 401 }
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const client = createBrowserClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } })
      const { data, error } = await client.auth.getUser(token)
      if (error || !data.user) {
        return { ok: false, error: 'Invalid or expired session', status: 401 }
      }
      return { ok: true, userId: data.user.id }
    } catch {
      return { ok: false, error: 'Authentication failed', status: 500 }
    }
  }

  // Cookie-based (browser) session
  try {
    const serverClient = await createServerClient()
    const {
      data: { user },
      error,
    } = await serverClient.auth.getUser()
    if (error || !user) {
      return { ok: false, error: 'Not authenticated', status: 401 }
    }
    return { ok: true, userId: user.id }
  } catch {
    return { ok: false, error: 'Not authenticated', status: 401 }
  }
}