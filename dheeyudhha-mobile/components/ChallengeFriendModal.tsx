import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2, Send, Users, CheckCircle2, ArrowLeft, Swords, Zap, MessageSquare, Sparkles } from 'lucide-react-native';
import { supabase } from "@/lib/supabaseClient";

interface UserType {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
}

const QUICK_MESSAGES = [
    "Need your brain on this one 🧠",
    "Let's crush this together 💪",
    "I failed — rescue me! 🆘",
    "Tag! You're it 🎯",
    "Come on, we can win this 🏆",
];

export default function ChallengeFriendModal({
    isOpen,
    onClose,
    questionId,
    currentUserId
}: {
    isOpen: boolean;
    onClose: () => void;
    questionId: string;
    currentUserId: string;
}) {
    // Step 1: pick a friend; Step 2: compose message
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedFriend, setSelectedFriend] = useState<UserType | null>(null);
    const [message, setMessage] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedFriend(null);
            setMessage("");
            setSearchQuery("");
            setResults([]);
            setSent(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!isOpen || step !== 1) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (searchQuery.trim().length < 2) { setResults([]); return; }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&exclude=${currentUserId}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.users || []);
                }
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        }, 350);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, isOpen, currentUserId, step]);

    const pickFriend = (user: UserType) => {
        setSelectedFriend(user);
        setStep(2);
    };

    const handleSend = async () => {
        if (!selectedFriend || sending) return;
        setSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch("/api/coop/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    questionId,
                    partnerId: selectedFriend.id,
                    message: message.trim() || undefined,
                }),
            });

            if (res.ok) {
                setSent(true);
                setTimeout(() => {
                    onClose();
                    setSent(false);
                }, 2000);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to send help request");
            }
        } catch {
            alert("Error sending help request");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in flex-row">
            <View className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[85vh] animate-in zoom-in-95">

                {/* ── Gradient header ── */}
                <View className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 px-5 pt-5 pb-8 relative overflow-hidden">
                    <View className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <View className="flex items-center justify-between relative flex-row">
                        <View className="flex items-center gap-3 flex-row">
                            {step === 2 && (
                                <View
                                    onPress={() => setStep(1)}
                                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors mr-1"
                                >
                                    <ArrowLeft className="w-4 h-4 text-white" />
                                </View>
                            )}
                            <View className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-row">
                                {step === 1 ? <Users className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
                            </View>
                            <View>
                                <Text className="text-base font-black text-white">
                                    {step === 1 ? "Ask for Help" : "Write your message"}
                                </Text>
                                <Text className="text-[11px] text-white/70">
                                    {step === 1 ? "Pick a student to help you" : `Sending to ${(selectedFriend?.name || "Student").split(' ')[0]}`}
                                </Text>
                            </View>
                        </View>
                        <View
                            onPress={onClose}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </View>
                    </View>

                    {/* Step indicator */}
                    <View className="flex items-center gap-2 mt-4 relative flex-row">
                        <View className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                        <View className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                    </View>
                </View>

                {/* ── STEP 1: Search ── */}
                {step === 1 && (
                    <>
                        <View className="px-4 pt-4 pb-2 -mt-4">
                            <View className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <TextInput
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search by name or @username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                />
                                {loading && (
                                    <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                                )}
                            </View>
                        </View>

                        <View className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 min-h-[200px] flex-row">
                            {searchQuery.trim().length < 2 ? (
                                <View className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 gap-3">
                                    <View className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-row">
                                        <Search className="w-6 h-6 text-indigo-300 dark:text-indigo-700" />
                                    </View>
                                    <Text className="text-sm font-medium">Type to search students</Text>
                                    <Text className="text-xs text-slate-400">Min 2 characters</Text>
                                </View>
                            ) : loading ? (
                                <View className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                    <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                                    <Text className="text-sm">Searching...</Text>
                                </View>
                            ) : results.length === 0 ? (
                                <View className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                    <Text className="text-sm font-medium">No users found for &ldquo;{searchQuery}&rdquo;</Text>
                                    <Text className="text-xs">Try a different name or username</Text>
                                </View>
                            ) : (
                                results.map((user) => (
                                    <View
                                        key={user.id}
                                        onPress={() => pickFriend(user)}
                                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 group text-left flex-row"
                                    >
                                        <View className="flex items-center gap-3 flex-row">
                                            {user.avatar ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <Image src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                            ) : (
                                                <View className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center border border-indigo-200 text-sm flex-row">
                                                    {user.name?.[0]?.toUpperCase() ?? "?"}
                                                </View>
                                            )}
                                            <View>
                                                <Text className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{user.name}</Text>
                                                <Text className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</Text>
                                            </View>
                                        </View>
                                        <View className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 px-3 py-1.5 rounded-xl transition-colors flex-row">
                                            <Users className="w-3.5 h-3.5" /> Ask
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}

                {/* ── STEP 2: Message ── */}
                {step === 2 && selectedFriend && (
                    <View className="flex flex-col flex-1 p-5 gap-4 overflow-y-auto">
                        {/* Selected friend preview */}
                        <View className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex-row">
                            {selectedFriend.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <Image src={selectedFriend.avatar} alt={selectedFriend.name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow" />
                            ) : (
                                <View className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 font-black flex items-center justify-center text-sm flex-row">
                                    {selectedFriend.name?.[0]?.toUpperCase()}
                                </View>
                            )}
                            <View>
                                <Text className="font-black text-slate-800 dark:text-slate-100 text-sm">{selectedFriend.name}</Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400">@{selectedFriend.username}</Text>
                            </View>
                            <View className="ml-auto flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 flex-row">
                                <Zap className="w-3 h-3 text-amber-500" /> Help
                            </View>
                        </View>

                        {/* Quick picks */}
                        <View>
                            <View className="flex items-center gap-1.5 mb-2.5 flex-row">
                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick messages</Text>
                            </View>
                            <View className="flex flex-wrap gap-2 flex-row">
                                {QUICK_MESSAGES.map((q) => (
                                    <View
                                        key={q}
                                        onPress={() => setMessage(q)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${message === q
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/20'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                                            }`}
                                    >
                                        {q}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Custom message textarea */}
                        <View>
                            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                                Or write your own
                            </Text>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={160}
                                rows={3}
                                placeholder="Add a personal note to your help request..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors resize-none"
                            />
                            <Text className="text-right text-[10px] text-slate-400 mt-1">{message.length}/160</Text>
                        </View>

                        {/* Send button */}
                        <View
                            onPress={handleSend}
                            disabled={sending || sent}
                            className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-70 ${sent
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500'
                                }`}
                        >
                            {sending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                            ) : sent ? (
                                <><CheckCircle2 className="w-4 h-4" /> Help Request Sent! 🎉</>
                            ) : (
                                <><Send className="w-4 h-4" /> Send Help Request</>
                            )}
                        </View>
                        <Text className="text-center text-[11px] text-slate-400">
                            {(selectedFriend?.name || "Student").split(' ')[0]} will see your message in their notifications
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
