import React from 'react'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminApplicationItem from '@/components/AdminApplicationItem'

export default async function DashboardPage() {
  // fetch all applications
  const { data: apps, error } = await supabaseAdmin.from('teacher_applications').select('*').order('created_at', { ascending: false })

  if (error) return <div className="p-6">Error loading applications: {error.message}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Applications</h1>
      <div className="space-y-4">
        {(apps || []).map((app: { id: number; proof_url?: string | null; name: string; email: string; main_subject?: string | null; school?: string | null; social_handle?: string | null; status?: string | null }) => (
          <AdminApplicationItem key={app.id} app={app} />
        ))}
      </div>
    </div>
  )
}
