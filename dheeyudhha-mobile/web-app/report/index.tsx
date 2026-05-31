import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Trophy, Target, TrendingUp, TrendingDown, Calendar,
    AlertTriangle, ArrowLeft, Share2, Minus,
    ChevronUp, ChevronDown, BookOpen, User, Users, ExternalLink
} from 'lucide-react-native';
import { useRouter } from '@/lib/next-navigation';
import ShareReportSheet from '@/components/ShareReportSheet';

/* ── Paired bar chart (CSS only) ──────────────────────────────── */
function BarChart({ current, previous }: {
    current: { label: string; total: number }[];
    previous: { label: string; total: number }[];
}) {
    const maxVal = Math.max(1, ...current.map(d => d.total), ...previous.map(d => d.total));
    return (
        <View className="w-full">
            <View className="flex items-end justify-between gap-1 flex-row">
                {current.map((day, i) => {
                    const prevDay = previous[i];
                    const curH = Math.max(4, (day.total / maxVal) * 90);
                    const preH = Math.max(4, (prevDay.total / maxVal) * 90);
                    return (
                        <View key={day.label} className="flex-1 flex flex-col items-center gap-1">
                            <View className="w-full flex items-end justify-center gap-[2px] flex-row" style={{ height: 90 }}>
                                <View className="flex-1 rounded-t-[4px] bg-slate-300 dark:bg-slate-700 flex-row" style={{ height: `${preH}%`, transition: 'height .8s ease' }} />
                                <View
                                    className="flex-1 rounded-t-[4px] bg-indigo-500 flex-row"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${curH}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                />
                            </View>
                            <Text className="text-[9px] font-bold text-slate-400 uppercase">{day.label}</Text>
                        </View>
                    );
                })}
            </View>
            <View className="flex gap-4 mt-3 flex-row">
                <Text className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold flex-row">
                    <Text className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> This week
                </Text>
                <Text className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold flex-row">
                    <Text className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700 inline-block" /> Last week
                </Text>
            </View>
        </View>
    );
}

/* ── Animated SVG score ring ───────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
    const r = 52, circ = 2 * Math.PI * r;
    const offset = circ - (circ * Math.min(score, 100)) / 100;
    const strokeMap: Record<string, string> = {
        purple: '#a855f7', green: '#22c55e', blue: '#6366f1', orange: '#f97316', red: '#ef4444', slate: '#64748b'
    };
    const stroke = strokeMap[color] ?? '#6366f1';
    return (
        <View className="relative w-28 h-28 shrink-0">
            <Check className="w-5 h-5 text-gray-500" />
            <View className="absolute inset-0 flex flex-col items-center justify-center">
                <Text className="text-2xl font-black text-slate-900 dark:text-white">{score}</Text>
                <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400">/100</Text>
            </View>
        </View>
    );
}

/* ── Delta chip ────────────────────────────────────────────────── */
function Delta({ cur, prev, unit = '' }: { cur: number; prev: number; unit?: string }) {
    const diff = cur - prev;
    if (!prev) return null;
    if (diff === 0) return <Text className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 flex-row"><Minus className="w-3 h-3" /> Same as last week</Text>;
    const up = diff > 0;
    return (
        <Text className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
            {up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(diff)}{unit} vs last week
        </Text>
    );
}

/* ── Mini stat tile ────────────────────────────────────────────── */
function Tile({ icon: Icon, iconBg, label, value, unit, cur, prev }: any) {
    return (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
            <View className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className="w-4 h-4" />
            </View>
            <Text className="text-xl font-black text-slate-900 dark:text-white">{value}{unit}</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{label}</Text>
            <Delta cur={cur} prev={prev} unit={unit} />
        </View>
    );
}

/* ── Subject bar ────────────────────────────────────────────────── */
const SUBJECT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
const SUBJECT_BADGE = ['bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'];

const RATING_GRADIENT: Record<string, string> = {
    purple: 'from-purple-500 to-fuchsia-600', green: 'from-emerald-400 to-green-600',
    blue: 'from-indigo-400 to-blue-600', orange: 'from-orange-400 to-amber-600',
    red: 'from-red-500 to-rose-600', slate: 'from-slate-400 to-slate-600',
};

