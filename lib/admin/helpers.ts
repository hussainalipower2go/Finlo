/**
 * Server-only admin helpers.
 *
 * Security model
 * --------------
 *  - Every /api/admin/* route authenticates via `getAdminUser()`.
 *  - The role is read from `public.profiles` with the SERVICE ROLE key and
 *    compared to 'ADMIN' + 'ACTIVE'. A missing table/column fails closed
 *    (409 ADMIN_DB_NOT_READY, never grants access).
 *  - Ordinary users can never change their own role (column grants + RLS in
 *    the migration, plus the fact that these helpers only read).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/app/api/import/auth'
import type { ProfileRow } from './types'

export const DB_NOT_READY_CODE = 'ADMIN_DB_NOT_READY'

/** Service-role Supabase client (bypasses RLS intentionally — server only). */
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Admin database is not configured (SUPABASE_SERVICE_ROLE_KEY missing)')
  }
  return createServiceRoleClient(url, key)
}

export type AdminResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

function isDbNotReadyError(error: { message?: string; code?: string; details?: string; hint?: string } | null) {
  if (!error) return false
  const m = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  return /relation .* does not exist|column .* does not exist|42p01|42703/.test(m)
}

/** Authenticate the request and verify the caller is an active admin. */
export async function getAdminUser(req: NextRequest): Promise<AdminResult> {
  try {
    const auth = await getAuthUser(req)
    if (!auth.ok) {
      return {
        ok: false,
        response: NextResponse.json({ error: auth.error }, { status: auth.status }),
      }
    }

    const service = adminDb()
    const { data: profile, error } = await service
      .from('profiles')
      .select('role, account_status')
      .eq('id', auth.userId)
      .maybeSingle()

    if (error) {
      // Missing migration → fail closed but tell the caller why.
      if (isDbNotReadyError(error)) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: 'Admin tables are not ready. Apply supabase/migrations/20260907000000_admin_dashboard.sql first.', code: DB_NOT_READY_CODE },
            { status: 409 }
          ),
        }
      }
      return {
        ok: false,
        response: NextResponse.json({ error: 'Admin authorization failed' }, { status: 500 }),
      }
    }

    if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'admin')) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'You do not have permission to access this area.' },
          { status: 403 }
        ),
      }
    }

    if (profile.account_status !== 'ACTIVE') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Your admin account is not active.' },
          { status: 403 }
        ),
      }
    }

    return { ok: true, userId: auth.userId }
  } catch (err) {
    console.error('getAdminUser error:', err)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin authorization failed' }, { status: 500 }),
    }
  }
}

/** Fetch all auth users (paginated). Small user base — safe in practice. */
export async function listAllAuthUsers() {
  const service = adminDb()
  const users: Array<{
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
    user_metadata: Record<string, unknown>
  }> = []
  let page = 1
  let nextPage: number | null = 0
  let guard = 0

  do {
    if (guard++ > 25) break // hard cap ~25k users
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Failed to list users: ${error.message}`)
    users.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email ?? '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        user_metadata: (u.user_metadata ?? {}) as Record<string, unknown>,
      }))
    )
    nextPage = data.nextPage
    page += 1
  } while (nextPage)

  return users
}

/** Write an admin audit log entry (best effort — never throws). */
export async function audit(
  adminId: string,
  action: string,
  targetType?: string | null,
  targetId?: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    await adminDb()
      .from('admin_audit_logs')
      .insert({
        admin_user_id: adminId,
        action,
        target_type: targetType ?? null,
        target_id: targetId ?? null,
        metadata: metadata ?? {},
      })
  } catch (err) {
    console.error('audit: failed to write admin_audit_logs', err)
  }
}

/** Record a system error (best effort — must never break the calling route). */
export async function reportError(opts: {
  userId?: string | null
  errorCode?: string | null
  service: string
  level?: 'critical' | 'error' | 'warning'
  message: string
  metadata?: Record<string, unknown>
}) {
  try {
    await adminDb().from('system_errors').insert({
      user_id: opts.userId ?? null,
      error_code: opts.errorCode ?? null,
      service: opts.service,
      level: opts.level ?? 'error',
      message: opts.message.slice(0, 4000),
      metadata: opts.metadata ?? {},
    })
  } catch (err) {
    console.error(`reportError: failed to write system_errors [${opts.service}]`, err)
  }
}

/** Touch profiles.last_active_at when a real user action happens. */
export async function touchActivity(userId: string, activityType: string, description = '', metadata: Record<string, unknown> = {}) {
  try {
    const service = adminDb()
    await service.from('user_activity_logs').insert({
      user_id: userId,
      activity_type: activityType,
      description,
      metadata,
    })
  } catch (err) {
    console.error('touchActivity: failed to write user_activity_logs', err)
  }
}

/** Map a ProfileRow-safe shape from a row fetched with the service role. */
export function profileFromRow(row: ProfileRow | null | undefined) {
  return row ?? null
}