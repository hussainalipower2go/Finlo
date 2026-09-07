import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { adminDb, touchActivity } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const FeedbackSchema = z.object({
  type: z.enum(['bug_report', 'feature_request', 'general']),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(4000),
})

/**
 * Public (any signed-in user) feedback submission.
 * Inserts into user_feedback via the service role after verifying the session.
 */
export async function POST(req: Request) {
  let body
  try {
    body = FeedbackSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const serverClient = await createServerClient()
    const {
      data: { user },
    } = await serverClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await adminDb().from('user_feedback').insert({
      user_id: user.id,
      type: body.type,
      title: body.title,
      message: body.message,
    }).select().single()

    if (error) {
      const code = `${error.code ?? ''}`
      if (/42p01|42703/.test(code.toLowerCase())) {
        return NextResponse.json(
          { error: 'Feedback storage is not ready. Apply supabase/migrations/20260907000000_admin_dashboard.sql first.', code: 'ADMIN_DB_NOT_READY' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await touchActivity(user.id, 'feedback_submitted', `Submitted ${body.type.replace('_', ' ')} feedback`, {
      feedback_id: data.id,
    })

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    console.error('feedback submit error:', err)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}