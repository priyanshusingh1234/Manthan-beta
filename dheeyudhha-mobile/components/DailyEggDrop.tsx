import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { X, Zap } from 'lucide-react-native';


async function safeHaptic(style?: ImpactStyle) {
    try {
        if (style) await .catch(() => {});
        else await .catch(() => {});
    } catch (_) {}
}

export default function DailyEggDrop() {
    const [isEligible, setIsEligible] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'flying' | 'landed' | 'cracking' | 'question' | 'done'>('idle');
    const [question, setQuestion] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<'won' | 'lost' | null>(null);

    useEffect(() => {
        const checkEligibility = async () => {
            const now = new Date();
            const hour = now.getHours();
            if (hour < 18) return;
            const dateStr = now.toISOString().split('T')[0];
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata?.last_egg_claim_date !== dateStr) {
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

        // Fetch user class first
        const { data: { user } } = await supabase.auth.getUser();
        let userClass = null;
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('class').eq('id', user.id).single();
            if (profile) userClass = profile.class;
        }

        // Fetch question based on class while crack animation plays
        let query = supabase.from('questions').select('id');
        if (userClass) {
            query = query.eq('class_grade', userClass); // Fixed 'class' to 'class_grade' which is the actual column name based on feed/route.ts
        }
        
        let { data: idsData } = await query.limit(500);
        
        // Fallback if no questions for user's class
        if (!idsData || idsData.length === 0) {
            const fallback = await supabase.from('questions').select('id').limit(500);
            idsData = fallback.data;
        }

        if (idsData && idsData.length > 0) {
            const randomId = idsData[Math.floor(Math.random() * idsData.length)].id;
            const { data: qData } = await supabase.from('questions').select('*').eq('id', randomId).single();
            setQuestion(qData);
        }

        setTimeout(() => setPhase('question'), 600);
    };

    const submitAnswer = async (index: number) => {
        if (!question || selectedOption !== null) return;
        setSelectedOption(index);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        try {
            const res = await fetch('/api/daily-egg/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ questionId: question.id, selectedOptionIndex: index })
            });
            
            if (res.ok) {
                const json = await res.json();
                setResult(json.isCorrect ? 'won' : 'lost');
                await safeHaptic(json.isCorrect ? ImpactStyle.Medium : ImpactStyle.Light);
                
                setTimeout(() => {
                    dismiss();
                    toast(json.isCorrect ? `🥚 +${json.ptsAwarded} pts from the Daily Egg!` : `💀 ${json.ptsAwarded} pt from the Daily Egg.`, {
                        style: { fontWeight: 700 }
                    });
                }, 2500);
            } else {
                setResult('lost');
                setTimeout(() => dismiss(), 2000);
            }
        } catch (e) {
            setResult('lost');
            setTimeout(() => dismiss(), 2000);
        }
    };

    const dismiss = () => {
        setPhase('done');
        setIsEligible(false);
    };

    if (!isEligible && phase === 'idle') return null;
    if (phase === 'done') return null;

    return (
        <>
            {/* ── Flying man + egg layer ── */}
            <>
                {(phase === 'flying' || phase === 'landed') && (
                    <View className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">

                        {/* Hero: flies from left to right at top area */}
                        <View
                            key="hero"
                            initial={{ x: '-15vw', y: '10vh' }}
                            animate={{ x: '115vw', y: '10vh' }}
                            transition={{ duration: 3.2, ease: [0.25, 0.1, 0.25, 1] }}
                            onAnimationComplete={() => setPhase('landed')}
                            style={{ position: 'absolute', fontSize: 52, lineHeight: 1 }}
                        >
                            🦸‍♂️
                        </View>

                        {/* Shadow streak behind hero */}
                        <View
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
                        <View
                            key="egg"
                            initial={{ x: '50vw', y: '-5vh', scale: 0, rotate: -20 }}
                            animate={phase === 'landed'
                                ? { x: '50vw', y: '72vh', scale: 1, rotate: 0 }
                                : { x: '50vw', y: '-5vh', scale: 0, rotate: -20 }
                            }
                            transition={{ delay: 1.5, duration: 0.9, type: 'spring', stiffness: 200, damping: 14 }}
                            style={{ position: 'absolute', translateX: '-50%', pointerEvents: 'auto' }}
                            onPress={handleEggTap}
                            whileTap={{ scale: 0.88 }}
                        >
                            {/* Pulse glow ring */}
                            <View
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.0, 0.5] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute', inset: -12, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,215,0,0.6), transparent 70%)',
                                    zIndex: -1,
                                }}
                            />
                            <View style={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.9))' }}>
                                🥚
                            </View>
                            {/* Tap hint badge — visible 1s after landing */}
                            <View
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
                            </View>
                        </View>
                    </View>
                )}
            </>

            {/* ── Crack flash ── */}
            <>
                {phase === 'cracking' && (
                    <View
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
            </>

            {/* ── Question sheet ── */}
            <>
                {phase === 'question' && (
                    <View className="fixed inset-0 z-[80] flex items-end justify-center flex-row"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
                    >
                        <View
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-28 shadow-2xl"
                            style={{ maxHeight: '88vh', overflowY: 'auto' }}
                        >
                            {/* Handle bar */}
                            <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

                            {/* Header */}
                            <View className="flex items-center justify-between mb-5 flex-row">
                                <View className="flex items-center gap-3 flex-row">
                                    <Text style={{ fontSize: 32 }}>🥚</Text>
                                    <View>
                                        <Text className="font-black text-lg text-slate-900 dark:text-white leading-tight">Daily Egg</Text>
                                        <Text className="text-xs font-bold" style={{ color: '#10b981' }}>
                                            +5 correct &nbsp;•&nbsp; <Text style={{ color: '#ef4444' }}>-1 wrong</Text>
                                        </Text>
                                    </View>
                                </View>
                                <View
                                    onPress={dismiss}
                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 active:scale-95 transition-transform flex-row"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </View>
                            </View>

                            {!question ? (
                                <View className="py-16 flex flex-col items-center gap-3 text-yellow-500">
                                    <View animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                                        <Zap className="w-8 h-8" />
                                    </View>
                                    <Text className="text-sm font-bold text-slate-400">Loading question…</Text>
                                </View>
                            ) : (
                                <View className="space-y-5">
                                    <View>
                                        <Text className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                            {question.title}
                                        </Text>
                                        {question.body && (
                                            <Text className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {question.body}
                                            </Text>
                                        )}
                                    </View>

                                    <View className="space-y-2.5">
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
                                                <View
                                                    key={idx}
                                                    disabled={revealed}
                                                    onPress={() => submitAnswer(idx)}
                                                    whileTap={{ scale: 0.97 }}
                                                    className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${bg} ${txt}`}
                                                >
                                                    <Text className="mr-2 font-black text-slate-400 dark:text-slate-500">
                                                        {String.fromCharCode(65 + idx)}.
                                                    </Text>
                                                    {opt}
                                                </View>
                                            );
                                        })}
                                    </View>

                                    <>
                                        {result && (
                                            <View
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                                className={`p-4 rounded-2xl text-center font-black text-sm ${result === 'won'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                }`}
                                            >
                                                <View className="mb-2">{result === 'won' ? '🎉 Correct! +5 pts added.' : '💀 Wrong! -1 pt deducted.'}</View>
                                                {question.explanation && (
                                                    <View className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-xs font-medium text-left">
                                                        <Text className="font-black uppercase tracking-wider text-[10px] opacity-70 block mb-1">Explanation</Text>
                                                        <Text className="opacity-90">{question.explanation}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </>
        </>
    );
}
