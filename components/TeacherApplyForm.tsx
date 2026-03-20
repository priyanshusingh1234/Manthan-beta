"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type FormState = {
  fullName: string;
  email?: string;
  school: string;
  schoolEmail?: string;
  subjects: string;
  experience?: string;
  bio?: string;
};

export default function TeacherApplyForm() {
  const [form, setForm] = useState<FormState>({ fullName: '', email: '', school: '', schoolEmail: '', subjects: '', experience: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.fullName || !form.school || !form.subjects) {
      setMessage({ type: 'error', text: 'Please fill Full name, School and Special subject(s).' });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/teacher/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Submission failed');

      setMessage({ type: 'success', text: 'Application submitted — we will review it and contact you.' });
      setForm({ fullName: '', email: '', school: '', schoolEmail: '', subjects: '', experience: '', bio: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`px-4 py-2 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></label>
        <input name="fullName" value={form.fullName} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Email (optional)</label>
        <input name="email" value={form.email} onChange={handleChange} type="email" className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">School / Institution <span className="text-red-500">*</span></label>
        <input name="school" value={form.school} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">School email (optional)</label>
        <input name="schoolEmail" value={form.schoolEmail} onChange={handleChange} type="email" className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Special subject(s) <span className="text-red-500">*</span></label>
        <input name="subjects" value={form.subjects} onChange={handleChange} placeholder="e.g. Mathematics, Physics" required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-slate-400 mt-1">Enter comma-separated subjects if multiple.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Years of experience (optional)</label>
        <input name="experience" value={form.experience} onChange={handleChange} type="number" min={0} className="mt-1 block w-40 rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Short bio / message (optional)</label>
        <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"></textarea>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60">
          {loading ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}
