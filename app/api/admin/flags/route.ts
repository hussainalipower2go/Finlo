import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser, adminDb, audit } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const FlagSchema = z.object({
  key: z.string().min(1).max(80),
  enabled: z.boolean(),
})

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  try {
    const { data, error } = await adminDb().from('feature_flags').select('*').order('key', { ascending: true })
    if (error) {
      return NextResponse.json({ flags: [], ready: false })
    }
    return NextResponse.json({ flags: data ?? [], ready: true })
  } catch (err) {
    console.error('flags route error:', err)
    return NextResponse.json({ flags: [], ready: false })
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  let body
  try {
    body = FlagSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const { error } = await adminDb()
      .from('feature_flags')
      .update({ enabled: body.enabled, updated_by: admin.userId, updated_at: new Date().toISOString() })
      .eq('key', body.key)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await audit(admin.userId, 'toggle_feature_flag', 'feature_flag', body.key, { enabled: body.enabled })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('flag toggle error:', err)
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 })
  }
}