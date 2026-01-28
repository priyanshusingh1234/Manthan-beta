import { NextResponse } from 'next/server'
// `supabase` client is intentionally not used here; server actions use `supabaseAdmin`
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'


export async function POST(req: Request) {
  try {
    const body = await req.json()
    // basic validation
    if (!body.name || !body.main_subject) return NextResponse.json({ error: 'invalid' }, { status: 400 })

    // If an anonymous applicant supplied email+password, create a user account
    if ((!body.user_id || body.user_id === null) && body.email && body.password) {
      try {
        const createRes = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          user_metadata: { fullName: body.name }
        })
        if (createRes.error) {
          return NextResponse.json({ error: createRes.error.message }, { status: 500 })
        }
        // set user_id to newly created user's id
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error - lib types are loose here
        body.user_id = createRes.user?.id ?? null
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    }

    // remove password before storing
    if (body.password) delete body.password

    // Use the admin (service-role) client server-side so Row Level Security does not block inserts
    const insertRes = await supabaseAdmin.from('teacher_applications').insert([body])
    if (insertRes.error) return NextResponse.json({ error: insertRes.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
