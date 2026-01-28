"use client"

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type App = {
  id: number
  proof_url?: string | null
  name: string
  email: string
  main_subject?: string | null
  school?: string | null
  social_handle?: string | null
  status?: string | null
}

export default function AdminApplicationItem({ app }: { app: App }) {
  const router = useRouter()

  const handle = async (action: 'accept' | 'reject') => {
    await fetch('/api/teacher/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, action })
    })
    router.refresh()
  }

  return (
    <div className="p-4 border rounded flex items-start gap-4">
      <div className="w-40">
        {app.proof_url ? (
          <Image src={app.proof_url} alt="proof" width={160} height={128} className="rounded object-cover" unoptimized />
        ) : (
          <div className="w-40 h-32 bg-gray-100 flex items-center justify-center">No proof</div>
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium">{app.name} — {app.email}</div>
        <div className="text-sm text-slate-600">Subject: {app.main_subject} • School: {app.school}</div>
        <div className="mt-2">Social: {app.social_handle}</div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => handle('accept')} className="px-3 py-1 bg-emerald-600 text-white rounded">Accept</button>
          <button onClick={() => handle('reject')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
          <div className="ml-auto text-sm text-slate-500">Status: {app.status}</div>
        </div>
      </div>
    </div>
  )
}
