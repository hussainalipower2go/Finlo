import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUser, adminDb, audit } from '@/lib/admin/helpers'

export const runtime = 'nodejs'

const SettingsSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
})

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  try {
    const { data, error } = await adminDb().from('admin_settings').select('*')
    if (error) return NextResponse.json({ settings: [] })
    return NextResponse.json({ settings: data ?? [] })
  } catch (err) {
    console.error('settings route error:', err)
    return NextResponse.json({ settings: [] })
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req)
  if (!admin.ok) return admin.response

  let body
  try {
    body = SettingsSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const { error } = await adminDb()
      .from('admin_settings')
      .update({ value: body.value, updated_by: admin.userId, updated_at: new Date().toISOString() })
      .eq('key', body.key)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await audit(admin.userId, `update_settings_${body.key}`, 'settings', body.key)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('settings update error:', err)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}