"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function RSVPsPage() {
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRSVPs = async () => {
      try {
        // Query event_rsvps and join with profiles
        const { data, error } = await supabase
          .from('event_rsvps')
          .select(`
            status,
            created_at,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url,
              class_grade
            )
          `)
          .eq('event_id', 'class10_unit_test_1')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRsvps(data || []);
      } catch (err: any) {
        console.error('Fetch RSVPs error:', err);
        setError(err.message || 'Failed to load RSVPs. Make sure the database table exists!');
      } finally {
        setLoading(false);
      }
    };

    fetchRSVPs();
  }, []);

  const goingCount = rsvps.filter(r => r.status === 'in').length;
  const notGoingCount = rsvps.filter(r => r.status === 'out').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="text-slate-600 dark:text-slate-300" size={24} />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Event RSVPs</h1>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/60 p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">✨ Class 10 Unit Test</h2>
            <div className="flex flex-row gap-6 mt-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 rounded-2xl flex-1 border border-emerald-100 dark:border-emerald-800/50">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-1 uppercase tracking-wider text-sm">Going</span>
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{goingCount}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl flex-1 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1 uppercase tracking-wider text-sm">Not Going</span>
                <span className="text-3xl font-black text-slate-700 dark:text-slate-300">{notGoingCount}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading attendees...</div>
          ) : rsvps.length === 0 && !error ? (
            <div className="text-center py-12 text-slate-500 italic">No one has registered yet.</div>
          ) : (
            <div className="space-y-4">
              {rsvps.map((rsvp, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                      {rsvp.profiles?.avatar_url ? (
                        <img src={rsvp.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                          {(rsvp.profiles?.full_name?.[0] || rsvp.profiles?.username?.[0] || '?').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                        {rsvp.profiles?.full_name || rsvp.profiles?.username || 'Unknown Student'}
                      </p>
                      {rsvp.profiles?.class_grade && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Class {rsvp.profiles.class_grade}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {rsvp.status === 'in' ? (
                      <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">Going</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-full">
                        <XCircle size={16} className="text-slate-500 dark:text-slate-400" />
                        <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">Out</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
