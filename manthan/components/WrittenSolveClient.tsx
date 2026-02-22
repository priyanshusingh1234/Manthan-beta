"use client";

import { compressImage } from "@/utils/compressImage";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Upload, CheckCircle2, XCircle, Loader2, Eye, EyeOff,
    AlertTriangle, Clock, Zap, FileImage, ArrowLeft,
    Shield, Users, ThumbsUp, Info, X, Search
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import TeacherBadge from "@/ticks/teacher";

type Submission = {
    id: string;
    submission_url: string;
    self_marked_correct: boolean;
    status: string;
    points_awarded: number;
    checker_deadline: string | null;
};

export default function WrittenSolveClient({ question }: { question: { id: string; title: string; body: string; points: number; time_limit: number; subject?: string; class_grade?: string; options?: string[]; image_url?: string; image_path?: string; teacherName?: string; teacherAvatar?: string; teacherUsername?: string; created_by: string } }) {
    const router = useRouter();

    // Auth / gate states
    const [authChecked, setAuthChecked] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // Solve timer (same as MCQ — counts down from time_limit)
    const [solveTimeLeft, setSolveTimeLeft] = useState<number>((question.time_limit || 30) * 60);
    const [timerStarted, setTimerStarted] = useState(false);

    // Submission states
    const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedSubmission, setUploadedSubmission] = useState<Submission | null>(null);

    // Teacher solution
    const [teacherSolutionUrl, setTeacherSolutionUrl] = useState<string | null>(null);
    const [showTeacherAnswer, setShowTeacherAnswer] = useState(false);
    const [loadingTeacherAnswer, setLoadingTeacherAnswer] = useState(false);

    // Self-mark
    const [selfMarked, setSelfMarked] = useState(false);
    const [selfMarkResult, setSelfMarkResult] = useState<{ pointsAwarded: number; newTotal: number; checkerDeadline: string } | null>(null);
    const [selfMarkError, setSelfMarkError] = useState<string | null>(null);

    const activeSubmission = existingSubmission || uploadedSubmission;

    // ── Auth + check existing submission ─────────────────────────
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }
            if (session.user.user_metadata?.isTeacher) { router.push("/"); return; }

            if (mounted) {
                setToken(session.access_token);
            }

            const { data } = await supabase
                .from("written_submissions")
                .select("id, submission_url, self_marked_correct, status, points_awarded, checker_deadline")
                .eq("student_id", session.user.id)
                .eq("question_id", question.id)
                .maybeSingle();

            if (mounted) {
                if (data) setExistingSubmission(data as Submission);
                setAuthChecked(true);
                setTimerStarted(true); // start solve timer after auth
            }
        };
        init();
        return () => { mounted = false; };
    }, [question.id, router]);

    // ── Solve Timer (counts down, stops when submitted) ───────────
    useEffect(() => {
        if (!timerStarted || activeSubmission) return; // stop once submitted
        if (solveTimeLeft <= 0) return; // time's up

        const t = setInterval(() => {
            setSolveTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(t);
    }, [timerStarted, solveTimeLeft, activeSubmission]);

    // ── Fetch teacher solution (only after submission exists) ─────
    const fetchTeacherSolution = useCallback(async () => {
        if (!token) return;
        setLoadingTeacherAnswer(true);
        try {
            const res = await fetch(`/api/teacher-solution?questionId=${question.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.hasModelAnswer) setTeacherSolutionUrl(data.solutionUrl);
        } catch { /* ignore */ } finally {
            setLoadingTeacherAnswer(false);
        }
    }, [question.id, token]);

    useEffect(() => {
        if (activeSubmission && token) fetchTeacherSolution();
    }, [activeSubmission, token, fetchTeacherSolution]);

    // ── Poll for status updates when waiting for checker/AI ───────
    useEffect(() => {
        const waitingStatuses = ["pending_check", "flagged_for_ai"];
        const sub = existingSubmission || uploadedSubmission;
        if (!sub || !waitingStatuses.includes(sub.status)) return;

        const poll = setInterval(async () => {
            const { data } = await supabase
                .from("written_submissions")
                .select("id, submission_url, self_marked_correct, status, points_awarded, checker_deadline")
                .eq("id", sub.id)
                .maybeSingle();

            if (!data) return;
            // Only update if the status has changed to a terminal state
            if (!waitingStatuses.includes(data.status)) {
                if (existingSubmission) setExistingSubmission(data as Submission);
                else setUploadedSubmission(data as Submission);
                clearInterval(poll);
            }
        }, 8000);

        return () => clearInterval(poll);
    }, [existingSubmission, uploadedSubmission]);

    // ── Checker countdown logic (re-fetched on poll) ───────────────
    // Removed unused timer state for performance/lint compliance

    // ── File Selection ────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert("File must be ≤ 10MB"); return; }
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const clearFile = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setSelectedFile(null);
    };

    // ── Upload Answer ─────────────────────────────────────────────
    const handleUpload = async () => {
        if (!selectedFile || !token) return;
        setUploading(true);
        try {
            // Compress image before upload to save storage space
            const compressed = await compressImage(selectedFile, "answer");

            const form = new FormData();
            form.append("file", compressed);
            form.append("questionId", question.id);

            const res = await fetch("/api/written-submit", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            const data = await res.json();
            if (!res.ok) { alert(data.error || "Upload failed"); return; }

            setUploadedSubmission({
                id: data.submissionId,
                submission_url: data.submissionUrl || "",
                self_marked_correct: false,
                status: "pending",
                points_awarded: 0,
                checker_deadline: null,
            });
        } catch (err: unknown) {
            alert("Network error: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setUploading(false);
        }
    };

    // ── Self-Mark as Correct ──────────────────────────────────────
    const handleSelfMark = async () => {
        if (!activeSubmission || !token) return;
        setSubmitting(true);
        setSelfMarkError(null);
        try {
            const res = await fetch("/api/written-submit", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ submissionId: activeSubmission.id }),
            });
            const data = await res.json();
            if (!res.ok) { setSelfMarkError(data.error || "Failed to self-mark"); return; }
            setSelfMarked(true);
            setSelfMarkResult({
                pointsAwarded: data.pointsAwarded,
                newTotal: data.newTotal,
                checkerDeadline: data.checkerDeadline,
            });
        } catch (err: unknown) {
            setSelfMarkError("Network error: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete Submission ─────────────────────────────────────────
    const handleDeleteSubmission = async () => {
        if (!activeSubmission || !token || !window.confirm("Are you sure? This will delete your uploaded answer and allow you to try again.")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/written-submit?submissionId=${activeSubmission.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || "Failed to delete submission"); return; }

            // Reset state
            setExistingSubmission(null);
            setUploadedSubmission(null);
            setSelectedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setSelfMarkError(null);
            setShowTeacherAnswer(false);

        } catch (err: unknown) {
            alert("Network error: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setDeleting(false);
        }
    };

    const formatSolveTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    const statusInfo = (status: string) => {
        switch (status) {
            case "pending_check":
                return { label: "In Checker Queue", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Shield className="w-4 h-4" /> };
            case "points_given":
                return { label: "Points Awarded ✓ — Still open for peer review", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "auto_approved":
                return { label: "Auto-Approved ✓", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "flagged":
                return { label: "Flagged — Awaiting Teacher", color: "text-orange-600 bg-orange-50 border-orange-200", icon: <AlertTriangle className="w-4 h-4" /> };
            case "ai_confirmed_correct":
                return { label: "AI Verified Correct ✓", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "ai_confirmed_wrong":
                return { label: "AI Confirmed Wrong", color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle className="w-4 h-4" /> };
            case "flagged_for_ai":
                return { label: "Checking with AI Verifier...", color: "text-orange-600 bg-orange-50 border-orange-200", icon: <Loader2 className="w-4 h-4 animate-spin" /> };
            default:
                return { label: "Uploaded — Not Yet Marked", color: "text-slate-600 bg-slate-50 border-slate-200", icon: <Info className="w-4 h-4" /> };
        }
    };

    const isTimeLow = solveTimeLeft <= 120 && !activeSubmission;

    // ── Loading gate ──────────────────────────────────────────────
    if (!authChecked) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-medium animate-pulse">Loading written challenge...</p>
            </div>
        );
    }

    const currentStatus = activeSubmission?.status || "none";
    const info = statusInfo(currentStatus);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5 pb-16">

            {/* ── Top Bar with Solve Timer ─────────────────────────── */}
            <div className="flex items-center justify-between bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-200 shadow-sm sticky top-4 z-40">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-3">
                    {/* Solve Timer — hidden once student has submitted */}
                    {!activeSubmission && (
                        <div className={`flex items-center gap-2 font-mono text-sm font-bold px-4 py-1.5 rounded-full border transition-colors ${isTimeLow
                            ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}>
                            <Clock className="w-4 h-4" />
                            {formatSolveTime(solveTimeLeft)}
                        </div>
                    )}

                    {/* Points badge */}
                    <div className="flex items-center gap-2 bg-violet-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        {question.points} pts — Written
                    </div>
                </div>
            </div>

            {/* ── Question Card ────────────────────────────────────── */}
            <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                {/* Teacher info */}
                <div className="flex items-center gap-4 p-4 mb-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    {question.teacherAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={question.teacherAvatar} alt="Teacher" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm">
                            {String(question.teacherName?.[0] || "T").toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Posted By</p>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            {question.teacherName || "Verified Teacher"}<TeacherBadge />
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200">
                        <FileImage className="w-3.5 h-3.5" /> Written Answer
                    </div>
                </div>

                {/* Meta tags */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {question.class_grade && <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">Class {question.class_grade}</span>}
                    {question.subject && <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">{question.subject}</span>}
                    {question.difficulty && <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium capitalize">{question.difficulty}</span>}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">{question.title}</h1>
                {question.body && <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-6 whitespace-pre-wrap">{question.body}</p>}

                {/* Question image */}
                {question.publicUrl && (
                    <div className="mb-6 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={question.publicUrl} alt="Question" className="max-h-80 object-contain rounded-xl" />
                    </div>
                )}

                {/* Rules notice */}
                <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-2xl flex gap-3">
                    <Info className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-violet-800">
                        <p className="font-bold mb-1">How written answers work:</p>
                        <ol className="space-y-1 list-decimal list-inside text-violet-700">
                            <li>Solve on paper, take a clear photo</li>
                            <li>Upload your photo within the time limit</li>
                            <li>Compare with the teacher&apos;s model answer</li>
                            <li>If correct, click <strong>&quot;I got it right&quot;</strong> to earn points instantly</li>
                            <li>Community members will verify your answer. </li>
                            <li>If 2 members flag it, our deeply-integrated AI will review.</li>
                            <li>False claims = point loss + 3 extra penalty points</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* ── Upload Section ───────────────────────────────────── */}
            {!activeSubmission && (
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Upload Your Answer</h2>
                    <p className="text-slate-500 text-sm mb-5">Take a clear photo of your handwritten solution. Max 10MB (JPG, PNG, PDF)</p>

                    {/* ── Drop zone (fixed height, stable layout) ── */}
                    {!previewUrl ? (
                        <label
                            htmlFor="answer-upload"
                            className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50 rounded-2xl cursor-pointer transition-all"
                        >
                            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center pointer-events-none">
                                <Upload className="w-7 h-7 text-violet-500" />
                            </div>
                            <span className="text-slate-600 font-medium pointer-events-none">Click to upload your answer</span>
                            <span className="text-slate-400 text-xs pointer-events-none">JPG, PNG, PDF up to 10MB</span>
                            <input
                                id="answer-upload"
                                type="file"
                                accept="image/*,.pdf"
                                className="sr-only"
                                onChange={handleFileChange}
                            />
                        </label>
                    ) : (
                        /* ── Preview area (separate from label, no height conflict) ── */
                        <div className="w-full rounded-2xl border-2 border-violet-300 bg-violet-50 overflow-hidden">
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewUrl}
                                    alt="Your answer preview"
                                    className="w-full max-h-72 object-contain bg-white"
                                />
                                {/* Remove / change button */}
                                <button
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors shadow-sm"
                                    title="Remove and choose different file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {/* File info bar */}
                            <div className="px-4 py-2.5 flex items-center justify-between bg-violet-50 border-t border-violet-200">
                                <div className="flex items-center gap-2 text-xs text-violet-700 font-medium min-w-0">
                                    <FileImage className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{selectedFile?.name}</span>
                                    <span className="text-violet-400 shrink-0">({((selectedFile?.size ?? 0) / 1024).toFixed(0)} KB)</span>
                                </div>
                                <label htmlFor="answer-upload-change" className="ml-3 text-xs text-violet-600 font-bold cursor-pointer hover:text-violet-800 shrink-0">
                                    Change
                                    <input
                                        id="answer-upload-change"
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="sr-only"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {solveTimeLeft === 0 && !activeSubmission && (
                        <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Time&apos;s up! You can still upload but the answer will be marked late.
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-violet-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {uploading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                            : <><Upload className="w-4 h-4" /> Submit My Answer</>
                        }
                    </button>
                </div>
            )}

            {/* ── After Submission ─────────────────────────────────── */}
            {activeSubmission && (
                <>
                    {/* Status badge */}
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold ${info.color}`}>
                        {info.icon}
                        {info.label}
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student answer */}
                        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-slate-700 text-sm">Your Answer</h3>
                            </div>
                            {activeSubmission.submission_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={activeSubmission.submission_url}
                                    alt="Your answer"
                                    className="w-full max-h-96 object-contain rounded-xl bg-slate-50 border border-slate-100"
                                />
                            ) : previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt="Your uploaded answer" className="w-full max-h-96 object-contain rounded-xl bg-slate-50" />
                            ) : (
                                <div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm">No preview available</div>
                            )}
                        </div>

                        {/* Teacher model answer */}
                        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                                    <TeacherBadge />
                                </div>
                                <h3 className="font-bold text-slate-700 text-sm">Teacher&apos;s Model Answer</h3>
                            </div>

                            {!showTeacherAnswer ? (
                                <div className="h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-3 border border-slate-100">
                                    <EyeOff className="w-8 h-8 text-slate-300" />
                                    <p className="text-slate-500 text-sm font-medium text-center px-4">
                                        Reveal after you&apos;ve checked your own work.
                                    </p>
                                    <button
                                        onClick={() => setShowTeacherAnswer(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-500 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" /> Reveal Answer
                                    </button>
                                </div>
                            ) : loadingTeacherAnswer ? (
                                <div className="h-48 bg-slate-50 rounded-xl flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                                </div>
                            ) : teacherSolutionUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={teacherSolutionUrl}
                                    alt="Teacher model answer"
                                    className="w-full max-h-96 object-contain rounded-xl bg-slate-50 border border-violet-100"
                                />
                            ) : (
                                <div className="h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100">
                                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                                    <p className="text-slate-500 text-sm text-center">No model answer uploaded by teacher yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Self-mark section */}
                    {currentStatus === "pending" && !selfMarked && (
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Did you get it right?</h2>
                            <p className="text-slate-500 text-sm mb-5">
                                Compare honestly with the model answer above. Claim your{" "}
                                <strong className="text-violet-700">{question.points} points</strong> if you&apos;re correct.
                            </p>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    <strong>Warning:</strong> The community will review your claim. If 2 peers flag it as wrong, an independent AI Verifier will check it. If the AI confirms it&apos;s false,
                                    you lose {question.points} pts + <strong>3 extra penalty points</strong>.
                                </p>
                            </div>

                            {selfMarkError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{selfMarkError}</div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleSelfMark}
                                    disabled={submitting || deleting}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                    I Got It Right — Claim {question.points} Points
                                </button>
                                <button
                                    onClick={handleDeleteSubmission}
                                    disabled={submitting || deleting}
                                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed text-red-600 font-bold py-3.5 rounded-2xl transition-colors border border-red-200"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    I Got It Wrong — Delete Answer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Self-marked confirmation — shown for pending_check, points_given, and after self-mark */}
                    {(selfMarked || (activeSubmission.self_marked_correct && ["pending_check"].includes(currentStatus))) && (
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-emerald-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Points Awarded!</h2>
                                    <p className="text-slate-500 text-sm">
                                        +{selfMarkResult?.pointsAwarded ?? activeSubmission.points_awarded} points added provisionally
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm text-slate-600 mb-4">
                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <Shield className="w-4 h-4 text-violet-500" /> Community Verification Active
                                </div>
                                <p>Your peers are verifying your answer right now.</p>
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Users className="w-3.5 h-3.5" />
                                    Checkers are competing to verify or flag this answer
                                </div>
                            </div>

                            {selfMarkResult && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between mb-4">
                                    <span className="text-sm text-emerald-700 font-semibold">Your total points</span>
                                    <span className="text-2xl font-black text-emerald-700">{selfMarkResult.newTotal}</span>
                                </div>
                            )}

                            <button
                                onClick={() => router.push("/")}
                                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    )}

                    {/* Final outcomes */}
                    {currentStatus === "ai_confirmed_wrong" && (
                        <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center mt-5">
                            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-xl font-black text-red-700">Answer Confirmed Incorrect</h3>
                            <p className="text-red-600 mt-2 text-sm mb-4">Points + {question.points >= 15 ? "3-point penalty" : "penalty"} have been deducted.</p>
                            <a
                                href={`/submission/${activeSubmission.id}/ai-review`}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 rounded-xl text-red-700 font-bold text-sm hover:bg-red-100 transition-colors shadow-sm"
                            >
                                <Search className="w-4 h-4" /> Read AI Breakdown
                            </a>
                        </div>
                    )}
                    {(currentStatus === "auto_approved" || currentStatus === "ai_confirmed_correct") && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center mt-5">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-xl font-black text-emerald-700">
                                {currentStatus === "auto_approved" ? "Auto-Approved! ✓" : "Verified by AI! ✓"}
                            </h3>
                            <p className="text-emerald-600 mt-2 text-sm mb-4">
                                {currentStatus === "auto_approved"
                                    ? "Two peers marked your answer correct. Points permanently secured!"
                                    : "AI verified your answer is absolutely correct. Well done!"}
                            </p>
                            {currentStatus === "ai_confirmed_correct" && (
                                <a
                                    href={`/submission/${activeSubmission.id}/ai-review`}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors shadow-sm"
                                >
                                    <Search className="w-4 h-4" /> Read AI Feedback
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
