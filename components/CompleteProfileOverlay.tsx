"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, GraduationCap, Loader2, Sparkles } from 'lucide-react';

export default function CompleteProfileOverlay({ onComplete }: { onComplete?: () => void }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (error) setError('');

    if (/[A-Z]/.test(val)) {
      setError('Username cannot contain uppercase letters');
    } else if (/\s/.test(val)) {
      setError('Username cannot contain spaces');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (/[A-Z]/.test(username) || /\s/.test(username)) {
      setError('Username must be lowercase with no spaces');
      return;
    }
    if (!fullName || !classGrade) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check username uniqueness
      try {
        const uniqueCheckRes = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
        if (uniqueCheckRes.ok) {
          const uniqueCheckData = await uniqueCheckRes.json();
          if (!uniqueCheckData.isUnique) {
            setError('Username is already taken. Please choose a different username.');
            setLoading(false);
            return;
          }
        }
      } catch {
        // continue if fails
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username,
          fullName,
          classGrade,
          ageConfirmed: true,
          username_updates: []
        }
      });

      if (updateError) throw updateError;
      
      if (onComplete) onComplete();
      else window.location.reload();
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-8 animate-in fade-in zoom-in duration-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 pointer-events-none" />
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 relative z-10 border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
            <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center text-slate-900 dark:text-white mb-2">
          Complete Your Profile
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">
          Welcome! We need a few more details before you can enter the Arena.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={handleUsernameChange}
                placeholder="coolstudent123"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-2">Class / Grade</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <GraduationCap className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <select
                required
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="">Select Class</option>
                {[6,7,8,9,10,11,12].map(n => <option key={n} value={n}>Class {n}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="text-xs font-bold text-red-500 text-center p-2 bg-red-50 dark:bg-red-500/10 rounded-xl">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Dheeyudha'}
          </button>
        </form>
      </div>
    </div>
  );
}
