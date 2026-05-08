"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Zap, Users, Shield, Swords, BrainCircuit,
  ArrowRight, Star, CheckCircle2, Flame, BookOpen,
  Target, TrendingUp, Menu, X
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
  { emoji: '🔬', label: 'Science', color: 'from-cyan-500 to-blue-500' },
  { emoji: '📐', label: 'Maths', color: 'from-violet-500 to-purple-600' },
  { emoji: '🌍', label: 'SST', color: 'from-emerald-500 to-teal-600' },
  { emoji: '📖', label: 'English', color: 'from-amber-500 to-orange-500' },
  { emoji: '🇮🇳', label: 'Hindi', color: 'from-rose-500 to-pink-600' },
];

const FEATURES = [
  { icon: Target, label: 'Smart Feed', desc: 'Personalized questions based on your weak areas', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Swords, label: '1v1 Duels', desc: 'Challenge friends in real-time battles', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: Trophy, label: 'Leaderboard', desc: 'Climb the national rank every day', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: BrainCircuit, label: 'AI Gauntlet', desc: 'Adaptive tests that get harder as you improve', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { icon: TrendingUp, label: 'Streak System', desc: 'Daily streaks keep your learning consistent', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Shield, label: 'Verified Teachers', desc: 'All questions curated by certified educators', color: 'text-blue-400', bg: 'bg-blue-500/10' },
];

const TESTIMONIALS = [
  { name: 'Aarav S.', grade: 'Class 10 • Delhi', text: 'Scored 95% in boards after 3 weeks on Dheeyudha. The duels are addictive!', stars: 5 },
  { name: 'Priya M.', grade: 'Class 10 • Mumbai', text: 'Finally a study app that feels like a game. My SST chapter scores doubled.', stars: 5 },
  { name: 'Rohan K.', grade: 'Class 10 • Bangalore', text: 'The AI Gauntlet pushed me harder than my coaching class ever did.', stars: 5 },
];

// ── Floating card animation ───────────────────────────────────────────────────
const float = {
  animate: { y: [0, -8, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
};
const floatDelay = (d: number) => ({
  animate: { y: [0, -8, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: d } }
});

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const students = useCounter(12400, 1800, statsVisible);
  const questions = useCounter(1200, 1600, statsVisible);
  const duels = useCounter(8900, 2000, statsVisible);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-white font-sans overflow-x-hidden selection:bg-violet-500/30">

      {/* ── Ambient glows ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-rose-600/10 rounded-full blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 flex items-center justify-between px-5 sm:px-10 py-5 max-w-7xl mx-auto">
        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Dheeyudha
        </span>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">About</Link>
          <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Sign In</Link>
          <Link href="/signup" className="text-sm font-black px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 active:scale-95">
            Join Free →
          </Link>
        </div>
        <button className="md:hidden p-2 text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-4 right-4 mt-2 bg-[#13131a] border border-white/10 rounded-2xl p-3 flex flex-col gap-1 shadow-2xl z-[60]">
              <Link href="/about" className="px-4 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/5">About</Link>
              <Link href="/login" className="px-4 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/5">Sign In</Link>
              <Link href="/signup" className="mt-1 px-4 py-3.5 rounded-xl text-sm font-black text-center bg-gradient-to-r from-violet-600 to-indigo-600">Join Free →</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 pt-12 pb-20 sm:pt-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Left copy */}
          <motion.div className="flex-1 text-center lg:text-left" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-black mb-6 tracking-wide">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> #1 Exam Prep Platform for Class 10
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Study Less.<br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Score More.
              </span><br />
              Beat Everyone.
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Dheeyudha turns boring revision into addictive duels, streaks, and AI-powered quizzes — so you actually <span className="text-white font-semibold">want</span> to study every day.
            </p>

            {/* Subject pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
              {SUBJECTS.map(s => (
                <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${s.color} text-white text-xs font-black shadow-md`}>
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/signup" className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-500/30 transition-all hover:-translate-y-1 active:scale-95">
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-base bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                I have an account
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500 font-medium">✓ Free forever &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Works on phone</p>
          </motion.div>

          {/* Right — floating UI mockup */}
          <motion.div className="flex-1 relative w-full max-w-sm mx-auto lg:max-w-none"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>

            {/* Main card */}
            <motion.div {...float} className="relative bg-[#13131a] border border-white/10 rounded-3xl p-5 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm font-black">A</div>
                <div>
                  <p className="text-sm font-black text-white">Aarav Sharma</p>
                  <p className="text-xs text-slate-500">Class 10 · Delhi</p>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-orange-500/15 px-2.5 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-black text-orange-400">21</span>
                </div>
              </div>

              <div className="bg-[#0a0a0f] rounded-2xl p-4 mb-3 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">🔬 Science</span>
                  <span className="text-xs text-slate-500 ml-auto">60s</span>
                </div>
                <p className="text-sm font-semibold text-white mb-3">The functional unit of the kidney is called the:</p>
                <div className="grid grid-cols-2 gap-2">
  {['Neuron', 'Nephron', 'Alveolus', 'Villus'].map((opt, i) => (
    <div key={opt} className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${i === 1 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/5 text-slate-400'}`}>
      {opt}
    </div>
  ))}
</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-black">+3 pts earned</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-xs font-black">Rank #142</span>
                </div>
              </div>
            </motion.div>

            {/* Floating duel card */}
            <motion.div {...floatDelay(0.8)} className="absolute -bottom-6 -left-4 sm:-left-8 bg-[#13131a] border border-rose-500/20 rounded-2xl p-3.5 shadow-xl shadow-black/50 w-44">
              <div className="flex items-center gap-2 mb-2">
                <Swords className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black text-rose-400">1v1 Duel</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">You</span>
                <span className="text-[10px] font-black text-slate-500">VS</span>
                <span className="text-xs font-bold text-white">Priya M.</span>
              </div>
              <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">3 questions left · 45s</p>
            </motion.div>

            {/* Floating XP card */}
            <motion.div {...floatDelay(1.5)} className="absolute -top-5 -right-4 sm:-right-8 bg-[#13131a] border border-amber-500/20 rounded-2xl p-3.5 shadow-xl shadow-black/50 w-36">
              <Trophy className="w-5 h-5 text-amber-400 mb-1" />
              <p className="text-xs font-black text-white">Rank Up! 🎉</p>
              <p className="text-[10px] text-slate-400 mt-0.5">#142 → <span className="text-amber-400 font-black">#138</span></p>
              <p className="text-[10px] text-amber-400 font-black">+12 XP this week</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-16">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 bg-[#13131a] border border-white/8 rounded-3xl p-6 sm:p-10">
          {[
            { value: students, suffix: '+', label: 'Active Students', icon: Users, color: 'text-violet-400' },
            { value: questions, suffix: '+', label: 'Curated Questions', icon: BookOpen, color: 'text-cyan-400' },
            { value: duels, suffix: '+', label: 'Duels Fought', icon: Swords, color: 'text-rose-400' },
          ].map(({ value, suffix, label, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} mb-2 sm:mb-3`} />
              <span className={`text-2xl sm:text-4xl font-black ${color}`}>{value.toLocaleString()}{suffix}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-black mb-3">Everything you need to <span className="text-violet-400">top your class</span></h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">Built specifically for Indian Class 10 students — covering CBSE boards across all 5 subjects.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, label, desc, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="group bg-[#13131a] border border-white/8 rounded-2xl p-6 hover:border-white/15 hover:-translate-y-1 transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-black text-white mb-1.5">{label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-black mb-3">How it works</h2>
          <p className="text-slate-400 text-sm sm:text-base">From zero to top rank in 3 simple steps</p>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Sign Up Free', desc: 'Create your account in 30 seconds — no credit card, no hassle.', color: 'from-violet-500 to-indigo-500' },
            { step: '02', title: 'Answer & Earn', desc: 'Solve MCQs from your subjects, earn XP, and track your weak spots.', color: 'from-cyan-500 to-blue-500' },
            { step: '03', title: 'Duel & Dominate', desc: 'Challenge friends, climb the leaderboard, and prove you\'re #1.', color: 'from-rose-500 to-pink-500' },
          ].map(({ step, title, desc, color }, i) => (
            <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative bg-[#13131a] border border-white/8 rounded-2xl p-6 overflow-hidden">
              <div className={`absolute top-4 right-4 text-5xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent opacity-20`}>{step}</div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg font-black text-white mb-4 shadow-lg`}>{i + 1}</div>
              <h3 className="font-black text-white text-lg mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-2xl sm:text-4xl font-black mb-3">Students love it ❤️</h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map(({ name, grade, text, stars }, i) => (
            <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-[#13131a] border border-white/8 rounded-2xl p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: stars }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">"{text}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-black">{name[0]}</div>
                <div>
                  <p className="text-xs font-black text-white">{name}</p>
                  <p className="text-[10px] text-slate-500">{grade}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="relative bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-600/10 to-transparent" />
          <Zap className="w-10 h-10 text-violet-400 mx-auto mb-4 relative z-10" />
          <h2 className="text-2xl sm:text-4xl font-black mb-4 relative z-10">Ready to top your class?</h2>
          <p className="text-slate-400 text-sm sm:text-lg mb-8 max-w-lg mx-auto relative z-10">Join 12,000+ students already practising on Dheeyudha. Free forever — start in seconds.</p>
          <Link href="/signup"
            className="relative z-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-500/30 transition-all hover:-translate-y-1 active:scale-95">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs text-slate-500 relative z-10">No credit card required · Takes 30 seconds</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 max-w-7xl mx-auto px-5 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-lg font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Dheeyudha</span>
        <div className="flex gap-5">
          <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy</Link>
          <Link href="/about" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">About</Link>
          <Link href="/contact" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Contact</Link>
        </div>
        <p className="text-xs text-slate-600">© 2025 Dheeyudha. Made in India 🇮🇳</p>
      </footer>
    </div>
  );
}
