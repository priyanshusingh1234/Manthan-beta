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
    <View className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
      <View className="flex items-start justify-between gap-4 flex-row">
        <View className="flex-1 flex-row">
          <View className="flex items-center gap-3 flex-row">
            <View className="text-slate-700 font-semibold text-lg flex items-center gap-2 flex-row">
              <Text>{app.fullName}</Text>
              {app.status === 'approved' && <TeacherBadge />}
            </View>
            <View className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600">{app.school}</View>
            <View className="ml-auto text-xs text-slate-400">{new Date(app.createdAt).toLocaleString()}</View>
          </View>
          <View className="mt-2 text-sm text-slate-600">Subjects: <Text className="font-medium text-slate-800">{app.subjects}</Text></View>
          {app.email && <View className="mt-1 text-sm text-slate-500">Email: {app.email}</View>}
          {app.schoolEmail && <View className="mt-1 text-sm text-slate-500">School email: {app.schoolEmail}</View>}
          {app.experience && <View className="mt-1 text-sm text-slate-500">Experience: {app.experience} years</View>}
          {app.bio && <View className="mt-2 text-sm text-slate-600">{app.bio}</View>}
        </View>

        <View className="flex flex-col gap-2">
          <View className={`text-sm font-semibold ${app.status === 'pending' ? 'text-amber-600' : app.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
            {app.status.toUpperCase()}
          </View>
          <View disabled={loading || app.status !== 'pending'} onPress={() => review('approve')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50">Approve</View>
          <View disabled={loading || app.status !== 'pending'} onPress={() => review('reject')} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50">Reject</View>
        </View>
      </View>
    </View>
  );
}
