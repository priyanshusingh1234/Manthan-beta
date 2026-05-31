import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from '@/lib/next-navigation';
import { Clock, Zap, CheckCircle2, XCircle, Loader2, Star, User, Send, Users, Trophy, ArrowRight, ArrowLeft } from 'lucide-react-native';

import { ActivityTracker } from '@/lib/activityTracker';
import { supabase } from "@/lib/supabaseClient";
import TeacherBadge from "@/ticks/teacher";
import ChallengeFriendModal from "@/components/ChallengeFriendModal";
import CoopChallengeHeader from "@/components/CoopChallengeHeader";
import CoopSpectatorScreen from "@/components/CoopSpectatorScreen";
import MatchArena from "@/components/MatchArena";
const confetti = Object.assign(() => {}, { reset: () => {} });
import { Alert } from 'react-native';
const toast = {
  success: (msg: any) => Alert.alert("Success", typeof msg === 'string' ? msg : "Success"),
  error: (msg: any) => Alert.alert("Error", typeof msg === 'string' ? msg : "Error")
};
import { queueAchievementUnlock } from '@/components/AchievementUnlockOverlay';
import { useCorrectSound } from '@/hooks/useCorrectSound';
import { schedulePetFeedingReminder } from '@/lib/petNotifications';
import { getRandomMessage } from '@/lib/feedbackMessages';
import ShareToChatModal from '@/components/ShareToChatModal';

const PreGameSpinner = ({ question, onComplete }: { question: any, onComplete: () => void }) => {
    const [isSpinning, setIsSpinning] = useState(true);
    const [displaySubject, setDisplaySubject] = useState("???");
    const [displayDifficulty, setDisplayDifficulty] = useState("???");
    const [displayPoints, setDisplayPoints] = useState("???");

    const subjects = ["Math", "Science", "History", "English", "Physics", "Geography", "Biology", "Coding"];
    const difficulties = ["Easy", "Medium", "Hard", "Legendary", "Nightmare"];
    const pointsList = ["10", "20", "30", "50", "100", "500"];

    const actualDifficulty = question.points >= 50 ? "Legendary" : question.points >= 30 ? "Hard" : question.points >= 20 ? "Medium" : "Easy";
    const actualPoints = question.points?.toString() || "0";
    const actualSubject = question.subject || "General";

    const diffColor = !isSpinning
        ? actualDifficulty === 'Legendary' ? '#facc15'
        : actualDifficulty === 'Hard' ? '#f87171'
        : actualDifficulty === 'Medium' ? '#fb923c'
        : '#4ade80'
        : '#ffffff';

    useEffect(() => {
        let ticks = 0;
        const maxTicks = 20;
        
        const interval = setInterval(() => {
            ticks++;
            // haptics removed
            
            if (ticks < maxTicks - 10) setDisplaySubject(subjects[Math.floor(Math.random() * subjects.length)]);
            else setDisplaySubject(actualSubject);
            
            if (ticks < maxTicks - 5) setDisplayDifficulty(difficulties[Math.floor(Math.random() * difficulties.length)]);
            else setDisplayDifficulty(actualDifficulty);
            
            if (ticks < maxTicks) setDisplayPoints(pointsList[Math.floor(Math.random() * pointsList.length)]);
            else {
                setDisplayPoints(actualPoints);
                setIsSpinning(false);
                clearInterval(interval);
                // haptics removed
            }
        }, 100);
        
        return () => clearInterval(interval);
    }, [actualDifficulty, actualPoints, actualSubject]);

    return (
        <View 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white"
            style={{ background: 'radial-gradient(ellipse at center, #0f0f1a 0%, #000000 100%)' }}
        >
            {/* Subtle animated grain overlay */}
            <View
                animate={{ opacity: [0.03, 0.06, 0.03] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
            />

            {/* Top label */}
            <View
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold tracking-[0.4em] text-white/30 uppercase mb-16"
            >
                Incoming Challenge
            </View>

            {/* Subject row */}
            <View className="text-center mb-10">
                <Text className="text-[11px] font-bold tracking-[0.3em] text-white/30 uppercase mb-2">Subject</Text>
                <View
                    key={displaySubject}
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.08 }}
                    className="text-4xl font-black tracking-tight"
                    style={{ color: !isSpinning ? '#818cf8' : '#ffffff' }}
                >
                    {displaySubject}
                </View>
            </View>

            {/* Thin divider */}
            <View className="w-16 h-px bg-white/10 mb-10" />

            {/* Difficulty row */}
            <View className="text-center mb-10">
                <Text className="text-[11px] font-bold tracking-[0.3em] text-white/30 uppercase mb-2">Difficulty</Text>
                <View
                    key={displayDifficulty}
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.08 }}
                    className="text-4xl font-black tracking-tight"
                    style={{ color: diffColor }}
                >
                    {displayDifficulty}
                </View>
            </View>

            {/* Thin divider */}
            <View className="w-16 h-px bg-white/10 mb-10" />

            {/* Reward row */}
            <View className="text-center">
                <Text className="text-[11px] font-bold tracking-[0.3em] text-white/30 uppercase mb-2">Reward</Text>
                <View
                    key={displayPoints}
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.08 }}
                    className="text-4xl font-black tracking-tight"
                    style={{ color: !isSpinning ? '#4ade80' : '#ffffff' }}
                >
                    {displayPoints} <Text className="text-2xl font-bold opacity-60">PTS</Text>
                </View>
            </View>

            {/* CTA */}
            <>
                {!isSpinning && (
                    <View
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                        onPress={onComplete}
                        className="mt-20 text-black font-black text-base py-4 px-14 rounded-full active:scale-95 transition-transform"
                        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)', letterSpacing: '0.1em' }}
                    >
                        START BATTLE
                    </View>
                )}
            </>
        </View>
    );
};


