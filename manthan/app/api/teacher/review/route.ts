import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const { applicationId, action } = await req.json()
    if (!applicationId || !action) return NextResponse.json({ error: 'invalid' }, { status: 400 })

    type AppRecord = { id: number; user_id: string; user_metadata?: Record<string, unknown> }

    // fetch application
    const { data, error: fetchErr } = await supabaseAdmin.from('teacher_applications').select('*').eq('id', applicationId).single()
    const apps = data as AppRecord | null
    if (fetchErr || !apps) return NextResponse.json({ error: fetchErr?.message || 'not found' }, { status: 404 })

    const status = action === 'accept' ? 'accepted' : 'rejected'
    const { error: updateErr } = await supabaseAdmin.from('teacher_applications').update({ status }).eq('id', applicationId)
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    if (action === 'accept') {
      // give user teacher role/metadata
      const userId = apps.user_id
      try {
        // update user's metadata to mark as teacher
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { ...(apps.user_metadata || {}), teacher_verified: true } })
      } catch (e) {
        console.warn('admin update failed', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