export default function WeeklyReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [shareSheetOpen, setShareSheetOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) { if (mounted) setLoading(false); return; }
            fetch('/api/report', { headers: { Authorization: `Bearer ${session.access_token}` } })
                .then(r => r.json())
                .then(data => { if (mounted) { setReport(data); setLoading(false); } });
        });
        return () => { mounted = false; };
    }, []);

    if (loading) return (
        <View className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center pt-20 flex-row">
            <View className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </View>
    );

    if (!report?.rating || report.rating.label === 'Not Rated') return (
        <View className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center pt-20">
            <AlertTriangle className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-5" />
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Data Yet</Text>
            <Text className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">Solve some questions this week to unlock your Report Card.</Text>
            <View onPress={() => router.push('/feed')} className="bg-indigo-600 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20">Start Solving →</View>
        </View>
    );

    const { stats, prevStats, rating } = report;
    const gradient = RATING_GRADIENT[rating.color] ?? RATING_GRADIENT.slate;

    const handleNativeShare = async () => {
        setShareMenuOpen(false);
        const text = `My Dheeyudha Weekly Report: ${rating.label}! Score: ${stats.score}/100 • Accuracy: ${stats.accuracy}% • Favourite Subject: ${stats.subjects?.[0]?.name ?? '—'}. Can you beat me? 🔥`;
        try { if (navigator.share) { await navigator.share({ title: 'My Report Card', text }); return; } await navigator.clipboard.writeText(text); alert('Copied to clipboard!'); } catch { }
    };

    return (
        <View className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">

            {/* App bar */}
            <View className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 px-4 py-3 flex-row">
                <View onPress={() => router.back()} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform flex-row">
                    <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-white" />
                </View>
                <Text className="font-black text-base text-slate-900 dark:text-white flex-1 flex-row">Weekly Report Card</Text>
                <View className="relative">
                    <View
                        onPress={() => setShareMenuOpen(v => !v)}
                        className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center active:scale-90 transition-transform flex-row"
                    >
                        <Share2 className="w-4 h-4 text-white" />
                    </View>
                    <>
                        {shareMenuOpen && (
                            <>
                                <View className="fixed inset-0 z-40" onPress={() => setShareMenuOpen(false)} />
                                <View
                                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-11 z-50 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                                >
                                    <View
                                        onPress={() => { setShareMenuOpen(false); setShareSheetOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left flex-row"
                                    >
                                        <View className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-row">
                                            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </View>
                                        <View>
                                            <Text className="text-sm font-black text-slate-800 dark:text-white">Post to Community</Text>
                                            <Text className="text-[10px] text-slate-400 font-medium">Share in your feed</Text>
                                        </View>
                                    </View>
                                    <View className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />
                                    <View
                                        onPress={handleNativeShare}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left flex-row"
                                    >
                                        <View className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-row">
                                            <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                        </View>
                                        <View>
                                            <Text className="text-sm font-black text-slate-800 dark:text-white">Share / Copy</Text>
                                            <Text className="text-[10px] text-slate-400 font-medium">WhatsApp, copy link…</Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </>
                </View>
            </View>

            <View className="px-4 pt-4 max-w-lg mx-auto space-y-4">

                {/* ── Hero ── */}
                <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <View className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl pointer-events-none`} />
                    <View className="flex items-center justify-between gap-4 flex-row">
                        <View className="flex-1 min-w-0 flex-row">
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Rating</Text>
                            <Text className={`text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>{rating.label}</Text>
                            <Text className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{rating.message}</Text>
                            {prevStats.score > 0 && (
                                <View className={`mt-3 flex items-center gap-1.5 text-sm font-bold ${stats.score >= prevStats.score ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {stats.score >= prevStats.score ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {stats.score >= prevStats.score ? '+' : ''}{stats.score - prevStats.score} pts vs last week
                                </View>
                            )}
                        </View>
                        <ScoreRing score={stats.score} color={rating.color} />
                    </View>
                </View>

                {/* ── Stat tiles ── */}
                <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}
                    className="grid grid-cols-3 gap-3">
                    <Tile icon={Target} iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" label="Attempted" value={stats.totalAttempts} unit="" cur={stats.totalAttempts} prev={prevStats.totalAttempts} />
                    <Tile icon={Trophy} iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" label="Accuracy" value={stats.accuracy} unit="%" cur={stats.accuracy} prev={prevStats.accuracy} />
                    <Tile icon={Calendar} iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" label="Active Days" value={stats.activeDays} unit="" cur={stats.activeDays} prev={prevStats.activeDays} />
                </View>

                {/* ── Daily bar chart ── */}
                <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.16 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Text className="font-black text-slate-900 dark:text-white text-sm mb-0.5">Questions Per Day</Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">This week vs last week</Text>
                    <BarChart current={stats.daily} previous={prevStats.daily} />
                </View>

                {/* ── Accuracy comparison ── */}
                <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.22 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Text className="font-black text-slate-900 dark:text-white text-sm mb-4">Accuracy Comparison</Text>
                    {[{ label: 'This Week', value: stats.accuracy, color: '#6366f1', delay: 0.4 },
                      { label: 'Last Week', value: prevStats.accuracy, color: '#94a3b8', delay: 0.55 }].map(({ label, value, color, delay }) => (
                        <View key={label} className="mb-4 last:mb-0">
                            <View className="flex justify-between mb-1.5 flex-row">
                                <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold">{label}</Text>
                                <Text className="text-xs text-slate-900 dark:text-white font-black">{value}%</Text>
                            </View>
                            <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <View className="h-full rounded-full" style={{ background: color }}
                                    initial={{ width: 0 }} animate={{ width: `${value}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay }} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Answer breakdown ── */}
                <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Text className="font-black text-slate-900 dark:text-white text-sm mb-4">Answer Breakdown</Text>
                    <View className="flex gap-3 flex-row">
                        <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 text-center flex-row">
                            <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.correctAttempts}</Text>
                            <Text className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">Correct</Text>
                            <Delta cur={stats.correctAttempts} prev={prevStats.correctAttempts} />
                        </View>
                        <View className="flex-1 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-4 text-center flex-row">
                            <Text className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.totalAttempts - stats.correctAttempts}</Text>
                            <Text className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1">Wrong</Text>
                            <Delta cur={stats.totalAttempts - stats.correctAttempts} prev={prevStats.totalAttempts - prevStats.correctAttempts} />
                        </View>
                    </View>
                </View>

                {/* ── Favourite Subjects ── */}
                {stats.subjects?.length > 0 && (
                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.34 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <View className="flex items-center gap-2 mb-4 flex-row">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <Text className="font-black text-slate-900 dark:text-white text-sm">Your Subjects This Week</Text>
                        </View>
                        <View className="space-y-3">
                            {stats.subjects.map((s: any, i: number) => (
                                <View key={s.name}>
                                    <View className="flex items-center justify-between mb-1 flex-row">
                                        <View className="flex items-center gap-2 flex-row">
                                            {i === 0 && <Text className="text-base">🏆</Text>}
                                            <Text className={`text-[11px] font-black px-2 py-0.5 rounded-full ${SUBJECT_BADGE[i] ?? SUBJECT_BADGE[4]}`}>{s.name}</Text>
                                        </View>
                                        <View className="flex items-center gap-2 text-[11px] text-slate-500 font-bold flex-row">
                                            <Text>{s.total} Q</Text>
                                            <Text className="text-emerald-500 font-black">{s.accuracy}%</Text>
                                        </View>
                                    </View>
                                    <View className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <View className={`h-full rounded-full ${SUBJECT_COLORS[i] ?? 'bg-indigo-500'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(s.total / stats.totalAttempts) * 100}%` }}
                                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 + i * 0.1 }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Top Teachers ── */}
                {stats.teachers?.length > 0 && (
                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <View className="flex items-center gap-2 mb-4 flex-row">
                            <User className="w-4 h-4 text-violet-500" />
                            <Text className="font-black text-slate-900 dark:text-white text-sm">Teachers You Solved From</Text>
                        </View>
                        <View className="space-y-3">
                            {stats.teachers.map((t: any, i: number) => (
                                <View key={t.id} className="flex items-center gap-3 flex-row">
                                    <View className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0 flex-row">
                                        {t.name[0]?.toUpperCase()}
                                    </View>
                                    <View className="flex-1 min-w-0 flex-row">
                                        <Text className="text-sm font-black text-slate-900 dark:text-white truncate">{t.name}</Text>
                                        <Text className="text-[10px] text-slate-400 font-bold">{t.total} questions • {t.accuracy}% accuracy</Text>
                                    </View>
                                    {i === 0 && (
                                        <Text className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 shrink-0">Favourite</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── CTA ── */}
                <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    onPress={() => router.push('/feed')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
                    Keep Solving →
                </View>

            </View>

            {/* Share to Community sheet */}
            {report && (
                <ShareReportSheet
                    isOpen={shareSheetOpen}
                    onClose={() => setShareSheetOpen(false)}
                    report={report}
                />
            )}

        </View>
    );
}
