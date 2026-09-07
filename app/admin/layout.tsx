import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { adminDb } from '@/lib/admin/helpers'
import AdminShell from './_components/AdminShell'
import { NotReadyScreen, ForbiddenScreen } from './_components/Screens'

export const dynamic = 'force-dynamic'

type Gate =
  | { kind: 'ok' }
  | { kind: 'not_ready' }
  | { kind: 'forbidden'; reason: 'not_admin' | 'inactive' }
  | { kind: 'error' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let gate: Gate = { kind: 'error' }

  try {
    const serverClient = await createServerClient()
    const {
      data: { user },
    } = await serverClient.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile, error } = await adminDb()
      .from('profiles')
      .select('role, account_status, id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      const m = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
      if (/42p01|42703|relation .* does not exist|column .* does not exist/.test(m)) {
        gate = { kind: 'not_ready' }
      } else {
        throw error
      }
    } else if (!profile || profile.id !== user.id) {
      // Requirement 2: verify profiles.id matches auth.users.id
      gate = { kind: 'forbidden', reason: 'not_admin' }
    } else if (profile.role !== 'ADMIN' && profile.role !== 'admin') {
      gate = { kind: 'forbidden', reason: 'not_admin' }
    } else if (profile.account_status !== 'ACTIVE') {
      gate = { kind: 'forbidden', reason: 'inactive' }
    } else {
      gate = { kind: 'ok' }
    }
  } catch {
    gate = { kind: 'error' }
  }

  if (gate.kind === 'not_ready') return <NotReadyScreen />
  if (gate.kind === 'forbidden') return <ForbiddenScreen reason={gate.reason} />
  if (gate.kind !== 'ok') return <ForbiddenScreen />

  return <AdminShell>{children}</AdminShell>
}