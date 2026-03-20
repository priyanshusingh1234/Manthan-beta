"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    AlertTriangle, CheckCircle2, XCircle, Loader2, Eye, EyeOff,
    FileImage, BookOpen, Users, Clock, Shield, RefreshCw
} from "lucide-react";
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Flagged Submissions</h2>
                        <p className="text-xs text-slate-500">Peer-flagged answers awaiting your final verdict</p>
                    </div>
                </div>
                <button
                    onClick={fetchFlagged}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {/* Rules summary */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                    <strong>Review rules:</strong> If wrong → student loses their earned points + 3 extra penalty.
                    Each checker who flagged correctly earns +2 points.
                    If correct → no changes, student keeps points.
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading flagged submissions...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-semibold text-sm">No flagged submissions right now.</p>
                    <p className="text-slate-400 text-xs mt-1">All caught up! Check back later.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => {
                        const isExpanded = expandedId === item.id;
                        const verdict = decided[item.id];
                        const wrongCount = item.checkerVotes.filter(v => v.vote === "wrong").length;

                        return (
                            <div
                                key={item.id}
                                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-opacity ${verdict ? "opacity-60" : ""}`}
                            >
                                <div className="p-5">
                                    {/* Question row */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                {item.questions.subject && (
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{item.questions.subject}</span>
                                                )}
                                                {item.questions.class_grade && (
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Class {item.questions.class_grade}</span>
                                                )}
                                                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wider">flagged</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.questions.title}</h3>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-xs text-slate-500">Claimed</div>
                                            <div className="text-lg font-black text-violet-700">+{item.points_awarded}pts</div>
                                        </div>
                                    </div>

                                    {/* Student + votes info */}
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="font-semibold">{item.studentName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                            <span>{wrongCount} peer{wrongCount !== 1 ? "s" : ""} flagged wrong</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Toggle answers */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                        className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors mb-4"
                                    >
                                        {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {isExpanded ? "Hide" : "Compare"} Answers
                                    </button>

                                    {/* Side by side */}
                                    {isExpanded && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <FileImage className="w-3 h-3" /> Student&apos;s Answer
                                                </p>
                                                {item.submission_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.submission_url} alt="Student" className="w-full max-h-60 object-contain rounded-lg bg-white border border-slate-200" />
                                                ) : (
                                                    <div className="h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs">No image</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" /> Your Model Answer
                                                </p>
                                                {item.teacherSolutionUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.teacherSolutionUrl} alt="Model answer" className="w-full max-h-60 object-contain rounded-lg bg-white border border-violet-200" />
                                                ) : (
                                                    <div className="h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs">No model answer</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Verdict buttons */}
                                    {verdict ? (
                                        <div className={`text-center py-2.5 rounded-xl text-sm font-bold ${verdict === "correct" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                            {verdict === "correct" ? <><CheckCircle2 className="w-4 h-4 inline mr-1" />Marked Correct</> : <><XCircle className="w-4 h-4 inline mr-1" />Confirmed Wrong</>}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleVerdict(item.id, "correct")}
                                                disabled={!!decidingId}
                                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                                            >
                                                {decidingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Student is Right
                                            </button>
                                            <button
                                                onClick={() => handleVerdict(item.id, "wrong")}
                                                disabled={!!decidingId}
                                                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                                            >
                                                {decidingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Confirm Wrong
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
    );
}
