import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
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
    <View onPress={handleSubmit} className="space-y-4">
      {message && (
        <View className={`px-4 py-2 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message.text}
        </View>
      )}

      <View>
        <Text className="block text-sm font-medium text-slate-700">Full name <Text className="text-red-500">*</Text></Text>
        <TextInput name="fullName" value={form.fullName} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </View>

      <View>
        <Text className="block text-sm font-medium text-slate-700">Email (optional)</Text>
        <TextInput name="email" value={form.email} onChange={handleChange} type="email" className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </View>

      <View>
        <Text className="block text-sm font-medium text-slate-700">School / Institution <Text className="text-red-500">*</Text></Text>
        <TextInput name="school" value={form.school} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </View>

      <View>
        <Text className="block text-sm font-medium text-slate-700">School email (optional)</Text>
        <TextInput name="schoolEmail" value={form.schoolEmail} onChange={handleChange} type="email" className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </View>

      <View>
        <Text className="block text-sm font-medium text-slate-700">Special subject(s) <Text className="text-red-500">*</Text></Text>
        <TextInput name="subjects" value={form.subjects} onChange={handleChange} placeholder="e.g. Mathematics, Physics" required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
        <Text className="text-xs text-slate-400 mt-1">Enter comma-separated subjects if multiple.</Text>
      </View>

      <View>
        <Text className="block text-sm font-medium text-slate-700">Years of experience (optional)</Text>
        <TextInput name="experience" value={form.experience} onChange={handleChange} type="number" min={0} className="mt-1 block w-40 rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500" />
      </View>

      <View>
        <Text className="block text-sm font-medium text-slate-700">Short bio / message (optional)</Text>
        <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"></textarea>
      </View>

      <View className="pt-2">
        <View type="submit" disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60 flex-row">
          {loading ? 'Submitting…' : 'Submit application'}
        </View>
      </View>
    </View>
  );
}
