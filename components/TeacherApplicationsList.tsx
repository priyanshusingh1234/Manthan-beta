"use client";

import React, { useEffect, useState } from 'react';
import AdminApplicationItem from './AdminApplicationItem';

type AppType = any;

import { supabase } from '@/lib/supabaseClient';

export default function TeacherApplicationsList() {
  const [apps, setApps] = useState<AppType[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  const checkAdmin = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email?.toLowerCase() || '';
      setIsAdmin(adminEmails.includes(email));
    } catch (err) {
      console.error(err);
      setIsAdmin(false);
    }
  };

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      // include auth token so server can validate email from the JWT payload
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const q = filter === 'all' ? '' : `?status=${filter}`;
      const res = await fetch(`/api/teacher/apply${q}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const body = await res.json();

      if (!res.ok) {
        const msg = (body && (body.error || body.message)) || `Server returned ${res.status}`;
        setError(msg);
        setApps([]);
        return;
      }

      if (!Array.isArray(body)) {
        setError('Unexpected server response — expected list of applications.');
        setApps([]);
        return;
      }

      setApps(body);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch applications');
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAdmin(); }, []);
  useEffect(() => { if (isAdmin) fetchApps(); }, [filter, isAdmin]);

  const onChange = (updated: AppType) => {
    setApps((s) => (Array.isArray(s) ? s.map((a) => (a.id === updated.id ? updated : a)) : s));
  };

  if (isAdmin === null) return <div className="text-sm text-slate-500">Checking permissions…</div>;
  if (!isAdmin) return <div className="text-sm text-red-600">Not authorized — admin access required.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Teacher applications</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Filter</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="rounded-lg border border-slate-200 px-3 py-1">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button onClick={fetchApps} className="ml-3 px-3 py-1 rounded-lg bg-slate-100">Refresh</button>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {error && <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700">{error}</div>}

      <div className="grid gap-4">
        {(!Array.isArray(apps) || apps.length === 0) && !loading && !error && <div className="text-sm text-slate-400">No applications.</div>}
        {Array.isArray(apps) && apps.map((a) => (
          <AdminApplicationItem key={a.id} app={a} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
