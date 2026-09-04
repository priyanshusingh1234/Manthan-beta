"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Zap, Users, Shield, Swords, BrainCircuit,
  ArrowRight, Star, CheckCircle2, Flame, BookOpen,
  Target, TrendingUp, Menu, X, ChevronRight, Award
} from 'lucide-react';

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCounter(end: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { emoji: '🔬', label: 'Science', color: 'from-cyan-500 to-blue-500', shadow: 'shadow-blue-500/20' },
  { emoji: '📐', label: 'Maths', color: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-500/20' },
  { emoji: '🌍', label: 'SST', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
  { emoji: '📖', label: 'English', color: 'from-amber-500 to-orange-500', shadow: 'shadow-orange-500/20' },
  { emoji: '🇮🇳', label: 'Hindi', color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
];

const TESTIMONIALS = [
  { name: 'Aarav S.', grade: 'Class 10 • Delhi', text: 'Scored 95% in boards after 3 weeks on Dheeyudha. The duels are addictive!', stars: 5 },
  { name: 'Priya M.', grade: 'Class 10 • Mumbai', text: 'Finally a study app that feels like a game. My SST chapter scores doubled.', stars: 5 },
  { name: 'Rohan K.', grade: 'Class 10 • Bangalore', text: 'The AI Gauntlet pushed me harder than my coaching class ever did.', stars: 5 },
];

// ── Floating card animation ───────────────────────────────────────────────────
const float = {
  animate: { y: [0, -6, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
};
const floatDelay = (d: number) => ({
  animate: { y: [0, -6, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: d } }
});

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const students = useCounter(50, 1800, statsVisible);
  const questions = useCounter(1200, 1600, statsVisible);
  const duels = useCounter(100, 2000, statsVisible);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-violet-200">

      {/* ── Ambient glows (Light Mode) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-200/50 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-rose-200/30 rounded-full blur-[80px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 flex items-center justify-between px-5 sm:px-10 py-5 max-w-7xl mx-auto">
        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Dheeyudha
        </span>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">About</Link>
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
          <Link href="/signup" className="text-sm font-bold px-6 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
            Join Free
          </Link>
        </div>
        <button className="md:hidden p-2 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-4 right-4 mt-2 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-3 flex flex-col gap-1 shadow-2xl z-[60]">
              <Link href="/about" className="px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">About</Link>
              <Link href="/login" className="px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">Sign In</Link>
              <Link href="/signup" className="mt-1 px-4 py-3.5 rounded-xl text-sm font-bold text-center bg-slate-900 text-white">Join Free</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 pt-12 pb-24 sm:pt-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">

          {/* Left copy */}
          <motion.div className="flex-1 text-center lg:text-left" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 text-xs font-bold mb-8 tracking-wide">
              <Flame className="w-4 h-4 text-orange-500" /> 
              <span>#1 Exam Prep Platform for Class 10</span>
            </div>

            <h1 className="text-[2.75rem] sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6 text-slate-900">
              Study Less.<br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                Score More.
              </span><br />
              Beat Everyone.
            </h1>

            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 font-medium">
              Dheeyudha turns boring revision into addictive duels, streaks, and AI-powered quizzes — so you actually <span className="text-slate-900 font-bold">want</span> to study every day.
            </p>

            {/* Subject pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
              {SUBJECTS.map(s => (
                <span key={s.label} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${s.color} text-white text-sm font-bold shadow-md ${s.shadow}`}>
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-base bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-1 active:scale-95">
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                I have an account
              </Link>
            </div>
          </motion.div>

          {/* Right — Refined iOS-style widget mockup */}
          <motion.div className="flex-1 relative w-full max-w-sm mx-auto lg:max-w-none"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>

            {/* Main card */}
            <motion.div {...float} className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 shadow-2xl shadow-indigo-100/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-black shadow-inner">A</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Aarav Sharma</p>
                  <p className="text-xs font-medium text-slate-500">Class 10 · Delhi</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-black text-orange-600">21 Day</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 mb-5 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-700">🔬 Science</span>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">60s</span>
                </div>
                <p className="text-[15px] font-bold text-slate-800 mb-4 leading-snug">The functional unit of the kidney is called the:</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Neuron', 'Nephron', 'Alveolus', 'Villus'].map((opt, i) => (
                    <div key={opt} className={`p-3 rounded-xl text-xs font-bold text-center border shadow-sm transition-all ${i === 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-black">+3 pts</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span className="text-xs font-black">Rank #142</span>
                </div>
              </div>
            </motion.div>

            {/* Floating duel card */}
            <motion.div {...floatDelay(0.8)} className="absolute -bottom-8 -left-4 sm:-left-12 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[1.5rem] p-4 shadow-xl shadow-slate-200/50 w-52 z-20">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-rose-100 p-1.5 rounded-lg">
                  <Swords className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-xs font-black text-rose-600 uppercase tracking-wide">1v1 Duel</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900">You</span>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">VS</span>
                <span className="text-sm font-bold text-slate-900">Priya</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-2 text-center">3 questions left · 45s</p>
            </motion.div>

            {/* Floating XP card */}
            <motion.div {...floatDelay(1.5)} className="absolute -top-6 -right-4 sm:-right-10 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-xl shadow-slate-200/50 w-40 z-20">
              <div className="bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[13px] font-black text-slate-900">Rank Up! 🎉</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">#142 → <span className="text-amber-600 font-bold">#138</span></p>
              <p className="text-[11px] text-amber-600 font-black mt-2 bg-amber-50 px-2 py-1 rounded-md inline-block">+12 XP Earned</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 pb-16">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-12">
          {[
            { value: students, suffix: '+', label: 'Active Students', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { value: questions, suffix: '+', label: 'Curated Questions', icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            { value: duels, suffix: '+', label: 'Duels Fought', icon: Swords, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map(({ value, suffix, label, icon: Icon, color, bg }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <span className={`text-3xl sm:text-5xl font-black text-slate-900 tracking-tight`}>{value.toLocaleString()}{suffix}</span>
              <span className="text-xs sm:text-sm text-slate-500 font-bold mt-2 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 text-slate-900 tracking-tight">Everything you need to <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">top your class</span></h2>
          <p className="text-slate-500 text-lg sm:text-xl font-medium max-w-2xl mx-auto">Built specifically for Indian Class 10 students — covering CBSE boards across all 5 subjects.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card 1 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2 group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-50 group-hover:bg-violet-200 transition-colors" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-6 shadow-sm">
                <Target className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="font-black text-2xl text-slate-900 mb-3 tracking-tight">Smart Adaptive Feed</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-md">Our algorithm analyzes your past mistakes and feeds you personalized questions to target your weakest areas. It's like having a personal tutor.</p>
            </div>
          </motion.div>

          {/* Small Card 1 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="md:col-span-1 group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6 shadow-sm">
              <Swords className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="font-black text-xl text-slate-900 mb-2 tracking-tight">1v1 Live Duels</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Challenge your friends in real-time academic battles to see who is the fastest.</p>
          </motion.div>

          {/* Small Card 2 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="md:col-span-1 group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 shadow-sm">
              <Trophy className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-black text-xl text-slate-900 mb-2 tracking-tight">Daily Leaderboard</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Climb the national ranks every single day and earn badges for your profile.</p>
          </motion.div>

          {/* Large Card 2 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="md:col-span-2 group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-100 rounded-full blur-3xl opacity-50 group-hover:bg-cyan-200 transition-colors" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center mb-6 shadow-sm">
                  <BrainCircuit className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="font-black text-2xl text-slate-900 mb-3 tracking-tight">Live AI Grading</h3>
                <p className="text-slate-500 font-medium leading-relaxed max-w-md">Snap a picture of your handwritten answers. Our AI grades it instantly against board schemas, offering partial points and detailed feedback.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-20 bg-slate-100/50 my-16 rounded-[3rem] border border-slate-200/50">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-3 text-slate-900 tracking-tight">How it works</h2>
          <p className="text-slate-500 text-lg font-medium">From zero to top rank in 3 simple steps</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Sign Up Free', desc: 'Create your account in 30 seconds — no credit card, no hassle.', color: 'from-violet-500 to-indigo-500', shadow: 'shadow-indigo-500/20' },
            { step: '02', title: 'Answer & Earn', desc: 'Solve MCQs from your subjects, earn XP, and track your weak spots.', color: 'from-cyan-500 to-blue-500', shadow: 'shadow-blue-500/20' },
            { step: '03', title: 'Duel & Dominate', desc: 'Challenge friends, climb the leaderboard, and prove you\'re #1.', color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20' },
          ].map(({ step, title, desc, color, shadow }, i) => (
            <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className={`absolute -top-4 -right-2 text-7xl font-black text-slate-100`}>{step}</div>
              <div className={`relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-xl font-black text-white mb-6 shadow-lg ${shadow}`}>{i + 1}</div>
              <h3 className="relative z-10 font-black text-slate-900 text-xl mb-3">{title}</h3>
              <p className="relative z-10 text-base text-slate-500 font-medium leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black mb-3 text-slate-900 tracking-tight">Students love it ❤️</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, grade, text, stars }, i) => (
            <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-8">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: stars }).map((_, j) => <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-base font-medium text-slate-700 leading-relaxed mb-8">"{text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-600 border border-slate-200">{name[0]}</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-xs font-medium text-slate-500">{grade}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="relative bg-slate-900 rounded-[3rem] p-12 sm:p-20 text-center overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.3),_transparent_50%)]" />
          
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/10">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-6 relative z-10 text-white tracking-tight">Ready to top your class?</h2>
          <p className="text-slate-300 text-lg sm:text-xl font-medium mb-10 max-w-xl mx-auto relative z-10">Join 12,000+ students already practising on Dheeyudha. Free forever — start in seconds.</p>
          <Link href="/signup"
            className="relative z-10 inline-flex items-center gap-2 px-10 py-5 rounded-full font-black text-lg bg-white text-slate-900 hover:bg-slate-50 shadow-xl transition-all hover:-translate-y-1 active:scale-95">
            Create Free Account <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-sm font-medium text-slate-400 relative z-10">No credit card required · Takes 30 seconds</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-slate-200 bg-white max-w-7xl mx-auto px-5 sm:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <span className="text-xl font-black text-slate-900 tracking-tight">Dheeyudha</span>
        <div className="flex gap-8">
          <Link href="/privacy" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Privacy</Link>
          <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">About</Link>
          <Link href="/contact" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Contact</Link>
        </div>
        <p className="text-sm font-medium text-slate-500">© 2025 Dheeyudha. Made in India 🇮🇳</p>
      </footer>
    </div>
  );
}
