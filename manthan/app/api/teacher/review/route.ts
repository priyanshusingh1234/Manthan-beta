import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRole) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for admin actions')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } })

export async function POST(req: Request) {
  try {
    const { applicationId, email, action } = await req.json()

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'applicationId and action are required' }, { status: 400 })
    }

    // fetch the application to ensure it exists
    const { data: appData, error: fetchErr } = await supabaseAdmin
      .from('teacher_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (fetchErr || !appData) {
      return NextResponse.json({ error: fetchErr?.message || 'application not found' }, { status: 404 })
    }

    if (action === 'accept') {
      if (!email) return NextResponse.json({ error: 'email is required for accept action' }, { status: 400 })

      // Invite user by email (sends an invite link)
      const inviteRes = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
      if (inviteRes.error) {
        return NextResponse.json({ error: inviteRes.error.message }, { status: 500 })
      }

      // Attempt to extract the newly created user's id from the response
      // Different supabase versions may return different shapes; check common locations
      // inviteRes.data?.user?.id or inviteRes.user?.id or inviteRes.data?.id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyRes: any = inviteRes as any
      const newUserId = anyRes?.data?.user?.id || anyRes?.user?.id || anyRes?.data?.id || null

      // Update the application row with approved status and user_id
      const { error: updateErr } = await supabaseAdmin
        .from('teacher_applications')
        .update({ status: 'approved', user_id: newUserId })
        .eq('id', applicationId)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, userId: newUserId })
    }

    if (action === 'reject') {
      const { error: updateErr } = await supabaseAdmin
        .from('teacher_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
