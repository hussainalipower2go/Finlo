import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const DATA_TABLES = ['transactions', 'income', 'expenses', 'recurring_expenses', 'budgets'] as const

export async function DELETE() {
  try {
    const serverClient = await createServerClient()
    const {
      data: { user },
    } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to your environment to enable full account deletion.' },
        { status: 500 }
      )
    }

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

    // 1. Remove all user data (bypasses RLS via service role)
    const deleteErrors: string[] = []
    for (const table of DATA_TABLES) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id)
      if (error) deleteErrors.push(`${table}: ${error.message}`)
    }

    // 2. Delete the auth account itself
    const { error: authError } = await admin.auth.admin.deleteUser(user.id)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (deleteErrors.length > 0) {
      console.error('Data cleanup errors:', deleteErrors)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete-account route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}