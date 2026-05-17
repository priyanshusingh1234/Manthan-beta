"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as UserIcon, GraduationCap, Loader2, Sparkles, Sword, Building2, Trophy, PlaySquare, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NativeAudio } from '@capacitor-community/native-audio';
import { StatusBar } from '@capacitor/status-bar';
import confetti from 'canvas-confetti';
import { Capacitor } from '@capacitor/core';
import type { User } from '@supabase/supabase-js';
import { isValidUsername, sanitizeUsernameInput } from '@/lib/username';

export default function CompleteProfileOverlay({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<number | null>(null); // null means loading
  const [user, setUser] = useState<User | null>(null);
  
  // For new users (Google)
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [school, setSchool] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duelWon, setDuelWon] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);

  // 1. Initialize logic
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) {
        setUser(user);
        const meta = user.user_metadata || {};
        
        // Even if they filled the form, start them at Step 1 (Welcome Screen)
        // We will pre-fill their existing data so they can see it!
        setUsername(meta.username || '');
        setFullName(meta.fullName || meta.name || '');
        setClassGrade(meta.classGrade || '');
        setSchool(meta.school || '');
        
        setStep(1); 
      }
    };
    init();

    if (Capacitor.isNativePlatform()) {
      NativeAudio.preload({
        assetId: 'level_up',
        assetPath: 'level_up.mp3',
        isComplex: false,
      }).catch(() => {});
      
      // Hide status bar to make it truly fullscreen
      StatusBar.hide().catch(() => {});
    }
    
    return () => { 
      mounted = false; 
      if (Capacitor.isNativePlatform()) {
        StatusBar.show().catch(() => {});
      }
    };
  }, []);

  const isPreFilled = !!user?.user_metadata?.username;
  const isTeacher = user?.user_metadata?.isTeacher === true || user?.user_metadata?.is_teacher === true;
  const isClassLocked = !!user?.user_metadata?.classGrade;

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeUsernameInput(e.target.value);
    setUsername(sanitized);
    if (error) setError('');
  };

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (username.length < 3) return setError('Username must be at least 3 characters');
    if (!isValidUsername(username)) return setError('Username can only contain lowercase letters, numbers, and underscores');
    if (!fullName) return setError('Please fill in all required fields');

    if (!isTeacher && !classGrade) return setError('Please fill in all required fields');

    setLoading(true);
    setError('');

    try {
      // Check username uniqueness if it changed
      if (username !== user?.user_metadata?.username) {
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
        } catch {}
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username,
          fullName,
          classGrade: isTeacher ? (user?.user_metadata?.classGrade || '') : classGrade,
          school,
          ageConfirmed: true,
          username_updates: []
        }
      });

      if (updateError) throw updateError;

      // Sync to DB
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        fetch('/api/profile/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).catch(() => {});
      }
      
      setStep(2); // Move to Feature Tour
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = async () => {
    setDuelWon(true);
    if (Capacitor.isNativePlatform()) {
      NativeAudio.play({ assetId: 'level_up' }).catch(() => {});
    }
    
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#d946ef', '#3b82f6', '#f59e0b'],
      zIndex: 10000
    });

    await supabase.auth.updateUser({
      data: { has_completed_onboarding: true }
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      fetch('/api/profile/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => {});
    }

    setTimeout(() => {
      if (onComplete) onComplete();
      else window.location.reload();
    }, 3000);
  };

  if (step === null) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative z-10 w-full max-w-md mx-auto"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30 shrink-0">
                <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center text-slate-900 dark:text-white mb-2">
              {isPreFilled ? "Identity Verified" : "Join the Ranks"}
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">
              {isPreFilled ? "Welcome! Here are the details you provided:" : "Welcome to the Arena. Forging your identity..."}
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4 w-full">
              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isPreFilled}
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Username (e.g. shadowwarrior)"
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-[15px] font-bold transition-all font-mono ${isPreFilled ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500'}`}
                  />
                </div>
              </div>

              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isPreFilled}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-[15px] font-bold transition-all ${isPreFilled ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500'}`}
                  />
                </div>
              </div>

              <div className="group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="School Name (Optional)"
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-[15px] font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {!isTeacher && (
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <select
                      required
                      disabled={isClassLocked}
                      value={classGrade}
                      onChange={(e) => setClassGrade(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-[15px] font-bold transition-all appearance-none ${isClassLocked ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500'}`}
                    >
                      <option value="" disabled>Select Your Class</option>
                      {[6,7,8,9,10,11,12].map(n => <option key={n} value={n}>Class {n}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-red-500 text-center p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 transition-transform flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Continue'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto"
          >
            <Shield className="w-16 h-16 text-indigo-500 mb-6" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center text-slate-900 dark:text-white mb-6">
              Welcome to the Arena
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 text-base font-medium mb-8 leading-relaxed">
              Dheeyudha is not just an app. It is a battlefield where knowledge is power. Are you ready to prove your intelligence?
            </p>

            <div className="space-y-4 w-full mb-8">
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Leaderboards</h3>
                  <p className="text-xs text-slate-500">Answer questions to climb the global ranks.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <PlaySquare className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Video Clips</h3>
                  <p className="text-xs text-slate-500">Learn from bite-sized educational reels.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 transition-transform"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/40 shrink-0">
                <Sword className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center text-slate-900 dark:text-white mb-6">
              The Duel
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 text-base font-medium mb-8 leading-relaxed">
              The ultimate test of knowledge is the <strong>1v1 Duel</strong>. Challenge your classmates, answer faster, and steal their points.
            </p>

            <div className="w-full bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 mb-8 text-center">
              <p className="text-rose-800 dark:text-rose-300 font-bold mb-2">Rules of the Duel:</p>
              <ul className="text-sm text-rose-600 dark:text-rose-400 space-y-2 font-medium">
                <li>⚔️ Challenge anyone from your school</li>
                <li>⏱️ You have limited time to answer</li>
                <li>☠️ Wrong answers damage your health</li>
              </ul>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/30 active:scale-95 transition-transform"
            >
              Start Practice Duel
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto"
          >
            {/* The Duel Header */}
            <div className="flex items-center justify-between w-full gap-2 mb-8 px-4">
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-[3px] border-indigo-500 flex items-center justify-center shadow-lg transition-transform duration-300 ${duelWon ? 'scale-110 shadow-indigo-500/50' : ''}`}>
                    {user?.user_metadata?.avatar_url && !user.user_metadata.avatar_url.includes('googleusercontent') ? (
                      <img src={user.user_metadata.avatar_url} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">😎</span>
                    )}
                  </div>
                  {duelWon && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-md">
                      <Sparkles className="w-4 h-4 text-yellow-900" />
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase mt-3 text-indigo-600 dark:text-indigo-400 tracking-widest">{user?.user_metadata?.username || 'YOU'}</span>
                {/* Health Bar */}
                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="w-full h-full bg-green-500 rounded-full" />
                </div>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <motion.div animate={duelWon ? { rotate: 180, scale: 0.5, opacity: 0 } : {}} transition={{ duration: 0.5 }}>
                  <Sword className="w-8 h-8 text-rose-500 animate-pulse mb-2" />
                </motion.div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">VS</span>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className={`w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900 overflow-hidden border-[3px] border-rose-500 flex items-center justify-center shadow-lg transition-all duration-300 ${duelWon ? 'grayscale opacity-50 scale-95' : ''}`}>
                  <span className="text-2xl">{duelWon ? '😵' : '🤖'}</span>
                </div>
                <span className="text-[10px] font-black uppercase mt-3 text-rose-600 dark:text-rose-400 tracking-widest">Master Bot</span>
                {/* Health Bar */}
                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: duelWon ? '0%' : '100%' }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="h-full bg-rose-500 rounded-full" 
                  />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center text-slate-900 dark:text-white mb-2">
              {duelWon ? 'Victory!' : 'Practice Duel'}
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
              {duelWon ? 'You have proven your worth. Entering the Arena...' : 'Answer correctly to defeat the bot!'}
            </p>
            
            <AnimatePresence mode="wait">
              {!duelWon && (
                <motion.div 
                  key="question"
                  exit={{ opacity: 0, y: 20 }}
                  className={`w-full bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 ${wrongAnswer ? 'border-red-500 animate-shake' : 'border-slate-100 dark:border-slate-700'} mb-8 transition-colors`}
                >
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 text-center mb-6">
                    Which organelle is known as the powerhouse of the cell?
                  </p>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => setWrongAnswer(true)}
                      className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-left font-bold text-slate-700 dark:text-slate-300 active:bg-rose-50 dark:active:bg-rose-900/30 active:border-rose-500 transition-colors"
                    >
                      <span className="inline-block w-8 text-indigo-500">A</span> Nucleus
                    </button>
                    <button 
                      onClick={finishOnboarding}
                      className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-left font-bold text-slate-700 dark:text-slate-300 active:bg-green-50 dark:active:bg-green-900/30 active:border-green-500 transition-colors"
                    >
                      <span className="inline-block w-8 text-indigo-500">B</span> Mitochondria
                    </button>
                    <button 
                      onClick={() => setWrongAnswer(true)}
                      className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-left font-bold text-slate-700 dark:text-slate-300 active:bg-rose-50 dark:active:bg-rose-900/30 active:border-rose-500 transition-colors"
                    >
                      <span className="inline-block w-8 text-indigo-500">C</span> Ribosome
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