export default function SolveQuestionClient({ question }: { question: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const challengeId = searchParams.get("challenge");
    const autoAccept = searchParams.get("autoAccept");
    const autoReject = searchParams.get("autoReject");
    const applyWrongAnswerPenalty = question.question_type !== 'match';

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(question.time_limit * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreGame, setShowPreGame] = useState(true);
    const [result, setResult] = useState<{ isCorrect: boolean, newTotal: number, correctOption: number, pointsChange: number, xpGained?: number, newXp?: number, funnyMessage?: string } | null>(null);
    const [startedAt] = useState(() => new Date().toISOString());
    const [showXpBurst, setShowXpBurst] = useState(false);
    const [showWrongFlash, setShowWrongFlash] = useState(false);
    const playCorrect = useCorrectSound();
    
    const [purchasedHint, setPurchasedHint] = useState<string | null>(null);
    const [isPurchasingHint, setIsPurchasingHint] = useState(false);

    const [authChecked, setAuthChecked] = useState(false);
    const [alreadyAttempted, setAlreadyAttempted] = useState<any>(null);
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [recoveredViaCoop, setRecoveredViaCoop] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const [challengeInitiator, setChallengeInitiator] = useState<string | null>(null);
    const [challengePartner, setChallengePartner] = useState<string | null>(null);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);

    const [relatedQuestion, setRelatedQuestion] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        if ((result || alreadyAttempted) && !relatedQuestion && question.subject) {
            const fetchRelated = async () => {
                let query = supabase.from('questions').select('id, title').eq('subject', question.subject).neq('id', question.id).limit(10);
                if (question.class_grade) query = query.eq('class_grade', question.class_grade);
                if (question.chapter) query = query.eq('chapter', question.chapter);
                
                const { data } = await query;
                if (data && data.length > 0) {
                    const randomQ = data[Math.floor(Math.random() * data.length)];
                    setRelatedQuestion(randomQ);
                } else if (question.chapter) {
                    // Fallback to subject level if no other chapter matches
                    const { data: fbData } = await supabase.from('questions').select('id, title').eq('subject', question.subject).neq('id', question.id).limit(5);
                    if (fbData && fbData.length > 0) {
                        setRelatedQuestion(fbData[Math.floor(Math.random() * fbData.length)]);
                    }
                }
            };
            fetchRelated();
        }
    }, [result, alreadyAttempted, question.id, question.subject, question.class_grade, question.chapter, relatedQuestion]);

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
                    .select("initiator_id, partner_id, status")
                    .eq("id", challengeId)
                    .single();
                if (mounted && challengeInfo) {
                    setChallengeInitiator(challengeInfo.initiator_id);
                    setChallengePartner(challengeInfo.partner_id);
                    setChallengeStatus(challengeInfo.status);
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

            // Check if user already won this question via co-op
            const { data: wonCoop } = await supabase
                .from("coop_challenges")
                .select("id")
                .eq("initiator_id", user.id)
                .eq("question_id", question.id)
                .eq("status", "won")
                .limit(1)
                .maybeSingle();

            if (mounted) {
                if (data || challengeId) {
                    if (data) setAlreadyAttempted(data);
                    setShowPreGame(false);
                }
                if (wonCoop) setRecoveredViaCoop(true);
                setCurrentUserId(user.id);
                setAuthChecked(true);

                // Auto-accept challenge if tapped from Android Notification
                if (autoAccept === "1" && challengeId && challengeInfo?.status === "pending" && challengeInfo?.partner_id === user.id) {
                    fetch(`/api/coop/${challengeId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session?.access_token || ''}`
                        },
                        body: JSON.stringify({ action: 'accept' })
                    }).then(() => {
                        setChallengeStatus('active');
                        toast.success("Challenge accepted! Good luck.");
                    }).catch(() => {});
                }

                // Auto-reject challenge if tapped from Android Notification
                if (autoReject === "1" && challengeId && challengeInfo?.status === "pending" && challengeInfo?.partner_id === user.id) {
                    fetch(`/api/coop/${challengeId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session?.access_token || ''}`
                        },
                        body: JSON.stringify({ action: 'reject' })
                    }).then(() => {
                        toast.error("Challenge declined.");
                        if (mounted) router.push('/notifications');
                    }).catch(() => {});
                }
            }
        };
        checkAuthAndAttempt();
        return () => { mounted = false; };
    }, [question.id, router, challengeId, autoAccept, autoReject]);

    const publicUrl = question.image_url || (question.image_path ? supabase.storage.from("question-images").getPublicUrl(question.image_path).data.publicUrl : null);

    const handleSubmit = useCallback(async (forcedOption?: number | null, forcedIsCorrect?: boolean) => {
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
                    isCorrect: forcedIsCorrect,
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

            data.funnyMessage = getRandomMessage(data.isCorrect);

            setResult(data);

            // 🔥 Fire global streak toast when daily goal is completed
            if (data?.streak?.streakEarnedToday) {
                window.dispatchEvent(new CustomEvent('streak_earned', {
                    detail: { streak: data.streak.current }
                }));
            }

            // 🆙 Level-up celebration — show after a short delay so confetti fires first
            if (data.leveledUp && data.newLevel) {
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('level_up', { detail: { level: data.newLevel } }));
                }, data.isCorrect ? 1200 : 400);
            }

            // EXTREME VISUAL GRATIFICATION: Confetti & Rank up Toast
            if (data.isCorrect) {
                try {
                    // Schedule Pet Notification for Android
                    supabase.auth.getUser().then(({ data: { user } }) => {
                        if (user) {
                            schedulePetFeedingReminder(user.user_metadata?.pet_name || 'your pet');
                        }
                    });

                    // 🔊 Play correct-answer sound (native on Android, web fallback)
                    playCorrect();

                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
                    });
                    
                    toast.success(
                        (t) => (
                          <View className="flex flex-col gap-1">
                            <Text className="font-black text-lg">Epic Solve! 🔥</Text>
                            <Text className="text-sm font-medium opacity-90">You just ranked up on the global leaderboard. Keep dominating!</Text>
                          </View>
                        ),
                        { duration: 5000 }
                    );

                    // XP burst animation
                    if (data.xpGained && data.xpGained > 0) {
                        setShowXpBurst(true);
                        setTimeout(() => setShowXpBurst(false), 1800);
                    }

                    // haptics removed
                } catch (e) {
                    // Ignore haptics/confetti errors on unsupported devices
                }
            } else {
                // ── Wrong answer: red flash overlay ──
                setShowWrongFlash(true);
                setTimeout(() => setShowWrongFlash(false), 700);
            }

            // ── Check achievement thresholds (lifetime totals) ──
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const meta = user.user_metadata || {};
                    const attempts = Number(meta.battlesAttempted) || 0;

                    if (attempts >= 1)  queueAchievementUnlock('first_victory');
                    if (attempts >= 20) queueAchievementUnlock('final_boss');

                    // Duel Hero: count real 1v1 duel wins
                    const { count: duelWins } = await supabase
                        .from('duel_challenges')
                        .select('*', { count: 'exact', head: true })
                        .eq('winner_id', user.id)
                        .eq('status', 'completed');
                    if ((duelWins ?? 0) >= 5) queueAchievementUnlock('duel_hero');
                }
            } catch { /* non-fatal */ }

            if (question.subject) {
                 const timeTaken = Math.max(0, question.time_limit * 60 - timeLeft);
                 await ActivityTracker.trackSolve(
                    question.subject, 
                    data.isCorrect, 
                    [question.difficulty, `Class ${question.class_grade}`].filter(Boolean) as string[],
                    timeTaken
                 );
                 // Every solve syncs to cloud for persistence
                 ActivityTracker.syncToCloud();
            }
            
            // Vibrate phone on wrong answer if on mobile
            if (data && !data.isCorrect) {
                 if (typeof navigator !== 'undefined' && navigator.vibrate) {
                     navigator.vibrate([200, 100, 200]);
                 }
            }
        } catch (err: any) {
            alert("Network error: " + err.message);
            setIsSubmitting(false);
        }
    }, [isSubmitting, result, selectedOption, startedAt, question, timeLeft, challengeId]);

    // Timer effect
    useEffect(() => {
        if (!authChecked || alreadyAttempted || result || isSubmitting || showPreGame) return;

        if (timeLeft <= 0) {
            handleSubmit(selectedOption);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, authChecked, alreadyAttempted, result, isSubmitting, handleSubmit, selectedOption]);

    // Urgent time pressure effects (Heartbeat Haptics)
    useEffect(() => {
        if (!authChecked || alreadyAttempted || result || isSubmitting || showPreGame) return;
        
        if (timeLeft <= 10 && timeLeft > 0) {
        }
    }, [timeLeft, authChecked, alreadyAttempted, result, isSubmitting]);

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

    const handlePurchaseHint = async () => {
        if (isPurchasingHint) return;
        setIsPurchasingHint(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch("/api/solve/hint", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ questionId: question.id }),
            });
            const data = await res.json();
            if (res.ok) {
                setPurchasedHint(data.hint);
                toast.success("Hint purchased for 1 point!");
            } else {
                toast.error(data.error || "Failed to purchase hint.");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setIsPurchasingHint(false);
        }
    };

    const renderTeacherProfile = () => {
        const tLink = question.teacherUsername ? `/teacher/${question.teacherUsername}` : "#";
        return (
            <View className="flex items-center gap-4 p-4 mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex-row">
                <a href={tLink} className="relative block shrink-0">
                    {question.teacherAvatar ? (
                        <Image src={question.teacherAvatar} alt="Teacher" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                    ) : (
                        <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm flex-row">
                            {String(question.teacherName?.[0] || 'T').toUpperCase()}
                        </View>
                    )}
                </a>
                <View className="flex flex-col">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Posted By</Text>
                    <a href={tLink} className="font-bold flex items-center text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-row">
                        {question.teacherName || "Verified Teacher"}
                        <TeacherBadge />
                    </a>
                </View>
            </View>
        );
    };

    if (!authChecked) {
        return (
            <View className="flex flex-col items-center justify-center p-20 text-slate-400 dark:text-slate-500 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <Text className="font-medium animate-pulse">Loading battle arena...</Text>
            </View>
        );
    }

    // If user is the PARTNER in a pending/active challenge, always let them solve
    // even if they have attempted this question before (that was their own attempt, not the coop one)
    const isCoopPartner = !!(challengeId && challengePartner && currentUserId && challengePartner === currentUserId);
    const challengeIsOpen = challengeStatus === 'pending' || challengeStatus === 'active';

    // Any participant visited their challenge link and already attempted it — show spectator screen
    // Exception: the partner gets to solve regardless (that's the whole point!)
    if (alreadyAttempted && challengeId && !(isCoopPartner && challengeIsOpen)) {
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
            <View className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in-95 relative overflow-hidden">
                <View className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 dark:bg-slate-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <View className="flex justify-center flex-row">
                    {alreadyAttempted.is_correct ? (
                        <View className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center flex-row">
                            <CheckCircle2 className="w-10 h-10" />
                        </View>
                    ) : (
                        <View className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center flex-row">
                            <XCircle className="w-10 h-10" />
                        </View>
                    )}
                </View>
                <Text className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    You have already attempted this question.
                </Text>

                <Text className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Your answer was <Text className="font-bold">{alreadyAttempted.is_correct ? "Correct" : "Incorrect"}</Text>.
                </Text>
                <View className="pt-6 flex flex-col gap-3 max-w-sm mx-auto">
                    {recoveredViaCoop && (
                        <View className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-2 text-sm text-emerald-800 text-left relative overflow-hidden">
                            <View className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
                            <Text className="font-bold flex items-center gap-1.5 mb-1 flex-row"><Trophy className="w-4 h-4 text-amber-500" /> Points Recovered!</Text>
                            You tagged a friend and they solved this correctly for you! You both split the points.
                        </View>
                    )}

                    {!alreadyAttempted.is_correct && !challengeId && !recoveredViaCoop && (
                        <View className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-2xl mb-2 text-sm text-indigo-800 dark:text-indigo-300 text-left">
                            <Text className="font-bold flex items-center gap-1.5 mb-1 flex-row"><Users className="w-4 h-4" /> Co-op Recovery Available!</Text>
                            You can't retry this alone, but if you tag a friend and they solve it correctly, you'll both split the points!
                        </View>
                    )}

                    {!alreadyAttempted.is_correct && !challengeId && !recoveredViaCoop && (
                        <View
                            onPress={() => setIsChallengeModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20 mb-3 flex-row"
                        >
                            <Users className="w-5 h-5" />
                            Ask for Help
                        </View>
                    )}
                    
                    {/* Related Question CTA */}
                    {relatedQuestion && (
                        <View
                            onPress={() => router.push(`/questions/${relatedQuestion.id}`)}
                            className="w-full flex flex-col items-center justify-center bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 dark:shadow-emerald-500/20 mb-3"
                        >
                            <View className="flex items-center gap-2 text-lg flex-row">
                                Skip to Next <ArrowRight className="w-5 h-5" />
                            </View>
                            <View className="text-emerald-100 text-sm font-medium mt-1 opacity-90 text-center line-clamp-1 max-w-[280px]">
                                Next: {relatedQuestion.title}
                            </View>
                        </View>
                    )}
                    
                    <View
                        onPress={() => router.push("/")}
                        className={`w-full ${!relatedQuestion && alreadyAttempted.is_correct ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border'} font-bold px-8 py-3.5 rounded-xl transition`}
                    >
                        Back to Dashboard
                    </View>
                </View>

                {/* Help Request Modal */}
                {currentUserId && (
                    <ChallengeFriendModal
                        isOpen={isChallengeModalOpen}
                        onClose={() => setIsChallengeModalOpen(false)}
                        questionId={question.id}
                        currentUserId={currentUserId}
                    />
                )}
            </View>
        );
    }

    if (result) {
        return (
            <View className="relative">

            {/* ── Red flash overlay (wrong answer) ── */}
            <>
                {showWrongFlash && (
                    <View
                        key="wrong-flash"
                        className="fixed inset-0 z-[9998] pointer-events-none bg-red-500"
                        initial={{ opacity: 0.45 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                    />
                )}
            </>

            {/* ── Floating -N pts burst (sinks from centre, wrong answer) ── */}
            <>
                {!result.isCorrect && result.pointsChange !== 0 && (
                    <View
                        key="pts-drop"
                        className="fixed z-[9999] left-1/2 -translate-x-1/2 pointer-events-none"
                        initial={{ y: 0, opacity: 1, scale: 0.7 }}
                        animate={{ y: 80, opacity: 0, scale: 1.1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{ top: '42%' }}
                    >
                        <View className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-lg px-5 py-2.5 rounded-2xl shadow-2xl shadow-red-500/40 flex-row">
                            <XCircle className="w-5 h-5" />
                            {result.pointsChange} pts
                        </View>
                        {/* Smoke dots */}
                        <View
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full"
                            animate={{ scale: [1, 1.6, 0], opacity: [1, 0.6, 0] }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                        />
                        <View
                            className="absolute -bottom-1 -left-1 w-2 h-2 bg-rose-400 rounded-full"
                            animate={{ scale: [1, 1.8, 0], opacity: [1, 0.6, 0] }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        />
                    </View>
                )}
            </>

            {/* ── Floating +XP burst (fixed overlay, rises from bottom-centre) ── */}
            <>
                {showXpBurst && result.xpGained && result.xpGained > 0 && (
                    <View
                        key="xp-burst"
                        className="fixed z-[9999] left-1/2 -translate-x-1/2 pointer-events-none"
                        initial={{ y: 0, opacity: 1, scale: 0.6, bottom: '40%' }}
                        animate={{ y: -120, opacity: 0, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ bottom: '40%' }}
                    >
                        <View className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-lg px-5 py-2.5 rounded-2xl shadow-2xl shadow-indigo-500/40 flex-row">
                            <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                            +{result.xpGained} XP
                        </View>
                        {/* Sparkle dots */}
                        <View
                            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                            animate={{ scale: [1, 1.6, 0], opacity: [1, 1, 0] }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                        />
                        <View
                            className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full"
                            animate={{ scale: [1, 1.6, 0], opacity: [1, 1, 0] }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        />
                    </View>
                )}
            </>

            <View className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in-95">
                <View className="flex justify-center flex-row">
                    {result.isCorrect ? (
                        <View className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center flex-row">
                            <CheckCircle2 className="w-10 h-10" />
                        </View>
                    ) : (
                        <View
                            className="relative flex items-center justify-center flex-row"
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        >
                            {/* Pulsing red glow ring */}
                            <View
                                className="absolute w-28 h-28 rounded-full bg-red-400/30"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 1.4, repeat: 2, ease: 'easeInOut' }}
                            />
                            {/* Shake + icon */}
                            <View
                                className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center relative z-10 flex-row"
                                animate={{ x: [0, -10, 10, -8, 8, -5, 5, 0] }}
                                transition={{ duration: 0.55, delay: 0.05, ease: 'easeInOut' }}
                            >
                                <XCircle className="w-10 h-10" />
                            </View>
                        </View>
                    )}
                </View>
                <Text className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    {result.isCorrect ? "Correct!" : "Incorrect!"}
                </Text>

                <Text className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4">
                    {result.isCorrect
                        ? `Brilliant job! You earned ${result.pointsChange} points.`
                        : `Keep learning! You lost ${Math.abs(result.pointsChange)} points.`
                    }
                </Text>

                {result.funnyMessage && (
                    <View
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 15,
                            delay: 0.4
                        }}
                        className={`mx-auto max-w-sm p-4 rounded-2xl border-2 shadow-lg relative ${result.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300'}`}
                    >
                        <View className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl drop-shadow-md">
                            {result.isCorrect ? '🔥' : '💀'}
                        </View>
                        <Text className="block font-bold text-base mt-1">
                            "{result.funnyMessage}"
                        </Text>
                    </View>
                )}

                <View className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl inline-block w-full max-w-sm border border-slate-200 dark:border-slate-700">
                    <View className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Points</View>
                    <View className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{result.newTotal}</View>
                    {/* XP earned badge */}
                    {result.isCorrect && result.xpGained && result.xpGained > 0 && (
                        <View
                            initial={{ opacity: 0, scale: 0.7, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
                            className="mt-3 flex items-center justify-center gap-1.5 flex-row"
                        >
                            <View className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-indigo-400/30 flex-row">
                                <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                                +{result.xpGained} XP earned
                            </View>
                        </View>
                    )}
                </View>

                {/* MCQ Feedback */}
                {!result.isCorrect && question.question_type !== 'match' && question.options && result.correctOption !== undefined && result.correctOption !== null && (
                    <View className="mt-6 w-full max-w-md mx-auto text-left space-y-2">
                        <View className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center">Let's review the options:</View>
                        <View className="flex flex-col gap-2">
                            {question.options.map((opt: string, idx: number) => {
                                const isCorrectOpt = idx === result.correctOption;
                                const isSelectedOpt = idx === selectedOption;
                                
                                let style = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"; // neutral
                                if (isCorrectOpt) {
                                    style = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-medium";
                                } else if (isSelectedOpt) {
                                    style = "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 font-medium";
                                }
                                
                                return (
                                    <View key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${style}`}>
                                        <View className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrectOpt ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200' : isSelectedOpt ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </View>
                                        <Text className="text-sm">{opt}</Text>
                                        {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                                        {isSelectedOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Match the Following Feedback */}
                {!result.isCorrect && question.question_type === 'match' && question.matchPairs && (
                    <View className="mt-6 w-full max-w-md mx-auto text-left space-y-2">
                        <View className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center">The correct matches were:</View>
                        <View className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            {question.matchPairs.map((pair: any, idx: number) => (
                                <View key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex-row">
                                    <Text className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-right flex-row">{pair.left}</Text>
                                    <View className="shrink-0 text-emerald-500">
                                        <ArrowRight className="w-4 h-4" />
                                    </View>
                                    <Text className="flex-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-left flex-row">{pair.right}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Explanation */}
                {result.explanation && !result.isCorrect && (
                    <View className="mt-6 w-full max-w-md mx-auto text-left space-y-2">
                        <View className="text-sm font-bold text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wider text-center">Explanation</View>
                        <View className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {result.explanation}
                        </View>
                    </View>
                )}

                <View className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 max-w-md mx-auto">
                    {!reviewSubmitted ? (
                        <View className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <Text className="font-bold text-slate-800 dark:text-slate-100 mb-2">Rate this Question</Text>
                            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-4">Help us identify the best content from our teachers.</Text>
                            <View className="flex justify-center gap-2 mb-4 flex-row">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <View
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onPress={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${(hoverRating || rating) >= star
                                                ? "fill-amber-400 text-amber-400"
                                                : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"
                                                }`}
                                        />
                                    </View>
                                ))}
                            </View>
                            <View
                                onPress={handleReviewSubmit}
                                disabled={rating === 0}
                                className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-row"
                            >
                                <Send className="w-4 h-4" /> Submit Rating
                            </View>
                        </View>
                    ) : (
                        <View className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 font-medium flex items-center justify-center gap-2 flex-row">
                            <CheckCircle2 className="w-5 h-5" /> Thanks for your feedback!
                        </View>
                    )}

                    <View className="mt-6 flex flex-col gap-3">
                        {/* Co-op / Help Button */}
                        {!result.isCorrect && (
                            <View
                                onPress={() => setIsChallengeModalOpen(true)}
                                className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20 flex-row"
                            >
                                <Users className="w-5 h-5" />
                                Ask for Help
                            </View>
                        )}
                        
                        {/* Related Question CTA */}
                        {relatedQuestion && (
                            <View
                                onPress={() => router.push(`/questions/${relatedQuestion.id}`)}
                                className="w-full flex flex-col items-center justify-center bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 dark:shadow-emerald-500/20"
                            >
                                <View className="flex items-center gap-2 text-lg flex-row">
                                    Continue Learning <ArrowRight className="w-5 h-5" />
                                </View>
                                <View className="text-emerald-100 text-sm font-medium mt-1 opacity-90 text-center line-clamp-1 max-w-[280px]">
                                    Next: {relatedQuestion.title}
                                </View>
                            </View>
                        )}
                        
                        <View
                            onPress={() => router.push("/")}
                            className={`w-full ${!relatedQuestion && result.isCorrect ? 'bg-slate-900 dark:bg-slate-100 border-transparent text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'} font-bold px-8 py-3.5 rounded-xl border transition`}
                        >
                            Back to Dashboard
                        </View>
                    </View>
                </View>

                {/* Challenge Modal */}
                {currentUserId && (
                    <ChallengeFriendModal
                        isOpen={isChallengeModalOpen}
                        onClose={() => setIsChallengeModalOpen(false)}
                        questionId={question.id}
                        currentUserId={currentUserId}
                    />
                )}
            </View>
            </View>
        );
    }

    return (
        <View className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5">
            <>
                {showPreGame && authChecked && !alreadyAttempted && !challengeId && (
                    <PreGameSpinner 
                        question={question} 
                        onComplete={() => setShowPreGame(false)} 
                    />
                )}
            </>

            {/* Urgent Time Pressure Overlay */}
            <>
                {timeLeft <= 10 && !result && !isSubmitting && (
                    <View
                        key="time-pressure"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-b from-transparent via-red-500/10 to-red-600/30 dark:via-red-900/20 dark:to-red-900/50"
                    />
                )}
            </>

            {challengeId && (
                <CoopChallengeHeader
                    challengeId={challengeId}
                    questionPoints={question.points || 0}
                    currentUserId={currentUserId}
                />
            )}

            {/* Top Bar: Timer & Points */}
            <View className="flex items-center justify-between bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm sticky top-4 z-40 flex-row">
                <View className="flex items-center gap-3 flex-row">
                    <View onPress={() => router.back()} className="lg:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                    </View>
                    <View className={`flex items-center gap-2 font-mono text-lg font-medium px-4 py-1.5 rounded-full ${timeLeft <= 30 ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'bg-gray-100/80 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300'}`}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </View>
                </View>

                <View className="flex items-center gap-2 flex-row">
                    {/* Penalty Badge */}
                    <View className="hidden sm:flex items-center gap-1 text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-xs font-medium cursor-help flex-row" title="Penalty if answered incorrectly">
                        <Text>{applyWrongAnswerPenalty ? "-1 pts if wrong" : "No penalty if wrong"}</Text>
                    </View>

                    {/* Reward Badge */}
                    <View className="flex items-center gap-1.5 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition-transform hover:scale-105 cursor-help flex-row" title="Reward if correct">
                        <Text className="font-semibold">{question.points || 0} points</Text>
                    </View>

                    {/* Share Button */}
                    <View
                        onPress={() => setShowShareModal(true)}
                        className="p-2 ml-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Share Question"
                    >
                        <Send className="w-4 h-4 -mt-0.5 ml-[-1px]" />
                    </View>
                </View>
            </View>

            {applyWrongAnswerPenalty && (
                <View className="mt-3 mb-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-300">
                    ⚠️ Negative marking is active: -1 point will be deducted if you answer incorrectly.
                </View>
            )}

            {/* Main Card */}
            <View className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-12 shadow-sm border border-gray-200 dark:border-slate-800 relative overflow-hidden">
                    {renderTeacherProfile()}

                    <View className="mb-8 flex flex-wrap gap-2 flex-row">
                        {question.class_grade && (
                            <Text className="bg-gray-100/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium tracking-wide">Class {question.class_grade}</Text>
                        )}
                        {question.subject && (
                            <Text className="bg-gray-100/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium tracking-wide">{question.subject}</Text>
                        )}
                        {question.chapter && (
                            <Text className="bg-indigo-100/80 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                                📖 {question.chapter}
                            </Text>
                        )}
                        {question.difficulty && (
                            <Text className={`px-3 py-1 rounded-full text-xs font-medium capitalize tracking-wide border ${question.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-100/80 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : question.difficulty?.toLowerCase() === 'hard' ? 'bg-red-100/80 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-gray-100/80 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300'}`}>
                                {question.difficulty}
                            </Text>
                        )}
                    </View>

                    <Text className="text-2xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed tracking-tight">
                        {question.title}
                    </Text>

                    {question.body && (
                        <Text className="text-gray-600 dark:text-slate-300 leading-relaxed text-lg sm:text-xl mb-10 whitespace-pre-wrap font-light">
                            {question.body}
                        </Text>
                    )}

                    {publicUrl && (
                        <View className="mb-12 rounded-[1.5rem] overflow-hidden bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-center p-6 border border-gray-100 dark:border-slate-800 flex-row">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <Image src={publicUrl} alt="Question Attachment" className="max-h-[400px] object-contain rounded-xl drop-shadow-sm" />
                        </View>
                    )}

                    {/* Hint Section */}
                    {question.hasHint && !result && (
                        <View className="mb-8">
                            {!purchasedHint ? (
                                <View
                                    onPress={handlePurchaseHint}
                                    disabled={isPurchasingHint}
                                    className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex-row"
                                >
                                    <Star className="w-4 h-4" />
                                    {isPurchasingHint ? "Purchasing..." : "Purchase Hint (1 pt)"}
                                </View>
                            ) : (
                                <View className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-medium">
                                    <Text className="block mb-1 text-amber-600">💡 Hint:</Text>
                                    {purchasedHint}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Options or Match Arena */}
                    {question.question_type === 'match' ? (
                        <View className="mt-8">
                            <MatchArena 
                                question={question} 
                                disabled={isSubmitting || !!result}
                                onAttempt={(isCorrect) => handleSubmit(-1, isCorrect)} 
                            />
                        </View>
                    ) : question.options && question.options.length > 0 ? (
                        <View className="grid gap-3 mt-8">
                            {question.options.map((opt: string, idx: number) => {
                                const isSelected = selectedOption === idx;
                                return (
                                    <View
                                        key={idx}
                                        onPress={() => setSelectedOption(idx)}
                                        className={`relative p-5 sm:p-6 text-left rounded-2xl border transition-all duration-200 flex items-center gap-4 group ${isSelected
                                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 ring-1 ring-blue-500 z-10"
                                            : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50/80 dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300"
                                            }`}
                                    >
                                        <View className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </View>
                                        <Text className={`text-base sm:text-lg transition-colors ${isSelected ? "text-blue-900 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-slate-300"}`}>{opt}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    {/* Submit Button for normal questions */}
                    {question.question_type !== 'match' && (
                        <View className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end flex-row">
                            <View
                                onPress={() => handleSubmit()}
                                disabled={selectedOption === null || isSubmitting}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500 text-white font-medium text-lg px-10 py-4 rounded-full transition-all w-full sm:w-auto justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex-row"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Answer"}
                            </View>
                        </View>
                    )}
                </View>
        </View>
    );
}
