"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Zap, CheckCircle2, XCircle, Loader2, Star, User, Send, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import TeacherBadge from "@/ticks/teacher";
import ChallengeFriendModal from "@/components/ChallengeFriendModal";
import CoopChallengeHeader from "@/components/CoopChallengeHeader";
import CoopSpectatorScreen from "@/components/CoopSpectatorScreen";


export default function SolveQuestionClient({ question }: { question: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const challengeId = searchParams.get("challenge");

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(question.time_limit * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ isCorrect: boolean, newTotal: number, correctOption: number, pointsChange: number } | null>(null);
    const [startedAt] = useState(() => new Date().toISOString());

    const [authChecked, setAuthChecked] = useState(false);
    const [alreadyAttempted, setAlreadyAttempted] = useState<any>(null);
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [challengeInitiator, setChallengeInitiator] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const checkAuthAndAttempt = async () => {
            // Use getUser() to avoid NavigatorLock timeout issues
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                if (mounted) router.push("/login");
                return;
            }

            if (user.user_metadata?.isTeacher) {
                if (mounted) router.push("/");
                return;
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

            // Check if already attempted
            const { data, error } = await supabase
                .from("question_attempts")
                .select("is_correct, selected_option, time_taken")
                .eq("user_id", user.id)
                .eq("question_id", question.id)
                .limit(1)
                .maybeSingle();

            if (mounted) {
                if (data) setAlreadyAttempted(data);
                setCurrentUserId(user.id);
                setAuthChecked(true);
            }
        };
        checkAuthAndAttempt();
        return () => { mounted = false; };
    }, [question.id, router]);

    const publicUrl = question.image_url || (question.image_path ? supabase.storage.from("question-images").getPublicUrl(question.image_path).data.publicUrl : null);

    const handleSubmit = useCallback(async (forcedOption?: number | null) => {
        if (isSubmitting || result) return;
        setIsSubmitting(true);

        const optionToSend = forcedOption !== undefined ? forcedOption : selectedOption;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch("/api/solve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    questionId: question.id,
                    selectedOption: optionToSend ?? null,
                    startedAt,
                    timeTaken: Math.max(0, question.time_limit * 60 - timeLeft),
                    challengeId
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to submit answer");
                setIsSubmitting(false);
                return;
            }

            setResult(data);
        } catch (err: any) {
            alert("Network error: " + err.message);
            setIsSubmitting(false);
        }
    }, [isSubmitting, result, selectedOption, startedAt, question, timeLeft, challengeId]);

    // Timer effect
    useEffect(() => {
        if (!authChecked || alreadyAttempted || result || isSubmitting) return;

        if (timeLeft <= 0) {
            handleSubmit(selectedOption);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, authChecked, alreadyAttempted, result, isSubmitting, handleSubmit, selectedOption]);

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s.toString().padStart(2, "0")}`;
    };

    const difficultyColor = (difficulty?: string) => {
        switch (difficulty?.toLowerCase()) {
            case "easy": return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "medium":
            case "moderate": return "bg-amber-100 text-amber-800 border-amber-200";
            case "hard": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    const handleReviewSubmit = async () => {
        if (rating === 0) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    questionId: question.id,
                    teacherId: question.created_by,
                    rating
                })
            });

            if (res.ok) {
                setReviewSubmitted(true);
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Failed to submit review");
            }
        } catch (error) {
            console.error("Review Error:", error);
            alert("Error submitting review");
        }
    };

    const renderTeacherProfile = () => {
        const tLink = question.teacherUsername ? `/teacher/${question.teacherUsername}` : "#";
        return (
            <div className="flex items-center gap-4 p-4 mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl">
                <a href={tLink} className="relative block shrink-0">
                    {question.teacherAvatar ? (
                        <img src={question.teacherAvatar} alt="Teacher" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                            {String(question.teacherName?.[0] || 'T').toUpperCase()}
                        </div>
                    )}
                </a>
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Posted By</span>
                    <a href={tLink} className="font-bold flex items-center text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {question.teacherName || "Verified Teacher"}
                        <TeacherBadge />
                    </a>
                </div>
            </div>
        );
    };

    if (!authChecked) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 dark:text-slate-500 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-medium animate-pulse">Loading battle arena...</p>
            </div>
        );
    }

    // Any participant visited their challenge link and already attempted it — show spectator screen
    if (alreadyAttempted && challengeId) {
        return (
            <CoopSpectatorScreen
                challengeId={challengeId}
                questionPoints={question.points || 0}
                currentUserId={currentUserId!}
            />
        );
    }

    // Non-challenge re-attempt → already attempted screen
    if (alreadyAttempted && !challengeId) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in-95 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 dark:bg-slate-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="flex justify-center">
                    {alreadyAttempted.is_correct ? (
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10" />
                        </div>
                    )}
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    You have already attempted this question.
                </h2>

                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Your answer was <span className="font-bold">{alreadyAttempted.is_correct ? "Correct" : "Incorrect"}</span>.
                </p>
                <div className="pt-6 flex flex-col gap-3 max-w-sm mx-auto">
                    {!alreadyAttempted.is_correct && !challengeId && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-2xl mb-2 text-sm text-indigo-800 dark:text-indigo-300 text-left">
                            <span className="font-bold flex items-center gap-1.5 mb-1"><Users className="w-4 h-4" /> Co-op Recovery Available!</span>
                            You can't retry this alone, but if you tag a friend and they solve it correctly, you'll both split the points!
                        </div>
                    )}

                    {!alreadyAttempted.is_correct && !challengeId && (
                        <button
                            onClick={() => setIsChallengeModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20"
                        >
                            <Users className="w-5 h-5" />
                            Tag a Friend to Retry!
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/")}
                        className={`w-full ${alreadyAttempted.is_correct ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border'} font-bold px-8 py-3.5 rounded-xl transition`}
                    >
                        Back to Dashboard
                    </button>
                </div>

                {/* Challenge Modal */}
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

    if (result) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex justify-center">
                    {result.isCorrect ? (
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10" />
                        </div>
                    )}
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    {result.isCorrect ? "Correct!" : "Incorrect!"}
                </h2>

                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {result.isCorrect
                        ? `Brilliant job! You earned ${result.pointsChange} points.`
                        : `Keep learning! You lost ${Math.abs(result.pointsChange)} points.`
                    }
                </p>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl inline-block w-full max-w-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Points</div>
                    <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{result.newTotal}</div>
                </div>

                {!result.isCorrect && question.options && result.correctOption !== undefined && result.correctOption !== null && (
                    <div className="mt-6 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">The correct answer was: </span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                            {question.options[result.correctOption]}
                        </strong>
                    </div>
                )}

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 max-w-md mx-auto">
                    {!reviewSubmitted ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Rate this Question</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Help us identify the best content from our teachers.</p>
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${(hoverRating || rating) >= star
                                                ? "fill-amber-400 text-amber-400"
                                                : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleReviewSubmit}
                                disabled={rating === 0}
                                className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" /> Submit Rating
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 font-medium flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Thanks for your feedback!
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3">
                        {!result.isCorrect && (
                            <button
                                onClick={() => setIsChallengeModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20"
                            >
                                <Users className="w-5 h-5" />
                                Tag a Friend to Recover Points!
                            </button>
                        )}
                        <button
                            onClick={() => router.push("/")}
                            className={`w-full ${result.isCorrect ? 'bg-slate-900 dark:bg-slate-100 border-transparent text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} font-bold px-8 py-3.5 rounded-xl border transition`}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Challenge Modal */}
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

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5">
            {challengeId && (
                <CoopChallengeHeader
                    challengeId={challengeId}
                    questionPoints={question.points || 0}
                    currentUserId={currentUserId}
                />
            )}

            {/* Top Bar: Timer & Points */}
            <div className="flex items-center justify-between bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm sticky top-4 z-40">
                <div className={`flex items-center gap-2 font-mono text-lg font-medium px-4 py-1.5 rounded-full ${timeLeft <= 30 ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'bg-gray-100/80 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300'}`}>
                    <Clock className="w-4 h-4" />
                    {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-2">
                    {/* Penalty Badge */}
                    <div className="hidden sm:flex items-center gap-1 text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-xs font-medium cursor-help" title="Penalty if answered incorrectly">
                        <span>- {Math.floor((question.points || 0) / 5)} pts if wrong</span>
                    </div>

                    {/* Reward Badge */}
                    <div className="flex items-center gap-1.5 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition-transform hover:scale-105 cursor-help" title="Reward if correct">
                        <span className="font-semibold">{question.points || 0} points</span>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            {(
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-12 shadow-sm border border-gray-200 dark:border-slate-800 relative overflow-hidden">
                    {renderTeacherProfile()}

                    <div className="mb-8 flex flex-wrap gap-2">
                        {question.class_grade && (
                            <span className="bg-gray-100/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium tracking-wide">Class {question.class_grade}</span>
                        )}
                        {question.subject && (
                            <span className="bg-gray-100/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium tracking-wide">{question.subject}</span>
                        )}
                        {question.difficulty && (
                            <span className="bg-gray-100/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium capitalize tracking-wide">
                                {question.difficulty}
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed tracking-tight">
                        {question.title}
                    </h1>

                    {question.body && (
                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-lg sm:text-xl mb-10 whitespace-pre-wrap font-light">
                            {question.body}
                        </p>
                    )}

                    {publicUrl && (
                        <div className="mb-12 rounded-[1.5rem] overflow-hidden bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-center p-6 border border-gray-100 dark:border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={publicUrl} alt="Question Attachment" className="max-h-[400px] object-contain rounded-xl drop-shadow-sm" />
                        </div>
                    )}

                    {/* Options */}
                    {question.options && question.options.length > 0 && (
                        <div className="grid gap-3 mt-8">
                            {question.options.map((opt: string, idx: number) => {
                                const isSelected = selectedOption === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(idx)}
                                        className={`relative p-5 sm:p-6 text-left rounded-2xl border transition-all duration-200 flex items-center gap-4 group ${isSelected
                                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 ring-1 ring-blue-500 z-10"
                                            : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50/80 dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300"
                                            }`}
                                    >
                                        <div className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`text-base sm:text-lg transition-colors ${isSelected ? "text-blue-900 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-slate-300"}`}>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer sticky submit integrated inside card */}
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={selectedOption === null || isSubmitting}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500 text-white font-medium text-lg px-10 py-4 rounded-full transition-all w-full sm:w-auto justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Answer"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
