"use client";

import React, { useState } from 'react';

type App = {
  id: string;
  fullName: string;
  email?: string;
  school: string;
  schoolEmail?: string;
  subjects: string;
  experience?: string;
  bio?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

import TeacherBadge from '@/ticks/teacher';

export default function AdminApplicationItem({ app, onChange }: { app: App; onChange: (a: App) => void }) {
  const [loading, setLoading] = useState(false);

  const review = async (action: 'approve' | 'reject') => {
    if (!confirm(`Mark application from ${app.fullName} as ${action}?`)) return;
    setLoading(true);
    try {
      // include current user's access token so server can verify email
      const mod = await import('@/lib/supabaseClient');
      const { data: { session } } = await mod.supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/teacher/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: app.id, action }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Review failed');
      onChange(body.data);
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-slate-700 font-semibold text-lg flex items-center gap-2">
              <span>{app.fullName}</span>
              {app.status === 'approved' && <TeacherBadge />}
            </div>
            <div className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600">{app.school}</div>
            <div className="ml-auto text-xs text-slate-400">{new Date(app.createdAt).toLocaleString()}</div>
          </div>
          <div className="mt-2 text-sm text-slate-600">Subjects: <span className="font-medium text-slate-800">{app.subjects}</span></div>
          {app.email && <div className="mt-1 text-sm text-slate-500">Email: {app.email}</div>}
          {app.schoolEmail && <div className="mt-1 text-sm text-slate-500">School email: {app.schoolEmail}</div>}
          {app.experience && <div className="mt-1 text-sm text-slate-500">Experience: {app.experience} years</div>}
          {app.bio && <div className="mt-2 text-sm text-slate-600">{app.bio}</div>}
        </div>

        <div className="flex flex-col gap-2">
          <div className={`text-sm font-semibold ${app.status === 'pending' ? 'text-amber-600' : app.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
            {app.status.toUpperCase()}
          </div>
          <button disabled={loading || app.status !== 'pending'} onClick={() => review('approve')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50">Approve</button>
          <button disabled={loading || app.status !== 'pending'} onClick={() => review('reject')} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50">Reject</button>
        </div>
      </div>
    </div>
  );
}
