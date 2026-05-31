import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from '@/lib/next-navigation';
import {
    Shield, CheckCircle2, Loader2, Zap,
    Users, AlertTriangle, FileImage, BookOpen, RefreshCw,
    ThumbsUp, ThumbsDown, Eye, Trophy
} from 'lucide-react-native';
import { supabase } from "@/lib/supabaseClient";

type CheckerItem = {
    id: string;
    question_id: string;
    student_id: string;
    submission_url: string | null;
    checker_deadline: string;
    studentFirstName: string;
    teacherSolutionUrl: string | null;
    wrongVotes: number;
    correctVotes: number;
    requiredToFlag: number;
    isCoopChallenge: boolean;
    questions: {
        id: string;
        title: string;
        body: string | null;
        points: number;
        subject: string | null;
        class_grade: string | null;
    };
};

export default function CheckerFeedPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);

    const [items, setItems] = useState<CheckerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<string | null>(null);
    const [myvotes, setMyVotes] = useState<Record<string, "correct" | "wrong">>({});
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    // ── Auth check ────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }
            if (mounted) {
                setToken(session.access_token);
                setIsTeacher(!!session.user.user_metadata?.isTeacher);
                setAuthChecked(true);
            }
        };
        init();
        return () => { mounted = false; };
    }, [router]);

    // ── Fetch checker feed ────────────────────────────────────────
    const fetchFeed = useCallback(async () => {
        if (!token || isTeacher) return;
        setLoading(true);
        try {
            const res = await fetch("/api/checker-vote", {
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
    }, [token, isTeacher]);

    useEffect(() => {
        if (authChecked && !isTeacher) fetchFeed();
    }, [authChecked, isTeacher, fetchFeed]);

    // ── Submit vote ───────────────────────────────────────────────
    const handleVote = async (submissionId: string, vote: "correct" | "wrong") => {
        if (!token || votingId) return;
        setVotingId(submissionId);
        try {
            const res = await fetch("/api/checker-vote", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ submissionId, vote }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || "Vote failed"); return; }
            setMyVotes(prev => ({ ...prev, [submissionId]: vote }));
            setTimeout(() => {
                setItems(prev => prev.filter(i => i.id !== submissionId));
            }, 1500);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setVotingId(null);
        }
    };

    // ── Loading ───────────────────────────────────────────────────
    if (!authChecked) {
        return (
            <View className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin" />
                <Text className="font-medium">Loading checker feed...</Text>
            </View>
        );
    }

    if (isTeacher) {
        return (
            <View className="min-h-screen flex items-center justify-center p-8 flex-row">
                <View className="text-center bg-background rounded-3xl p-12 border border-border shadow-sm">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <Text className="text-2xl font-black text-foreground">Checker Feed</Text>
                    <Text className="text-muted-foreground mt-2">Teachers don&apos;t participate in peer checking.</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="min-h-screen bg-background pb-24 pt-6 px-4">
            <View className="max-w-3xl mx-auto">

                {/* Header */}
                <View className="mb-8">
                    <View className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20 flex-row">
                        <Text className="relative flex h-2 w-2 flex-row">
                            <Text className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 flex-row" />
                            <Text className="relative inline-flex rounded-full h-2 w-2 bg-primary flex-row" />
                        </Text>
                        Live Checker Feed
                    </View>
                    <Text className="text-3xl font-black text-foreground mb-2">Peer Review Queue</Text>
                    <Text className="text-muted-foreground font-medium">
                        Review written answers submitted by your peers. Earn{" "}
                        <Text className="font-bold text-primary">+2 points</Text> for correctly identifying wrong answers.
                    </Text>

                    <View className="mt-4 flex items-center gap-3 flex-row">
                        <View
                            onPress={fetchFeed}
                            className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm flex-row"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </View>
                        <View className="flex items-center gap-2 text-sm text-muted-foreground flex-row">
                            <Users className="w-4 h-4" />
                            {items.length} submission{items.length !== 1 ? "s" : ""} waiting
                        </View>
                    </View>
                </View>

                {/* Reward info */}
                <View className="mb-6 p-4 bg-background border border-border rounded-2xl shadow-sm flex gap-3 flex-row">
                    <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <View className="text-sm text-foreground">
                        <Text className="font-bold mb-1">How checker rewards work:</Text>
                        <View className="text-muted-foreground space-y-0.5">
                            <View>• Vote <Text>&quot;Wrong&quot;</Text> → if 2 people flag it → AI verifies. If wrong, you earn <Text className="text-primary">+2 points</Text></View>
                            <View>• Vote <Text>&quot;Correct&quot;</Text> → if 2 people agree → student is approved and you earn <Text className="text-emerald-600">+1 point</Text>.</View>
                            <View>• Spamming <Text>&quot;Wrong&quot;</Text> on good answers → <Text>-1 point penalty</Text>.</View>
                        </View>
                    </View>
                </View>

                {/* Feed */}
                {loading ? (
                    <View className="flex flex-col items-center py-20 gap-4 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <Text>Loading peer submissions...</Text>
                    </View>
                ) : items.length === 0 ? (
                    <View className="text-center bg-background rounded-3xl p-16 border border-border shadow-sm">
                        <View className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 flex-row">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </View>
                        <Text className="text-xl font-black text-foreground mb-2">All Caught Up!</Text>
                        <Text className="text-muted-foreground max-w-xs mx-auto">No written answers waiting for peer review right now.</Text>
                        <View onPress={fetchFeed} className="mt-6 px-6 py-2.5 bg-muted rounded-xl text-foreground font-semibold text-sm hover:bg-accent transition-colors">
                            Refresh Feed
                        </View>
                    </View>
                ) : (
                    <View className="space-y-5">
                        {items.map((item) => {
                            const voted = myvotes[item.id];
                            const isExpanded = expandedItem === item.id;

                            return (
                                <View
                                    key={item.id}
                                    className={`bg-background rounded-3xl border shadow-sm transition-all duration-200 overflow-hidden ${voted ? "opacity-60 scale-[0.99]" : "hover:shadow-md"}`}
                                >
                                    <View className="p-5 sm:p-6">

                                        {/* Co-op banner */}
                                        {item.isCoopChallenge && (
                                            <View className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 mb-4 text-xs font-bold text-primary flex-row">
                                                <Users className="w-3.5 h-3.5" />
                                                Co-op Challenge — points are split between two players if correct
                                            </View>
                                        )}

                                        {/* Title row */}
                                        <View className="flex items-start justify-between gap-4 mb-4 flex-row">
                                            <View className="flex-1 flex-row">
                                                <View className="flex items-center gap-2 mb-1 flex-wrap flex-row">
                                                    {item.questions.subject && (
                                                        <Text className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">{item.questions.subject}</Text>
                                                    )}
                                                    {item.questions.class_grade && (
                                                        <Text className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">Class {item.questions.class_grade}</Text>
                                                    )}
                                                </View>
                                                <Text className="text-lg font-bold text-foreground leading-snug">{item.questions.title}</Text>
                                                {item.questions.body && (
                                                    <Text className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.questions.body}</Text>
                                                )}
                                            </View>
                                            <View className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex-row">
                                                <Zap className="w-3 h-3 fill-amber-500" />
                                                {item.questions.points} pts
                                            </View>
                                        </View>

                                        {/* Stats row */}
                                        <View className="flex items-center gap-3 mb-4 flex-wrap flex-row">
                                            <View className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full font-medium flex-row">
                                                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                                {item.wrongVotes}/{item.requiredToFlag} wrong flags for AI check
                                            </View>
                                            <View className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium flex-row">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                {item.correctVotes ?? 0}/{item.requiredToFlag} correct votes to approve
                                            </View>
                                            <View className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto flex-row">
                                                <Users className="w-3.5 h-3.5" />
                                                by {item.studentFirstName}
                                            </View>
                                        </View>

                                        {/* Show answers toggle */}
                                        <View
                                            onPress={() => setExpandedItem(isExpanded ? null : item.id)}
                                            className="flex items-center gap-2 text-sm text-primary font-semibold hover:text-primary/80 transition-colors mb-4 flex-row"
                                        >
                                            <Eye className="w-4 h-4" />
                                            {isExpanded ? "Hide" : "View"} Answers
                                        </View>

                                        {/* Expanded: side by side */}
                                        {isExpanded && (
                                            <View className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 bg-muted rounded-2xl">
                                                <View>
                                                    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 flex-row">
                                                        <FileImage className="w-3.5 h-3.5" /> Student&apos;s Answer
                                                    </Text>
                                                    {item.submission_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <Image src={item.submission_url} alt="Student answer" className="w-full max-h-64 object-contain rounded-xl bg-background border border-border" />
                                                    ) : (
                                                        <View className="h-40 bg-background rounded-xl border border-border flex items-center justify-center text-muted-foreground text-sm flex-row">No image</View>
                                                    )}
                                                </View>
                                                <View>
                                                    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 flex-row">
                                                        <BookOpen className="w-3.5 h-3.5" /> Teacher&apos;s Model Answer
                                                    </Text>
                                                    {item.teacherSolutionUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <Image src={item.teacherSolutionUrl} alt="Teacher answer" className="w-full max-h-64 object-contain rounded-xl bg-background border border-primary/50" />
                                                    ) : (
                                                        <View className="h-40 bg-background rounded-xl border border-border flex items-center justify-center text-muted-foreground text-sm text-center p-4 flex-row">
                                                            <Text>Teacher hasn&apos;t uploaded a model answer yet</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}

                                        {/* Vote buttons */}
                                        {voted ? (
                                            <View className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold ${voted === "correct" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}>
                                                {voted === "correct" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                                                Voted: {voted === "correct" ? "Correct ✓" : "Wrong — flagged"}
                                            </View>
                                        ) : (
                                            <View className="grid grid-cols-2 gap-3">
                                                <View
                                                    onPress={() => handleVote(item.id, "correct")}
                                                    disabled={!!votingId}
                                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all hover:shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 flex-row"
                                                >
                                                    {votingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                                    Correct ✓
                                                </View>
                                                <View
                                                    onPress={() => handleVote(item.id, "wrong")}
                                                    disabled={!!votingId}
                                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all hover:shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 flex-row"
                                                >
                                                    {votingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                                    Flag Wrong ✗
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
        </View>
    );
}
