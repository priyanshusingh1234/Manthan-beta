"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff, Chrome, User, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (error) setError('');
    if (/[A-Z]/.test(val)) setError('Username cannot contain uppercase letters');
    else if (/\s/.test(val)) setError('Username cannot contain spaces');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) return setError('You must agree to the terms and privacy policy');
    if (!ageConfirmed) return setError('You must confirm you are 14 years or older');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (username.length < 3) return setError('Username must be at least 3 characters');
    if (/[A-Z]/.test(username) || /\s/.test(username)) return setError('Username must be lowercase with no spaces');

    setLoading(true);
    setError('');

    try {
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
      } catch { }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            fullName,
            classGrade,
            ageConfirmed: true,
            username_updates: [],
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message || '';
        if (msg.toLowerCase().includes('already registered')) throw new Error('This email is already registered. Please log in instead.');
        if (msg.toLowerCase().includes('rate limit')) throw new Error('Too many signup attempts. Wait a few minutes.');
        if (msg.toLowerCase().includes('invalid email')) throw new Error('Please enter a valid email address.');
        if (msg.toLowerCase().includes('password')) throw new Error('Password must be at least 6 characters long.');
        throw signUpError;
      }

      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
      Android scroll fix: No fixed/overflow wrappers at all.
      The page flows naturally — Android WebView's native document scroll handles it.
      This is the only reliable approach for Capacitor on Android.
    */
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Top nav bar — sticky so it doesn't scroll away */}
      <div className="sticky top-0 z-30 flex items-center px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Back</span>
        </Link>
        <div className="flex items-center gap-2 mx-auto">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-black italic tracking-tighter text-slate-900 dark:text-white">DHEEYUDHA</span>
        </div>
        <div className="w-16 sm:w-24" /> {/* spacer to center logo */}
      </div>

      {/* Page body — single column, flows naturally */}
      <div className="max-w-md mx-auto px-4 pt-8 pb-20">

        {/* Hero */}
        <div className="text-center mb-8">
          <span className="inline-block bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Join the Battle
          </span>
          <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter uppercase leading-tight text-slate-900 dark:text-white">
            Enter The<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">War Room.</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Create your account and forge your legacy.</p>
        </div>

        {/* Google SSO */}
        <button
          type="button"
          onClick={async () => {
            if (Capacitor.isNativePlatform()) {
              try {
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                GoogleAuth.initialize();
                const googleUser = await GoogleAuth.signIn();
                const idToken = googleUser.authentication.idToken;
                if (idToken) {
                  const { error: authErr } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
                  if (authErr) throw authErr;
                  router.push('/profile');
                }
              } catch (err: any) {
                setError('Google Native Login Failed: ' + (err?.message || 'Unknown error'));
              }
            } else {
              supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/profile` } });
            }
          }}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 active:scale-95 transition-all mb-6"
        >
          <Chrome className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <span className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-50 dark:bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">or sign up with email</span>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">

            {/* Username + Full Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text" required value={username} onChange={handleUsernameChange}
                    placeholder="coolkid99"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Class / Grade</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  required value={classGrade} onChange={(e) => setClassGrade(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Class</option>
                  {[6,7,8,9,10,11,12].map((g) => <option key={g} value={g}>Class {g}</option>)}
                </select>
              </div>
            </div>

            {/* Check boxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" required checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-indigo-500 checked:border-indigo-500 transition-all" />
                  <CheckIcon className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none p-0.5" />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">I confirm I am at least 14 years old</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" required checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 checked:bg-indigo-500 checked:border-indigo-500 transition-all" />
                  <CheckIcon className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none p-0.5" />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  I agree to the <Link href="/privacy" className="text-indigo-500 font-bold">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                <p className="text-xs font-black uppercase tracking-wide text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black text-sm italic uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join the Battle <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>

        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-6">
          Already a challenger?{' '}
          <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-bold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

function CheckIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default Signup;
