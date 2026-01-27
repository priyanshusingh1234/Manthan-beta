import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // basic validation
    if (!body.user_id || !body.name || !body.main_subject) return NextResponse.json({ error: 'invalid' }, { status: 400 })

    const insertRes = await supabase.from('teacher_applications').insert([body])
    if (insertRes.error) return NextResponse.json({ error: insertRes.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
