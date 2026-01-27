import React from 'react'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function DashboardPage() {
  // fetch all applications
  const { data: apps, error } = await supabaseAdmin.from('teacher_applications').select('*').order('created_at', { ascending: false })

  if (error) return <div className="p-6">Error loading applications: {error.message}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Applications</h1>
      <div className="space-y-4">
        {(apps || []).map((app: { id: number; proof_url?: string; name: string; email: string; main_subject?: string; school?: string; social_handle?: string; status?: string }) => (
          <div key={app.id} className="p-4 border rounded flex items-start gap-4">
            <div className="w-40">
              {app.proof_url ? (
                // show image if present (unoptimized to avoid extra config)
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
                <button onClick={async () => { await fetch('/api/teacher/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: app.id, action: 'accept' }) }); location.reload() }} className="px-3 py-1 bg-emerald-600 text-white rounded">Accept</button>
                <button onClick={async () => { await fetch('/api/teacher/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: app.id, action: 'reject' }) }); location.reload() }} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                <div className="ml-auto text-sm text-slate-500">Status: {app.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
