import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../auth'
import { createClient as createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * GET /api/import/pending
 * Returns all pending import items for the current user.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const server = await createServerClient()

  const { data, error } = await server
    .from('pending_transactions')
    .select('*')
    .eq('user_id', auth.userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}