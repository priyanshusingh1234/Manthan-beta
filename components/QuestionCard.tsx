"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import {
  Clock,
  Play,
  Zap,
  Share2,
  MoreHorizontal,
  Trash2,
  Users,
  FileImage,
  CheckCircle,
  Eye,
  Swords,
  Bookmark
} from "lucide-react";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import TeacherBadge from "@/ticks/teacher";
import { supabase } from "@/lib/supabaseClient";
import DuelChallengeModal from "@/components/DuelChallengeModal";

type Question = {
  id: string;
  title: string;
  body?: string | null;
  subject?: string | null;
  chapter?: string | null;
  classGrade?: string | null;
  points?: number | null;
  timeLimit?: number | null;
  difficulty?: string | null;
  options?: string[] | null;
  correctOption?: number | null;
  questionType?: string;
  matchPairs?: { left: string, right: string }[] | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdByAvatar?: string | null;
  createdByUsername?: string | null;
  totalAttempts?: number;
  solvedCount?: number;
  hasAttempted?: boolean;
  hasWrittenSubmission?: boolean;
  userSubmissionId?: string | null;
  isSaved?: boolean;
};

// Module-level avatar cache so re-renders and multiple cards for the same
// teacher don't each fire a separate Supabase query.
const avatarCache: Record<string, string | null> = {};

// Resilient avatar component — queries profiles table directly when API returns null,
// uses Next.js <Image> (routed through the Next.js image optimizer on the server)
// so ISP blocks on the raw Supabase domain are bypassed — same reason
// TeacherProfile shows avatars correctly while plain <img> fails.
function AvatarImage({
  src,
  name,
  userId,
}: {
  src: string | null | undefined;
  name: string | null | undefined;
  userId: string | null | undefined;
}) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(src || null);
  const [failed, setFailed] = useState(false);
  const initials = String((name || "T").split(" ").map((s) => s[0]).join("")).slice(0, 2).toUpperCase();

  // If API-provided src is null or this is the current user, try to resolve from DB/Cache
  useEffect(() => {
    let mounted = true;

    const resolveAvatar = async () => {
      // 1. Check if this is the current user and we have a local cache
      if (typeof window !== 'undefined' && userId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id === userId) {
            const cached = localStorage.getItem('dheeyudha_user_meta_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.avatar_url && !parsed.avatar_url.includes('googleusercontent')) {
                if (mounted) {
                  setResolvedSrc(parsed.avatar_url);
                  setFailed(false);
                  return;
                }
              }
            }
          }
        } catch { /* ignore */ }
      }

      // 2. If we have a direct src, use it as fallback
      if (src) {
        if (mounted) {
          setResolvedSrc(src);
          setFailed(false);
        }
        return;
      }

      // 3. Otherwise, check global memory cache or fetch from DB
      if (!userId) return;
      if (userId in avatarCache) {
        if (mounted) setResolvedSrc(avatarCache[userId]);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (!mounted) return;

      const raw = data?.avatar_url || null;
      const isGoogle = (u: string | null) => !!u && u.includes('googleusercontent.com');
      const url = raw && !isGoogle(raw) ? raw : null;
      avatarCache[userId] = url;
      setResolvedSrc(url);
    };

    resolveAvatar();

    const handleUpdate = () => {
      // Clear cache and re-resolve
      if (userId) delete avatarCache[userId];
      resolveAvatar();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('user_metadata_updated', handleUpdate);
      window.addEventListener('storage', (e) => {
        if (e.key === 'dheeyudha_user_meta_cache') handleUpdate();
      });
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('user_metadata_updated', handleUpdate);
      }
    };
  }, [src, userId]);

  const fallback = (
    <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm transition-all">
      {initials}
    </div>
  );

  if (!resolvedSrc || failed) return fallback;

  // Use Next.js <Image> so the request is proxied through the Next.js image
  // optimizer (/_next/image?url=...) — bypasses ISP blocks on the supabase domain.
  return (
    <NextImage
      src={resolvedSrc}
      alt={name || "Teacher"}
      width={44}
      height={44}
      onError={() => setFailed(true)}
      className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm transition-all"
      unoptimized={false}
    />
  );
}

