"use client"

import React, { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function TeacherApplyPage() {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [school, setSchool] = useState('')
  const [social, setSocial] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      setCurrentUser(user || null)
      if (user?.email) setEmailInput(user.email)
    })
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!name || !subject) { setMessage('Name and main subject are required'); return }
    // require either social handle or proof file
    if (!social && !proofFile) { setMessage('Please provide either a social handle or upload a proof document'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      let proofPath = null
      let proofUrl = null
      if (proofFile) {
        const uid = user?.id ?? 'anonymous'
        const path = `teacher-proofs/${uid}/${Date.now()}_${proofFile.name}`
        const { data, error } = await supabase.storage.from('teacher-proofs').upload(path, proofFile, { upsert: true })
        if (error) throw error
        proofPath = data.path
        const { data: publicData } = supabase.storage.from('teacher-proofs').getPublicUrl(data.path)
        proofUrl = publicData.publicUrl
      }

      // insert application record; allow null user_id for anonymous submissions
      const body: Record<string, unknown> = {
        user_id: user?.id ?? null,
        email: user?.email ?? '',
        name,
        main_subject: subject,
        school,
        social_handle: social,
        proof_url: proofUrl,
        proof_path: proofPath,
        status: 'pending'
      }

      // if no signed-in user, require email field from the form
      if (!user) {
        if (!emailInput) { setMessage('Please provide an email to submit application'); setLoading(false); return }
        body.email = emailInput
      }

      const res = await fetch('/api/teacher/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      setMessage('Application submitted')
      router.push('/profile')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Application</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full p-3 border rounded" />
        {!currentUser && (
          <input id="apply-email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Email" className="w-full p-3 border rounded" />
        )}
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Main subject" className="w-full p-3 border rounded" />
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School (optional)" className="w-full p-3 border rounded" />
        <input value={social} onChange={(e) => setSocial(e.target.value)} placeholder="Social handle (optional)" className="w-full p-3 border rounded" />
        <div>
          <label className="block mb-1">Proof (upload certificate or ID)</label>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Submitting…' : 'Submit application'}</button>
        </div>
        {message && <div className="text-sm text-slate-700">{message}</div>}
      </form>
    </div>
  )
}
