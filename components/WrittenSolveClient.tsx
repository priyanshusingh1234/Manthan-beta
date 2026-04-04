"use client";

import { compressImage } from "@/utils/compressImage";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Clock, Zap, ArrowLeft, Shield, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ChallengeFriendModal from "@/components/ChallengeFriendModal";
import CoopChallengeHeader from "@/components/CoopChallengeHeader";
import CoopSpectatorScreen from "@/components/CoopSpectatorScreen";

// Sub-components
import QuestionCard from "@/components/written/QuestionCard";
import UploadSection from "@/components/written/UploadSection";
import AnswerComparison from "@/components/written/AnswerComparison";
import SelfMarkSection from "@/components/written/SelfMarkSection";
import type { Submission, WrittenQuestion } from "@/components/written/types";

export default function WrittenSolveClient({ question }: { question: WrittenQuestion }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const challengeId = searchParams.get("challenge");

    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Auth / gate states
    const [authChecked, setAuthChecked] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // Solve timer
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
    const [challengeInitiator, setChallengeInitiator] = useState<string | null>(null);

    // ── Auth + check existing submission ─────────────────────────
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) { router.push("/login"); return; }
            if (user.user_metadata?.isTeacher) { router.push("/"); return; }

            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setToken(session?.access_token ?? null);
                setCurrentUserId(user.id);
            }

            if (challengeId) {
                const { data: challengeInfo } = await supabase
                    .from("coop_challenges")
                    .select("initiator_id")
                    .eq("id", challengeId)
                    .single();
                if (mounted && challengeInfo) {
                    setChallengeInitiator(challengeInfo.initiator_id);
                }
            }

            const { data, error: subQueryError } = await supabase
                .from("written_submissions")
                .select("id, submission_url, self_marked_correct, status, points_awarded, checker_deadline, challenge_id")
                .eq("student_id", user.id)
                .eq("question_id", question.id)
                .limit(1)
                .maybeSingle();

            if (subQueryError) console.error("[WrittenSolveClient] Failed to fetch submission:", subQueryError);
            if (mounted) {
                if (data) setExistingSubmission(data as Submission);
                setAuthChecked(true);
                setTimerStarted(true);
            }
        };
        init();
        return () => { mounted = false; };
    }, [question.id, router, challengeId]);

    // ── Solve Timer ───────────────────────────────────────────────
    useEffect(() => {
        if (!timerStarted || activeSubmission || solveTimeLeft <= 0) return;
        const t = setInterval(() => setSolveTimeLeft(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(t);
    }, [timerStarted, solveTimeLeft, activeSubmission]);

    // ── Fetch teacher solution ────────────────────────────────────
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

    // ── Poll for status updates ───────────────────────────────────
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
            if (!waitingStatuses.includes(data.status)) {
                if (existingSubmission) setExistingSubmission(data as Submission);
                else setUploadedSubmission(data as Submission);
                clearInterval(poll);
            }
        }, 8000);

        return () => clearInterval(poll);
    }, [existingSubmission, uploadedSubmission]);

    // ── File handling ─────────────────────────────────────────────
    const processSelectedFile = async (file: File) => {
        if ((file as any)?.size > 10 * 1024 * 1024) { alert("File must be ≤ 10MB"); return; }
        setSelectedFile(file);
        
        const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && /Macintosh/.test(navigator.userAgent));

        // Create blob URL FIRST — this works even for Capacitor native file objects
        let blobUrl: string | null = null;
        try {
            blobUrl = URL.createObjectURL(file);
            setPreviewUrl(blobUrl);
        } catch (e) {
            console.warn("[processSelectedFile] createObjectURL failed", e);
        }

        // Auto-upload for mobile, passing blobUrl as immediate fallback
        if (isMobile) {
            handleUpload(file, blobUrl);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processSelectedFile(file);
    };

    const clearFile = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setSelectedFile(null);
    };

    // ── Upload Answer ─────────────────────────────────────────────
    const handleUpload = async (fileOverride?: File, blobUrlOverride?: string | null) => {
        const fileToUpload = fileOverride || selectedFile;
        if (!fileToUpload || !token) return;
        setUploading(true);
        try {
            const isRealBlob = (fileToUpload instanceof Blob) ||
                (fileToUpload && typeof (fileToUpload as any).size === 'number' && typeof (fileToUpload as any).slice === 'function');

            let uploadBlob: Blob;
            const mimeType = (fileToUpload as any)?.type || 'image/jpeg';
            const fileName = (fileToUpload as any)?.name || 'image.jpg';

            if (isRealBlob) {
                // Normal path: compress and use
                const compressed = await compressImage(fileToUpload, "answer");
                const compressedIsBlob = (compressed instanceof Blob) ||
                    (compressed && typeof (compressed as any).size === 'number' && typeof (compressed as any).slice === 'function');
                uploadBlob = compressedIsBlob ? (compressed as unknown as Blob) : (fileToUpload as unknown as Blob);
            } else {
                // Fallback: re-fetch the blob: URL (passed directly or from React state)
                const fallbackUrl = blobUrlOverride || previewUrl;
                if (!fallbackUrl) throw new Error("No valid image data to upload. Please try taking the photo again.");
                console.warn("[handleUpload] fileToUpload is not a Blob, falling back to URL fetch:", fallbackUrl);
                const res = await fetch(fallbackUrl);
                uploadBlob = await res.blob();
            }

            const form = new FormData();
            form.append("file", uploadBlob, (uploadBlob as any).name || fileName);
            form.append("questionId", question.id);
            if (challengeId) form.append("challengeId", challengeId);

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
                challenge_id: challengeId || null,
            });
        } catch (err: unknown) {
            alert("Network error: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setUploading(false);
        }
    };

    // ── Self-Mark ─────────────────────────────────────────────────
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
            setSelfMarkResult({ pointsAwarded: data.pointsAwarded, newTotal: data.newTotal, checkerDeadline: data.checkerDeadline });
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

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "pending_check": return { label: "In Checker Queue", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50", icon: <Shield className="w-4 h-4" /> };
            case "points_given": return { label: "Points Awarded ✓ — Still open for peer review", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "auto_approved": return { label: "Auto-Approved ✓", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50", icon: <CheckCircle2 className="w-4 h-4" /> };
            default: return { label: "Uploaded — Not Yet Marked", color: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700", icon: <Clock className="w-4 h-4" /> };
        }
    };

    const isTimeLow = solveTimeLeft <= 120 && !activeSubmission;

    // ── Loading gate ──────────────────────────────────────────────
    if (!authChecked) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 dark:text-slate-500 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-medium animate-pulse">Loading written challenge...</p>
            </div>
        );
    }

    // Initiator spectator screen
    if (existingSubmission && challengeId && challengeInitiator === currentUserId) {
        return (
            <CoopSpectatorScreen
                challengeId={challengeId}
                questionPoints={question.points || 0}
                currentUserId={currentUserId!}
            />
        );
    }

    const currentStatus = activeSubmission?.status || "none";
    const statusInfo = getStatusInfo(currentStatus);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5 pb-16">
            {/* Co-op banner */}
            {challengeId && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-center gap-3 animate-pulse">
                    <Users className="w-6 h-6" />
                    <p className="font-bold">Co-op Challenge Mode Active! You&apos;re playing to win points together.</p>
                </div>
            )}

            {/* ── Top bar with timer ── */}
            <div className="flex items-center justify-between bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm sticky top-4 z-40">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3">
                    {!activeSubmission && (
                        <div className={`flex items-center gap-2 font-mono text-sm font-bold px-4 py-1.5 rounded-full border transition-colors ${isTimeLow ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 animate-pulse" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                            <Clock className="w-4 h-4" />
                            {formatSolveTime(solveTimeLeft)}
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-violet-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        {question.points} pts — Written
                    </div>
                </div>
            </div>

            {/* ── Question Card ── */}
            <QuestionCard question={question} />

            {/* ── Co-op header ── */}
            {challengeId && (
                <CoopChallengeHeader
                    challengeId={challengeId}
                    questionPoints={question.points || 0}
                    currentUserId={currentUserId}
                />
            )}

            {/* ── Upload section (before submission) ── */}
            {!activeSubmission && (
                <UploadSection
                    previewUrl={previewUrl}
                    selectedFile={selectedFile}
                    uploading={uploading}
                    solveTimeLeft={solveTimeLeft}
                    onFileChange={handleFileChange}
                    onFileSelect={processSelectedFile}
                    onClearFile={clearFile}
                    onUpload={handleUpload}
                />
            )}

            {/* ── After submission ── */}
            {activeSubmission && (
                <>
                    {/* Status badge */}
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                    </div>

                    {/* Side-by-side comparison */}
                    <AnswerComparison
                        submission={activeSubmission}
                        previewUrl={previewUrl}
                        showTeacherAnswer={showTeacherAnswer}
                        loadingTeacherAnswer={loadingTeacherAnswer}
                        teacherSolutionUrl={teacherSolutionUrl}
                        onRevealTeacherAnswer={() => setShowTeacherAnswer(true)}
                    />

                    {/* Self-mark, outcomes */}
                    <SelfMarkSection
                        submission={activeSubmission}
                        questionPoints={question.points}
                        selfMarked={selfMarked}
                        selfMarkResult={selfMarkResult}
                        selfMarkError={selfMarkError}
                        submitting={submitting}
                        deleting={deleting}
                        challengeId={challengeId}
                        onSelfMark={handleSelfMark}
                        onChallengeFriend={() => setIsChallengeModalOpen(true)}
                        onDelete={handleDeleteSubmission}
                        onBackToDashboard={() => router.push("/")}
                    />
                </>
            )}

            {/* Challenge modal */}
            {currentUserId && (
                <ChallengeFriendModal
                    isOpen={isChallengeModalOpen}
                    onClose={() => setIsChallengeModalOpen(false)}
                    questionId={question.id}
                    currentUserId={currentUserId}
                />
            )}
        </div>
    );
}
