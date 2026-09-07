import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type Client = SupabaseClient<any, 'public'>

const isConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

const missingConfigError = (prop: string) =>
  new Error(
    `Supabase is not configured (${prop}). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your build environment and redeploy.`
  )

const missingClient = new Proxy(
  {},
  {
    get(_t, prop) {
      throw missingConfigError(String(prop))
    },
  }
) as unknown as Client

export const createClient: () => Client = () => {
  if (!isConfigured()) {
    if (typeof window !== 'undefined') throw missingConfigError('browser')
    // Static prerendering / SSR must not crash the build on missing config.
    // Any actual Supabase call made during prerender raises a clear error instead.
    return missingClient
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
