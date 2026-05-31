import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    AlertTriangle, CheckCircle2, XCircle, Loader2, Eye, EyeOff,
    FileImage, BookOpen, Users, Clock, Shield, RefreshCw
} from 'lucide-react-native';
import { supabase } from "@/lib/supabaseClient";

type FlaggedItem = {
    id: string;
    question_id: string;
    student_id: string;
    submission_url: string | null;
    points_awarded: number;
    created_at: string;
    studentName: string;
    studentUsername: string | null;
    teacherSolutionUrl: string | null;
    checkerVotes: { checker_id: string; vote: string }[];
    questions: {
        id: string;
        title: string;
        body: string | null;
        points: number;
        subject: string | null;
        class_grade: string | null;
    };
};

export default function TeacherReviewPanel() {
    const [token, setToken] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [items, setItems] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [decidingId, setDecidingId] = useState<string | null>(null);
    const [decided, setDecided] = useState<Record<string, "correct" | "wrong">>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ── Auth ──────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            if (!session || !session.user.user_metadata?.isTeacher) return;
            setToken(session.access_token);
            setAuthChecked(true);
        });
        return () => { mounted = false; };
    }, []);

    // ── Fetch flagged submissions ──────────────────────────────────
    const fetchFlagged = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch("/api/teacher-review", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { setItems([]); return; }
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authChecked) fetchFlagged();
    }, [authChecked, fetchFlagged]);

    // ── Submit verdict ────────────────────────────────────────────
    const handleVerdict = async (submissionId: string, verdict: "correct" | "wrong") => {
        if (!token || decidingId) return;
        setDecidingId(submissionId);
        try {
            const res = await fetch("/api/teacher-review", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ submissionId, verdict }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || "Failed"); return; }
            setDecided(prev => ({ ...prev, [submissionId]: verdict }));
            setTimeout(() => setItems(prev => prev.filter(i => i.id !== submissionId)), 2000);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setDecidingId(null);
        }
    };

    if (!authChecked) return null;

    return (
        <View className="space-y-4">
            {/* Header */}
            <View className="flex items-center justify-between flex-row">
                <View className="flex items-center gap-3 flex-row">
                    <View className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center flex-row">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </View>
                    <View>
                        <Text className="text-lg font-black text-slate-800">Flagged Submissions</Text>
                        <Text className="text-xs text-slate-500">Peer-flagged answers awaiting your final verdict</Text>
                    </View>
                </View>
                <View
                    onPress={fetchFlagged}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex-row"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </View>
            </View>

            {/* Rules summary */}
            <View className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2 flex-row">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <Text>
                    <Text>Review rules:</Text> If wrong → student loses their earned points + 3 extra penalty.
                    Each checker who flagged correctly earns +2 points.
                    If correct → no changes, student keeps points.
                </Text>
            </View>

            {loading ? (
                <View className="flex items-center justify-center py-12 gap-3 text-slate-400 flex-row">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <Text className="text-sm">Loading flagged submissions...</Text>
                </View>
            ) : items.length === 0 ? (
                <View className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <Text className="text-slate-600 font-semibold text-sm">No flagged submissions right now.</Text>
                    <Text className="text-slate-400 text-xs mt-1">All caught up! Check back later.</Text>
                </View>
            ) : (
                <View className="space-y-4">
                    {items.map((item) => {
                        const isExpanded = expandedId === item.id;
                        const verdict = decided[item.id];
                        const wrongCount = item.checkerVotes.filter(v => v.vote === "wrong").length;

                        return (
                            <View
                                key={item.id}
                                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-opacity ${verdict ? "opacity-60" : ""}`}
                            >
                                <View className="p-5">
                                    {/* Question row */}
                                    <View className="flex items-start gap-3 mb-3 flex-row">
                                        <View className="flex-1 flex-row">
                                            <View className="flex items-center gap-2 mb-0.5 flex-wrap flex-row">
                                                {item.questions.subject && (
                                                    <Text className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{item.questions.subject}</Text>
                                                )}
                                                {item.questions.class_grade && (
                                                    <Text className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Class {item.questions.class_grade}</Text>
                                                )}
                                                <Text className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wider">flagged</Text>
                                            </View>
                                            <Text className="font-bold text-slate-800 text-sm leading-snug">{item.questions.title}</Text>
                                        </View>
                                        <View className="shrink-0 text-right">
                                            <View className="text-xs text-slate-500">Claimed</View>
                                            <View className="text-lg font-black text-violet-700">+{item.points_awarded}pts</View>
                                        </View>
                                    </View>

                                    {/* Student + votes info */}
                                    <View className="flex items-center gap-4 text-xs text-slate-500 mb-4 flex-row">
                                        <View className="flex items-center gap-1.5 flex-row">
                                            <Users className="w-3.5 h-3.5" />
                                            <Text className="font-semibold">{item.studentName}</Text>
                                        </View>
                                        <View className="flex items-center gap-1.5 flex-row">
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                            <Text>{wrongCount} peer{wrongCount !== 1 ? "s" : ""} flagged wrong</Text>
                                        </View>
                                        <View className="flex items-center gap-1.5 flex-row">
                                            <Clock className="w-3.5 h-3.5" />
                                            <Text>{new Date(item.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>

                                    {/* Toggle answers */}
                                    <View
                                        onPress={() => setExpandedId(isExpanded ? null : item.id)}
                                        className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors mb-4 flex-row"
                                    >
                                        {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {isExpanded ? "Hide" : "Compare"} Answers
                                    </View>

                                    {/* Side by side */}
                                    {isExpanded && (
                                        <View className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                                            <View>
                                                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 flex-row">
                                                    <FileImage className="w-3 h-3" /> Student&apos;s Answer
                                                </Text>
                                                {item.submission_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <Image src={item.submission_url} alt="Student" className="w-full max-h-60 object-contain rounded-lg bg-white border border-slate-200" />
                                                ) : (
                                                    <View className="h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs flex-row">No image</View>
                                                )}
                                            </View>
                                            <View>
                                                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 flex-row">
                                                    <BookOpen className="w-3 h-3" /> Your Model Answer
                                                </Text>
                                                {item.teacherSolutionUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <Image src={item.teacherSolutionUrl} alt="Model answer" className="w-full max-h-60 object-contain rounded-lg bg-white border border-violet-200" />
                                                ) : (
                                                    <View className="h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs flex-row">No model answer</View>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* Verdict buttons */}
                                    {verdict ? (
                                        <View className={`text-center py-2.5 rounded-xl text-sm font-bold ${verdict === "correct" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                            {verdict === "correct" ? <><CheckCircle2 className="w-4 h-4 inline mr-1" />Marked Correct</> : <><XCircle className="w-4 h-4 inline mr-1" />Confirmed Wrong</>}
                                        </View>
                                    ) : (
                                        <View className="grid grid-cols-2 gap-3">
                                            <View
                                                onPress={() => handleVerdict(item.id, "correct")}
                                                disabled={!!decidingId}
                                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 flex-row"
                                            >
                                                {decidingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Student is Right
                                            </View>
                                            <View
                                                onPress={() => handleVerdict(item.id, "wrong")}
                                                disabled={!!decidingId}
                                                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 flex-row"
                                            >
                                                {decidingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Confirm Wrong
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}
