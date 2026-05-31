"use client"

import { Link } from 'expo-router';
import React from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function AuthButtons() {
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => { if (mounted) setUser(user) })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => { if (mounted) setUser(session?.user ?? null) })
    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  if (user) return null

  return (
    <View className="flex gap-3 justify-center mt-6 lg:mt-0 flex-row">
      <Link href="/login" className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-blue-600 font-semibold shadow hover:shadow-md flex-row">Sign in</Link>
      <Link href="/signup" className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow hover:shadow-lg flex-row">Sign up</Link>
    </View>
  )
}
