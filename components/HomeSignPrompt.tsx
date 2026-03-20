"use client"

import React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function HomeSignPrompt() {
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => { if (mounted) setUser(user) })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => { if (mounted) setUser(session?.user ?? null) })
    return () => { mounted = false; listener?.subscription.unsubscribe() }
  }, [])

  if (user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 mt-6">
      <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-md text-center">
        <h3 className="text-lg font-semibold">Welcome to Dheeyudha</h3>
        <p className="mt-2 text-sm text-slate-600">Sign in or sign up to participate in challenges and see leaderboards.</p>
        <div className="mt-4">
          <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow">Sign in / Sign up</Link>
        </div>
      </div>
    </div>
  )
}
