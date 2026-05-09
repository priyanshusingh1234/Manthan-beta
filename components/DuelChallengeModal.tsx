"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2, Send, Swords, CheckCircle2, ArrowLeft, Flame, MessageSquare, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UserType { id: string; username: string; name: string; avatar: string | null; }

const QUICK_TAUNTS = [
    "Think you can beat me? 😤",
    "I dare you to try 🔥",
    "Let's settle this! ⚔️",
    "Catch me if you can 💨",
    "Scared? 😈",
];

export default function DuelChallengeModal({
    isOpen, onClose, questionId, questionTitle, currentUserId
}: {
    isOpen: boolean; onClose: () => void;
    questionId: string; questionTitle?: string; currentUserId: string;
}) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedOpponent, setSelectedOpponent] = useState<UserType | null>(null);
    const [taunt, setTaunt] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1); setSelectedOpponent(null); setTaunt(""); setSearchQuery(""); setResults([]); setSent(false); setError("");
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || step !== 1) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (searchQuery.trim().length < 2) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&exclude=${currentUserId}`);
                if (res.ok) { const d = await res.json(); setResults(d.users || []); }
            } catch { } finally { setLoading(false); }
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, isOpen, currentUserId, step]);

    const handleSend = async () => {
        if (!selectedOpponent || sending) return;
        setSending(true); setError("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/duel/create", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                body: JSON.stringify({ questionId, challengedId: selectedOpponent.id, message: taunt.trim() || undefined }),
            });
            if (res.ok) {
                setSent(true);
                setTimeout(() => { onClose(); setSent(false); }, 2200);
            } else {
                const d = await res.json();
                setError(d.error || "Failed to send duel challenge");
            }
        } catch { setError("Error sending duel"); } finally { setSending(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex flex-col justify-end sm:justify-center items-center bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-950 w-full h-[100dvh] sm:h-auto sm:max-w-md sm:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col sm:max-h-[85vh] animate-in slide-in-from-bottom-full sm:zoom-in-95">

                {/* Gradient header */}
                <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-red-600 px-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] sm:pt-5 pb-8 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-3">
                            {step === 2 && (
                                <button onClick={() => setStep(1)} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-1">
                                    <ArrowLeft className="w-4 h-4 text-white" />
                                </button>
                            )}
                            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                {step === 1 ? <Swords className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                                <h2 className="text-base font-black text-white">
                                    {step === 1 ? "⚔️ Challenge a Friend" : "Send your taunt"}
                                </h2>
                                <p className="text-[11px] text-white/70">
                                    {step === 1 ? "Pick an opponent to duel" : `Dueling ${selectedOpponent?.name?.split(' ')[0]} — 24h expiry`}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Question preview */}
                    {questionTitle && (
                        <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white/90 line-clamp-1 flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5 shrink-0 text-orange-200" />
                            {questionTitle}
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                        <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                    </div>
                </div>

                {/* Step 1: Search */}
                {step === 1 && (
                    <>
                        <div className="px-4 pt-4 pb-2 -mt-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input ref={inputRef} type="text" placeholder="Search by name or @username..."
                                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                />
                                {loading && <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-orange-400 animate-spin" />}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 min-h-[200px]">
                            {searchQuery.trim().length < 2 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                        <Swords className="w-6 h-6 text-orange-300 dark:text-orange-700" />
                                    </div>
                                    <p className="text-sm font-medium">Search for an opponent</p>
                                    <p className="text-xs text-slate-400">They have 24h to accept or reject</p>
                                </div>
                            ) : loading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-orange-400" /></div>
                            ) : results.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                    <p className="text-sm font-medium">No students found for "{searchQuery}"</p>
                                </div>
                            ) : (
                                results.map((u) => (
                                    <button key={u.id} onClick={() => { setSelectedOpponent(u); setStep(2); }}
                                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 group text-left">
                                        <div className="flex items-center gap-3">
                                            {u.avatar
                                                ? <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                                : <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-black flex items-center justify-center text-sm">{u.name?.[0]?.toUpperCase()}</div>
                                            }
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-orange-700 dark:group-hover:text-orange-400">{u.name}</p>
                                                <p className="text-xs text-slate-500">@{u.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors">
                                            <Swords className="w-3.5 h-3.5" /> Duel
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* Step 2: Taunt */}
                {step === 2 && selectedOpponent && (
                    <div className="flex flex-col flex-1 p-5 gap-4 overflow-y-auto">
                        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            {selectedOpponent.avatar
                                ? <img src={selectedOpponent.avatar} alt={selectedOpponent.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
                                : <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-700 font-black flex items-center justify-center text-sm">{selectedOpponent.name?.[0]?.toUpperCase()}</div>
                            }
                            <div>
                                <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{selectedOpponent.name}</p>
                                <p className="text-xs text-slate-500">@{selectedOpponent.username}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1 text-xs font-bold text-orange-600 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-orange-200">
                                <Swords className="w-3 h-3" /> 24h duel
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 mb-2.5">
                                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick taunts</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_TAUNTS.map((t) => (
                                    <button key={t} onClick={() => setTaunt(t)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${taunt === t ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Or write your own taunt</label>
                            <textarea value={taunt} onChange={(e) => setTaunt(e.target.value)} maxLength={120} rows={3}
                                placeholder="Optional smack talk..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-400 transition-colors resize-none" />
                            <p className="text-right text-[10px] text-slate-400 mt-1">{taunt.length}/120</p>
                        </div>

                        {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

                        <button onClick={handleSend} disabled={sending || sent}
                            className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-70 ${sent ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-400 hover:to-rose-400'}`}>
                            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                : sent ? <><CheckCircle2 className="w-4 h-4" /> Duel Sent! ⚔️</>
                                    : <><Send className="w-4 h-4" /> Send Duel Challenge</>}
                        </button>
                        <p className="text-center text-[11px] text-slate-400">
                            {selectedOpponent.name.split(' ')[0]} has 24 hours to accept or reject
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
