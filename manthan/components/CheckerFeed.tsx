"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, CheckCircle2, Loader2, Zap,
    Users, AlertTriangle, FileImage, BookOpen, RefreshCw,
    ThumbsUp, ThumbsDown, Eye, Trophy
} from "lucide-react";
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
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-medium">Loading checker feed...</p>
            </div>
        );
    }

    if (isTeacher) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center bg-background rounded-3xl p-12 border border-border shadow-sm">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-foreground">Checker Feed</h2>
                    <p className="text-muted-foreground mt-2">Teachers don&apos;t participate in peer checking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 pt-6 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        Live Checker Feed
                    </div>
                    <h1 className="text-3xl font-black text-foreground mb-2">Peer Review Queue</h1>
                    <p className="text-muted-foreground font-medium">
                        Review written answers submitted by your peers. Earn{" "}
                        <span className="font-bold text-primary">+2 points</span> for correctly identifying wrong answers.
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={fetchFeed}
                            className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {items.length} submission{items.length !== 1 ? "s" : ""} waiting
                        </div>
                    </div>
                </div>

                {/* Reward info */}
                <div className="mb-6 p-4 bg-background border border-border rounded-2xl shadow-sm flex gap-3">
                    <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                        <p className="font-bold mb-1">How checker rewards work:</p>
                        <ul className="text-muted-foreground space-y-0.5">
                            <li>• Vote <strong>&quot;Wrong&quot;</strong> → if 2 people flag it → AI verifies. If wrong, you earn <strong className="text-primary">+2 points</strong></li>
                            <li>• Vote <strong>&quot;Correct&quot;</strong> → if 2 people agree → student is approved and you earn <strong className="text-emerald-600">+1 point</strong>.</li>
                            <li>• Spamming <strong>&quot;Wrong&quot;</strong> on good answers → <strong>-1 point penalty</strong>.</li>
                        </ul>
                    </div>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Loading peer submissions...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center bg-background rounded-3xl p-16 border border-border shadow-sm">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2">All Caught Up!</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto">No written answers waiting for peer review right now.</p>
                        <button onClick={fetchFeed} className="mt-6 px-6 py-2.5 bg-muted rounded-xl text-foreground font-semibold text-sm hover:bg-accent transition-colors">
                            Refresh Feed
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {items.map((item) => {
                            const voted = myvotes[item.id];
                            const isExpanded = expandedItem === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-background rounded-3xl border shadow-sm transition-all duration-200 overflow-hidden ${voted ? "opacity-60 scale-[0.99]" : "hover:shadow-md"}`}
                                >
                                    <div className="p-5 sm:p-6">

                                        {/* Co-op banner */}
                                        {item.isCoopChallenge && (
                                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 mb-4 text-xs font-bold text-primary">
                                                <Users className="w-3.5 h-3.5" />
                                                Co-op Challenge — points are split between two players if correct
                                            </div>
                                        )}

                                        {/* Title row */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {item.questions.subject && (
                                                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">{item.questions.subject}</span>
                                                    )}
                                                    {item.questions.class_grade && (
                                                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">Class {item.questions.class_grade}</span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-foreground leading-snug">{item.questions.title}</h3>
                                                {item.questions.body && (
                                                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.questions.body}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                                                <Zap className="w-3 h-3 fill-amber-500" />
                                                {item.questions.points} pts
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full font-medium">
                                                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                                {item.wrongVotes}/{item.requiredToFlag} wrong flags for AI check
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                {item.correctVotes ?? 0}/{item.requiredToFlag} correct votes to approve
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                                                <Users className="w-3.5 h-3.5" />
                                                by {item.studentFirstName}
                                            </div>
                                        </div>

                                        {/* Show answers toggle */}
                                        <button
                                            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                            className="flex items-center gap-2 text-sm text-primary font-semibold hover:text-primary/80 transition-colors mb-4"
                                        >
                                            <Eye className="w-4 h-4" />
                                            {isExpanded ? "Hide" : "View"} Answers
                                        </button>

                                        {/* Expanded: side by side */}
                                        {isExpanded && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 bg-muted rounded-2xl">
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <FileImage className="w-3.5 h-3.5" /> Student&apos;s Answer
                                                    </p>
                                                    {item.submission_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.submission_.url} alt="Student answer" className="w-full max-h-64 object-contain rounded-xl bg-background border border-border" />
                                                    ) : (
                                                        <div className="h-40 bg-background rounded-xl border border-border flex items-center justify-center text-muted-foreground text-sm">No image</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <BookOpen className="w-3.5 h-3.5" /> Teacher&apos;s Model Answer
                                                    </p>
                                                    {item.teacherSolutionUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.teacherSolutionUrl} alt="Teacher answer" className="w-full max-h-64 object-contain rounded-xl bg-background border border-primary/50" />
                                                    ) : (
                                                        <div className="h-40 bg-background rounded-xl border border-border flex items-center justify-center text-muted-foreground text-sm text-center p-4">
                                                            <span>Teacher hasn&apos;t uploaded a model answer yet</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Vote buttons */}
                                        {voted ? (
                                            <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold ${voted === "correct" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}>
                                                {voted === "correct" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                                                Voted: {voted === "correct" ? "Correct ✓" : "Wrong — flagged"}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleVote(item.id, "correct")}
                                                    disabled={!!votingId}
                                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all hover:shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    {votingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                                    Correct ✓
                                                </button>
                                                <button
                                                    onClick={() => handleVote(item.id, "wrong")}
                                                    disabled={!!votingId}
                                                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all hover:shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    {votingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                                    Flag Wrong ✗
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
