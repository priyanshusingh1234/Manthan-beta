'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { X, Zap } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

async function safeHaptic(style?: ImpactStyle) {
    try {
        if (style) await Haptics.impact({ style }).catch(() => {});
        else await Haptics.vibrate({ duration: 40 }).catch(() => {});
    } catch (_) {}
}

export default function DailyEggDrop() {
    const [isEligible, setIsEligible] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'flying' | 'landed' | 'cracking' | 'question' | 'done'>('idle');
    const [question, setQuestion] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<'won' | 'lost' | null>(null);

    useEffect(() => {
        const checkEligibility = () => {
            const now = new Date();
            const hour = now.getHours();
            const dateStr = now.toISOString().split('T')[0];
            if (hour >= 18 && !localStorage.getItem(`daily_egg_claimed_${dateStr}`)) {
                setIsEligible(true);
            }
        };
        checkEligibility();
        const interval = setInterval(checkEligibility, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isEligible || phase !== 'idle') return;
        // Wait 3s then start the fly-in
        const t = setTimeout(async () => {
            setPhase('flying');
            await safeHaptic(ImpactStyle.Light);
        }, 3000);
        return () => clearTimeout(t);
    }, [isEligible, phase]);

    const handleEggTap = async () => {
        if (phase !== 'landed') return;
        setPhase('cracking');
        await safeHaptic(ImpactStyle.Heavy);

        // Fetch question while crack animation plays
        const { data } = await supabase.from('questions').select('*').limit(100);
        if (data && data.length > 0) {
            setQuestion(data[Math.floor(Math.random() * data.length)]);
        }

        setTimeout(() => setPhase('question'), 600);
    };

    const submitAnswer = async (index: number) => {
        if (!question || selectedOption !== null) return;
        setSelectedOption(index);
        const isCorrect = index === question.correct_option;
        setResult(isCorrect ? 'won' : 'lost');

        await safeHaptic(isCorrect ? ImpactStyle.Medium : ImpactStyle.Light);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const pts = isCorrect ? 5 : -1;
            const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', user.id).single();
            if (profile) {
                await supabase.from('profiles')
                    .update({ total_points: Math.max(0, profile.total_points + pts) })
                    .eq('id', user.id);
            }
        }

        setTimeout(() => {
            dismiss();
            toast(isCorrect ? '🥚 +5 pts from the Daily Egg!' : '💀 -1 pt from the Daily Egg.', {
                style: { fontWeight: 700 }
            });
        }, 2500);
    };

    const dismiss = () => {
        const dateStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(`daily_egg_claimed_${dateStr}`, 'true');
        setPhase('done');
        setIsEligible(false);
    };

    if (!isEligible && phase === 'idle') return null;
    if (phase === 'done') return null;

    return (
        <>
            {/* ── Flying man + egg layer ── */}
            <AnimatePresence>
                {(phase === 'flying' || phase === 'landed') && (
                    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">

                        {/* Hero: flies from left to right at top area */}
                        <motion.div
                            key="hero"
                            initial={{ x: '-15vw', y: '10vh' }}
                            animate={{ x: '115vw', y: '10vh' }}
                            transition={{ duration: 3.2, ease: [0.25, 0.1, 0.25, 1] }}
                            onAnimationComplete={() => setPhase('landed')}
                            style={{ position: 'absolute', fontSize: 52, lineHeight: 1 }}
                        >
                            🦸‍♂️
                        </motion.div>

                        {/* Shadow streak behind hero */}
                        <motion.div
                            key="streak"
                            initial={{ x: '-25vw', y: '10vh', opacity: 0.6, scaleX: 0.5 }}
                            animate={{ x: '105vw', y: '10vh', opacity: 0, scaleX: 3 }}
                            transition={{ duration: 3.2, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{
                                position: 'absolute',
                                width: 80, height: 20,
                                borderRadius: 40,
                                background: 'radial-gradient(ellipse, rgba(255,220,0,0.5) 0%, transparent 70%)',
                                transformOrigin: 'left center',
                                marginTop: 16,
                            }}
                        />

                        {/* Egg: drops from ~10vh to 75vh, springs into place */}
                        <motion.div
                            key="egg"
                            initial={{ x: '50vw', y: '-5vh', scale: 0, rotate: -20 }}
                            animate={phase === 'landed'
                                ? { x: '50vw', y: '72vh', scale: 1, rotate: 0 }
                                : { x: '50vw', y: '-5vh', scale: 0, rotate: -20 }
                            }
                            transition={{ delay: 1.5, duration: 0.9, type: 'spring', stiffness: 200, damping: 14 }}
                            style={{ position: 'absolute', translateX: '-50%', pointerEvents: 'auto' }}
                            onClick={handleEggTap}
                            whileTap={{ scale: 0.88 }}
                        >
                            {/* Pulse glow ring */}
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.0, 0.5] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -12, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,215,0,0.6), transparent 70%)',
                                    zIndex: -1,
                                }}
                            />
                            <div style={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.9))' }}>
                                🥚
                            </div>
                            {/* Tap hint badge — visible 1s after landing */}
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                style={{
                                    position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)',
                                    background: 'rgba(0,0,0,0.75)', color: '#fff',
                                    fontSize: 12, fontWeight: 800, padding: '5px 12px',
                                    borderRadius: 20, whiteSpace: 'nowrap',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                👆 Tap me!
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Crack flash ── */}
            <AnimatePresence>
                {phase === 'cracking' && (
                    <motion.div
                        key="crack"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.85, 0] }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 70,
                            background: 'radial-gradient(ellipse at center, #fef08a 0%, #fbbf24 60%, transparent 100%)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Question sheet ── */}
            <AnimatePresence>
                {phase === 'question' && (
                    <div className="fixed inset-0 z-[80] flex items-end justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10 shadow-2xl"
                            style={{ maxHeight: '88vh', overflowY: 'auto' }}
                        >
                            {/* Handle bar */}
                            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <span style={{ fontSize: 32 }}>🥚</span>
                                    <div>
                                        <p className="font-black text-lg text-slate-900 dark:text-white leading-tight">Daily Egg</p>
                                        <p className="text-xs font-bold" style={{ color: '#10b981' }}>
                                            +5 correct &nbsp;•&nbsp; <span style={{ color: '#ef4444' }}>-1 wrong</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={dismiss}
                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 active:scale-95 transition-transform"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            {!question ? (
                                <div className="py-16 flex flex-col items-center gap-3 text-yellow-500">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                        <Zap className="w-8 h-8" />
                                    </motion.div>
                                    <p className="text-sm font-bold text-slate-400">Loading question…</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                        {question.title}
                                    </p>

                                    <div className="space-y-2.5">
                                        {question.options?.map((opt: string, idx: number) => {
                                            const isSelected = selectedOption === idx;
                                            const isCorrect = idx === question.correct_option;
                                            const revealed = result !== null;

                                            let bg = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                                            let txt = 'text-slate-700 dark:text-slate-300';
                                            if (revealed) {
                                                if (isCorrect) { bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400'; txt = 'text-emerald-800 dark:text-emerald-300'; }
                                                else if (isSelected) { bg = 'bg-red-50 dark:bg-red-900/30 border-red-400'; txt = 'text-red-700 dark:text-red-400'; }
                                                else { bg = 'opacity-40 border-slate-200 dark:border-slate-700'; }
                                            }

                                            return (
                                                <motion.button
                                                    key={idx}
                                                    disabled={revealed}
                                                    onClick={() => submitAnswer(idx)}
                                                    whileTap={{ scale: 0.97 }}
                                                    className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${bg} ${txt}`}
                                                >
                                                    <span className="mr-2 font-black text-slate-400 dark:text-slate-500">
                                                        {String.fromCharCode(65 + idx)}.
                                                    </span>
                                                    {opt}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    <AnimatePresence>
                                        {result && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                                className={`p-4 rounded-2xl text-center font-black text-sm ${result === 'won'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                }`}
                                            >
                                                {result === 'won' ? '🎉 Correct! +5 pts added.' : '💀 Wrong! -1 pt deducted.'}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
