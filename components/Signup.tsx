"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, User, GraduationCap, ArrowRight, Loader2, Play } from 'lucide-react';
import Logo from './Logo';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 pointer-events-none" />
      
      {/* Home link */}
      <Link href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors hidden sm:block">Back to Arena</span>
      </Link>

      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col lg:flex-row relative z-10 lg:min-h-[85vh]">
        
        {/* Left Side: Creative Branding (Desktop only, acts as hero) */}
        <div className="hidden lg:flex w-5/12 bg-slate-950 p-12 flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/20 z-0" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 blur-[100px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/30 blur-[100px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center p-2.5 shadow-lg shadow-indigo-500/30">
               <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-2xl font-black italic tracking-tighter text-white">DHEEYUDHA</span>
          </div>

          <div className="relative z-10 space-y-6 max-w-md">
             <h1 className="text-5xl font-black uppercase italic leading-[0.9] tracking-tighter text-white">
                Enter The<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">War Room.</span>
             </h1>
             <p className="text-slate-400 font-medium">Join thousands of students nationwide in epic academic battles. Forge your legacy today.</p>
             
             <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                   <h3 className="text-white font-black text-2xl">100+</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Gauntlets</p>
                </div>
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                   <h3 className="text-white font-black text-2xl">Global</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Leaderboards</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 lg:p-16 relative overflow-y-auto custom-scrollbar">
          
          <div className="max-w-md w-full mx-auto space-y-8 relative z-10">
            {/* Header (Mobile + Desktop) */}
            <div className="text-center lg:text-left space-y-2">
              <div className="lg:hidden flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center p-3 shadow-lg shadow-indigo-500/30">
                  <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Create Account</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your academic journey begins here.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input type="text" required value={username} onChange={handleUsernameChange} placeholder="coolstudent123" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Confirm</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Class / Grade</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <select required value={classGrade} onChange={(e) => setClassGrade(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
                    <option value="">Select Academic Level</option>
                    {[6,7,8,9,10,11,12].map((g) => <option key={g} value={g}>Class {g}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input type="checkbox" required checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-700 checked:bg-indigo-500 checked:border-indigo-500 transition-all" />
                    <CheckIcon className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">I confirm I am at least 14 years old</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input type="checkbox" required checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-700 checked:bg-indigo-500 checked:border-indigo-500 transition-all" />
                    <CheckIcon className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    I agree to the <Link href="/privacy" className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold ml-1">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                  <p className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black text-sm italic uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join the Battle <ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">or continue via</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/profile` } })} className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-slate-300 dark:hover:border-slate-600 active:scale-95 transition-all shadow-sm">
                  <Chrome className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Google</span>
                </button>
                <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/profile` } })} className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-slate-300 dark:hover:border-slate-600 active:scale-95 transition-all shadow-sm">
                  <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Github</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Already a challenger?{' '}
                  <Link href="/login" className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold ml-1 transition-colors">Sign in</Link>
                </p>
              </div>

            </form>
          </div>
        </div>
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