export default function QuestionCard({ q }: { q: Question }) {
  const router = useRouter();
  // Initialise user synchronously from cached session to avoid button flicker
  const [user, setUser] = useState<any | null | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      // Supabase stores the session in localStorage — read it synchronously
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (keys.length) {
        const session = JSON.parse(localStorage.getItem(keys[0]) || 'null');
        return session?.user ?? null;
      }
    } catch {}
    return null; // assume logged out, will correct async below
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [duelOpen, setDuelOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(q.isSaved || false);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    // Always do async verification to ensure user data is fresh
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!mounted) return;
      if (error) console.error("QuestionCard Auth Error:", error.message);
      setUser(user || null);
    }).catch((err) => {
      console.error("Auth Exception:", err);
      if (mounted) setUser(null);
    });

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      mounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSave = async () => {
    if (!user || isSaving) return;
    
    // Optimistic UI update
    const previousState = isSaved;
    setIsSaved(!previousState);
    setIsSaving(true);
    
    try {
      if (previousState) {
        const { error } = await supabase.from('saved_questions')
          .delete()
          .eq('question_id', q.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_questions')
          .insert({ question_id: q.id, user_id: user.id });
        if (error) throw error;
      }
    } catch (e) {
      console.error('Failed to toggle save', e);
      // Revert on failure
      setIsSaved(previousState);
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = user && (user.id === q.createdBy);
  const isTeacher = !!user?.user_metadata?.isTeacher;

  // Fix: Use Supabase client to generate the public URL correctly
  const getPublicUrl = () => {
    if (q.imageUrl) return q.imageUrl; // Direct URL
    if (q.imagePath) {
      const { data } = supabase.storage.from('question-images').getPublicUrl(q.imagePath);
      return data.publicUrl;
    }
    return null;
  };

  const publicUrl = getPublicUrl();

  // Link to teacher profile: always use username, never expose UUID
  const teacherProfileLink = q.createdByUsername
    ? `/teacher/${q.createdByUsername}`
    : "/profile";

  // Helper for difficulty color (Tactical Badge Style)
  const difficultyColor = (difficulty?: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-emerald-100/80 text-emerald-700 border-emerald-200";
      case "medium":
      case "moderate":
        return "bg-amber-100/80 text-amber-700 border-amber-200";
      case "hard":
        return "bg-red-100/80 text-red-700 border-red-200";
      default:
        return "bg-slate-100/80 text-slate-600 border-slate-200";
    }
  };

  // Format date
  const formattedDate = q.createdAt
    ? new Date(q.createdAt).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    })
    : "";

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/questions/${q.id}`;
    const shareTitle = q.title || "Dheeyudha Question";
    const shareText = `Try this ${q.subject || ""} question on Dheeyudha`;
    const sharePayload = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    try {
      // 1. Capacitor Native Sharing (for official Android/iOS apps)
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          ...sharePayload,
          dialogTitle: "Share this question",
        });
        return;
      }

      // 2. Web Share API (for mobile browsers like Chrome on Android)
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      // 3. Fallback: Clipboard (for desktop browsers)
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Question link copied");
        return;
      }

      window.prompt("Copy this question link", shareUrl);
    } catch {
      // User cancel or unavailable share target; keep UX silent.
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/questions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: q.id, imagePath: q.imagePath }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      // Immediate UI update
      setIsDeleted(true);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      // If it's already gone, just hide it
      if (err.message?.toLowerCase().includes("not found")) {
        setIsDeleted(true);
        router.refresh();
      } else {
        alert(err.message || "Failed to delete question");
      }
    } finally {
      setIsDeleting(false);
      setMenuOpen(false);
    }
  };

  if (isDeleted) return null;

  if (isDeleting) {
    return (
      <div className="w-full max-w-2xl h-48 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Deleting...</span>
      </div>
    );
  }

  return (
    <>
    <article className="group relative w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 transition-all duration-300 overflow-visible ring-1 ring-slate-200/50 dark:ring-slate-800/50 hover:ring-blue-500/30 dark:hover:ring-blue-500/30">

      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-fuchsia-500/10 dark:from-blue-500/20 dark:to-fuchsia-500/20 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />

      {/* CARD HEADER: Author & Bounty */}
      <div className="relative flex items-center justify-between p-3.5 sm:p-4 pb-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar */}
          <Link href={teacherProfileLink} className="shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-fuchsia-500 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity" />
            <AvatarImage src={q.createdByAvatar} name={q.createdByName} userId={q.createdBy} />
          </Link>

          {/* Name + Verified Tick */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={teacherProfileLink} className="hover:underline decoration-blue-500/30 underline-offset-2 truncate">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight truncate">{q.createdByName || "Teacher"}</h3>
              </Link>
              <TeacherBadge />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-medium whitespace-nowrap">{q.subject || 'General'}</span>
              {q.chapter && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="whitespace-nowrap text-indigo-500 dark:text-indigo-400 font-bold">{q.chapter}</span>
                </>
              )}
              {q.classGrade && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="whitespace-nowrap">Class {q.classGrade}</span>
                </>
              )}
              {formattedDate && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline whitespace-nowrap">{formattedDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Options/Menu for Owner */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Question
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARD BODY: The Challenge */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">

        {/* Title & Tags */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Match The Following Badge */}
            {q.questionType === 'match' && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 sm:w-3 sm:h-3"><path d="M12 3v18"/><path d="M3 8h6"/><path d="M3 16h6"/><path d="M15 8h6"/><path d="M15 16h6"/></svg>
                Match
              </span>
            )}
            {/* Written Answer badge for high-point questions */}
            {(q.points ?? 0) > 15 && q.questionType !== 'match' && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-violet-100/80 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                <FileImage className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Written
              </span>
            )}
            {q.difficulty && (
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${difficultyColor(q.difficulty)}`}>
                {q.difficulty}
              </span>
            )}
            {q.timeLimit && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {q.timeLimit}m
              </span>
            )}
            {(q.totalAttempts !== undefined && q.totalAttempts > 0) && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-50/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" title={`${q.solvedCount} students solved this successfully`}>
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">{q.solvedCount} Solved</span>
                <span className="sm:hidden">{q.solvedCount}</span>
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {q.title}
          </h2>
        </div>

        {/* Question Text */}
        {q.body && (
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
            {q.body}
          </p>
        )}

        {/* Image Attachment */}
        {publicUrl && (
          <div className="group/image relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity" />
            <div className="flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl}
                alt="Attachment"
                className="w-full max-h-60 object-contain rounded-lg shadow-sm"
                loading="lazy"
              />
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider opacity-0 group-hover/image:opacity-100 transition-opacity">
              Attachment
            </div>
          </div>
        )}

        {/* Match the Following Preview */}
        {q.questionType === 'match' && q.matchPairs && q.matchPairs.length > 0 && (
          <div className="mt-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/80 p-3 sm:p-4">
            <div className="flex items-stretch justify-between gap-4 relative">
              {/* Left Column Preview */}
              <div className="flex-1 space-y-2 relative z-10">
                {q.matchPairs.slice(0, 3).map((pair, idx) => (
                  <div key={`left-${idx}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center shadow-sm relative">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{pair.left}</span>
                    <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 -translate-y-1/2" />
                  </div>
                ))}
              </div>

              {/* Center Decorative Dashed Lines */}
              <div className="w-12 sm:w-16 flex flex-col justify-around items-center opacity-30 dark:opacity-20">
                 <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
                    <path d="M 0 15 C 30 15, 30 50, 60 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-indigo-500" />
                    <path d="M 0 50 C 30 50, 30 15, 60 15" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-indigo-500" />
                 </svg>
              </div>

              {/* Right Column Preview */}
              <div className="flex-1 space-y-2 relative z-10">
                {/* We just slice the first 3 items but reversed to show they are shuffled */}
                {q.matchPairs.slice(0, 3).reverse().map((pair, idx) => (
                  <div key={`right-${idx}`} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center shadow-sm relative">
                    <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 rounded-full bg-indigo-400 -translate-y-1/2" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{pair.right}</span>
                  </div>
                ))}
              </div>
            </div>
            {q.matchPairs.length > 3 && (
              <div className="mt-2 text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">
                +{q.matchPairs.length - 3} more pairs to match
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARD FOOTER: Action Bar */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 sm:pt-2 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bounty Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-900 dark:text-amber-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-100/80 dark:border-amber-900/50 shadow-sm shrink-0">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-1 rounded-full">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 text-amber-500 dark:text-amber-400" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold">{q.points ?? 0} <span className="opacity-70 font-normal ml-0.5 hidden sm:inline">Points</span></span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider"
            aria-label="Share question"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={toggleSave}
            disabled={!user}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              isSaved 
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40' 
                : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
            aria-label={isSaved ? "Unsave question" : "Save question"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
          </button>

          {/* ⚔️ Duel button — students only, MCQ only */}
          {user && !isTeacher && Array.isArray(q.options) && q.options.length > 0 && !q.hasAttempted && (
            <button
              type="button"
              onClick={() => setDuelOpen(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              aria-label="Challenge a friend"
            >
              <Swords className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duel</span>
            </button>
          )}
        </div>

        {/* Action Button — hidden for teachers */}
        {user === undefined ? (
          <div className="flex-1 sm:flex-none">
            <div className="w-full h-8 sm:h-10 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg sm:rounded-xl"></div>
          </div>
        ) : isTeacher ? (
          <div className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold cursor-default select-none transition-all">
            <TeacherBadge />
            <span className="hidden sm:inline">Teacher View</span>
            <span className="sm:hidden">Teacher</span>
          </div>
        ) : q.hasWrittenSubmission && q.userSubmissionId ? (
          <Link href={`/questions/${q.id}`} className="flex-1 sm:flex-none">
            <button className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">See Breakdown</span>
              <span className="sm:hidden">Details</span>
            </button>
          </Link>
        ) : q.hasAttempted ? (
          <Link href={`/questions/${q.id}`} className="flex-1 sm:flex-none">
            <button className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Solved Details</span>
              <span className="sm:hidden">Solved</span>
            </button>
          </Link>
        ) : (
          <Link href={`/questions/${q.id}`} className="flex-1 sm:flex-none">
            <button className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>Attempt</span>
            </button>
          </Link>
        )}
      </div>
    </article>

    {/* Duel Challenge Modal */}
    {user && !isTeacher && (
      <DuelChallengeModal
        isOpen={duelOpen}
        onClose={() => setDuelOpen(false)}
        questionId={q.id}
        questionTitle={q.title}
        currentUserId={user.id}
      />
    )}
    </>
  );
}