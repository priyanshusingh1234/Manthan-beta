"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Shield, Trophy, Users, Swords, Plus, X,
    CheckCircle, Clock, ChevronRight, Star, Building2, Zap
} from "lucide-react";
import Link from "next/link";

const normalizeSchoolName = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, " ");

export default function TopSchoolsPage() {
    const [session, setSession] = useState<any>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Create school modal
    const [showCreate, setShowCreate] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createNote, setCreateNote] = useState("");

    // Request states per school
    const [requestStates, setRequestStates] = useState<Record<string, 'idle' | 'loading' | 'sent' | 'error'>>({});
    const [userSchoolId, setUserSchoolId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user?.user_metadata?.school_id) {
                setUserSchoolId(session.user.user_metadata.school_id);
            }
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
            setSession(session);
            if (session?.user?.user_metadata?.school_id) {
                setUserSchoolId(session.user.user_metadata.school_id);
            }
        });
        return () => authListener?.subscription.unsubscribe();
    }, []);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        fetchSchools();
    }, [debouncedSearch]);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const url = debouncedSearch
                ? `/api/schools?search=${encodeURIComponent(debouncedSearch)}`
                : '/api/schools';
            const res = await fetch(url);
            const json = await res.json();
            if (res.ok) setSchools(json.schools || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestJoin = async (schoolId: string) => {
        if (!session) return;
        setRequestStates(prev => ({ ...prev, [schoolId]: 'loading' }));
        try {
            const res = await fetch('/api/schools/join', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'request', schoolId }),
            });
            const data = await res.json();
            if (res.ok) {
                setRequestStates(prev => ({ ...prev, [schoolId]: 'sent' }));
            } else {
                setRequestStates(prev => ({ ...prev, [schoolId]: 'error' }));
                alert(data.error || 'Failed to send request');
            }
        } catch {
            setRequestStates(prev => ({ ...prev, [schoolId]: 'error' }));
        }
    };

    const handleCreateSchool = async () => {
        if (!session || !newSchoolName.trim()) return;
        const normalizedInput = normalizeSchoolName(newSchoolName);
        const duplicateSchool = schools.find(
            (school) => normalizeSchoolName(school.name) === normalizedInput
        );

        if (duplicateSchool) {
            setCreateError("A school with this name already exists. If you are from the same school, use Branch in the name (e.g. \"ABC School - North Branch\").");
            return;
        }

        setCreating(true);
        setCreateError("");
        setCreateNote("");
        try {
            const res = await fetch('/api/schools', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newSchoolName }),
            });
            const data = await res.json();
            if (res.ok) {
                setShowCreate(false);
                setNewSchoolName("");
                setUserSchoolId(data.school.id);
                setCreateNote("School created successfully. You are now the General.");
                await fetchSchools();
                // Refresh session to get updated metadata
                await supabase.auth.refreshSession();
            } else {
                setCreateError(data.error || 'Failed to create school.');
            }
        } catch {
            setCreateError("Network error.");
        } finally {
            setCreating(false);
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-yellow-500/30";
        if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/20";
        if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/20";
        return "bg-slate-800 text-slate-400";
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 pb-24">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-amber-500" /> Top Schools
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Find your faction. Dominate the board.</p>
                    </div>
                    {session && !userSchoolId && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4" /> Create School
                        </button>
                    )}
                    {userSchoolId && (
                        <Link href="/war" className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                            <Swords className="w-4 h-4" /> War Room
                        </Link>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-xs sm:text-sm text-indigo-700 dark:text-indigo-100 flex items-start gap-2">
                    <Star className="w-4 h-4 mt-0.5 text-indigo-500 dark:text-indigo-300" />
                    <p>
                        Before creating a new school, search first. If you are from the same school, use
                        <span className="font-bold"> Branch </span>
                        in the name to create a separate group (example: <span className="font-bold">DPS - South Branch</span>).
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for your school..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Schools Grid */}
                {loading ? (
                    <div className="grid gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-28 animate-pulse border border-slate-200 dark:border-white/5" />
                        ))}
                    </div>
                ) : schools.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 className="w-16 h-16 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No schools found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">"{searchQuery}" doesn't exist yet.</p>
                        {session && !userSchoolId && (
                            <button
                                onClick={() => { setNewSchoolName(searchQuery); setShowCreate(true); }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />Create "{searchQuery}"
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schools.map((school) => {
                            const isMySchool = school.id === userSchoolId;
                            const reqState = requestStates[school.id] || 'idle';

                            return (
                                <motion.div
                                    key={school.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                        className={`group relative bg-white dark:bg-slate-900/95 backdrop-blur border rounded-2xl p-6 transition-all hover:shadow-xl ${isMySchool
                                            ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5 hover:shadow-indigo-500/10'
                                            : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:shadow-slate-300/40 dark:hover:shadow-black/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Rank + School Info */}
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg flex-shrink-0 ${getRankBadge(school.rank)}`}>
                                                {school.rank <= 3 ? ['🥇', '🥈', '🥉'][school.rank - 1] : `#${school.rank}`}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h2 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{school.name}</h2>
                                                    {isMySchool && (
                                                        <span className="bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                                            Your School
                                                        </span>
                                                    )}
                                                    {school.activeWars > 0 && (
                                                        <span className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                                                            <Zap className="w-2.5 h-2.5" /> WAR
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5" /> {school.memberCount.toLocaleString()} members
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Trophy className="w-3.5 h-3.5 text-amber-500/70" /> {(school.points || 0).toLocaleString()} pts
                                                    </span>
                                                    {school.generalName && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Shield className="w-3.5 h-3.5 text-indigo-500/80 dark:text-indigo-400/70" /> {school.generalName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex-shrink-0">
                                            {!session && (
                                                <Link href="/" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
                                                    Login to Join
                                                </Link>
                                            )}
                                            {session && isMySchool && (
                                                <Link href="/war" className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:bg-indigo-200 dark:hover:bg-indigo-500/30">
                                                    <Swords className="w-4 h-4" /> Open War Room
                                                </Link>
                                            )}
                                            {session && !isMySchool && !userSchoolId && (
                                                <button
                                                    onClick={() => handleRequestJoin(school.id)}
                                                    disabled={reqState === 'loading' || reqState === 'sent'}
                                                    className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm transition-all ${reqState === 'sent'
                                                            ? 'bg-green-500/20 border border-green-500/40 text-green-400 cursor-default'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg hover:-translate-y-0.5'
                                                        } disabled:opacity-60`}
                                                >
                                                    {reqState === 'loading' ? <Clock className="w-4 h-4 animate-spin" /> :
                                                        reqState === 'sent' ? <><CheckCircle className="w-4 h-4" /> Requested</> :
                                                            <><ChevronRight className="w-4 h-4" /> Join</>}
                                                </button>
                                            )}
                                            {session && !isMySchool && userSchoolId && (
                                                <span className="text-slate-500 dark:text-slate-600 text-xs font-medium px-4">Leave your school first</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action footer link */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                        <Link href={`/school/${school.id}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider">
                                            View Faction Profile <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create School Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Found a New School</h2>
                                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                You will become the <span className="text-amber-400 font-bold">General</span> of this school. You can approve join requests and declare wars on behalf of your faction.
                            </p>
                            <div className="mb-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-100">
                                If this is the same school, add <span className="font-bold">Branch</span> in the name to avoid duplicates (example: <span className="font-bold">ABC Public School - East Branch</span>).
                            </div>
                            <input
                                type="text"
                                value={newSchoolName}
                                onChange={e => {
                                    setNewSchoolName(e.target.value);
                                    if (createError) setCreateError("");
                                }}
                                placeholder="Full school name (e.g. Delhi Public School, R.K. Puram)"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-sm"
                                onKeyDown={e => { if (e.key === 'Enter') handleCreateSchool(); }}
                            />
                            {createError && (
                                <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{createError}</p>
                            )}
                            {createNote && (
                                <p className="text-green-300 text-sm mb-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3">{createNote}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSchool}
                                    disabled={!newSchoolName.trim() || creating}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Establishing...' : 'Establish School'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
