import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Search, Shield, Trophy, Users, Swords, Plus, X,
    CheckCircle, Clock, ChevronRight, Star, Building2, Zap
} from 'lucide-react-native';
import { Link } from 'expo-router';

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
    const isTeacher = session?.user?.user_metadata?.isTeacher === true;

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
        <View className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 pb-24">
            {/* Header */}
            <View className="border-b border-slate-200 dark:border-white/5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50">
                <View className="max-w-5xl mx-auto px-4 sm:px-6 h-auto min-h-[72px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                    <View className="flex flex-col">
                        <Text className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-row">
                             Top Schools
                        </Text>
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">Find your faction. Dominate the board.</Text>
                    </View>
                    <View className="flex items-center gap-2 w-full sm:w-auto flex-row">
                        {session && !userSchoolId && (
                            <View
                                onPress={() => setShowCreate(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg active:scale-95 flex-row"
                            >
                                <Plus className="w-4 h-4" /> Create School
                            </View>
                        )}
                        {userSchoolId && (
                            <Link href="/war" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all active:scale-95 flex-row">
                                <Swords className="w-4 h-4" /> War Room
                            </Link>
                        )}
                    </View>
                </View>
            </View>

            <View className="max-w-5xl mx-auto px-6 py-10">
                <View className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-xs sm:text-sm text-indigo-700 dark:text-indigo-100 flex items-start gap-2 flex-row">
                    <Star className="w-4 h-4 mt-0.5 text-indigo-500 dark:text-indigo-300" />
                    <Text>
                        Before creating a new school, search first. If you are from the same school, use
                        <Text className="font-bold"> Branch </Text>
                        in the name to create a separate group (example: <Text className="font-bold">DPS - South Branch</Text>).
                    </Text>
                </View>

                {/* Search Bar */}
                <View className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <TextInput
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for your school..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl pl-11 pr-5 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <View onPress={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <X className="w-4 h-4" />
                        </View>
                    )}
                </View>

                {/* Schools Grid */}
                {loading ? (
                    <View className="grid gap-4">
                        {[...Array(5)].map((_, i) => (
                            <View key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-28 animate-pulse border border-slate-200 dark:border-white/5" />
                        ))}
                    </View>
                ) : schools.length === 0 ? (
                    <View className="text-center py-20">
                        <Building2 className="w-16 h-16 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
                        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">No schools found</Text>
                        <Text className="text-slate-500 dark:text-slate-400 mb-6">"{searchQuery}" doesn't exist yet.</Text>
                        {session && !userSchoolId && !isTeacher && (
                            <View
                                onPress={() => { setNewSchoolName(searchQuery); setShowCreate(true); }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />Create "{searchQuery}"
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="space-y-4">
                        {schools.map((school) => {
                            const isMySchool = school.id === userSchoolId;
                            const reqState = requestStates[school.id] || 'idle';

                            return (
                                <View
                                    key={school.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`group relative bg-white dark:bg-slate-900/95 backdrop-blur border rounded-2xl p-6 transition-all hover:shadow-xl ${isMySchool
                                            ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5 hover:shadow-indigo-500/10'
                                            : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:shadow-slate-300/40 dark:hover:shadow-black/30'
                                        }`}
                                >
                                    <View className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                        {/* Rank + School Info */}
                                        <View className="flex items-center gap-4 min-w-0 flex-row">
                                            <View className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-base flex-shrink-0 ${getRankBadge(school.rank)}`}>
                                                {school.rank <= 3 ? ['🥇', '🥈', '🥉'][school.rank - 1] : `#${school.rank}`}
                                            </View>
                                            <View className="min-w-0 flex-1 flex-row">
                                                <View className="flex items-center gap-2 flex-wrap min-w-0 flex-row">
                                                    <Text className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">{school.name}</Text>
                                                    {isMySchool && (
                                                        <Text className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                            Yours
                                                        </Text>
                                                    )}
                                                    {school.activeWars > 0 && (
                                                        <Text className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 flex-row">
                                                            <Zap className="w-2 h-2" /> WAR
                                                        </Text>
                                                    )}
                                                </View>
                                                <View className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex-row">
                                                    <Text className="flex items-center gap-1 flex-row">
                                                        <Users className="w-3 h-3" /> {school.memberCount.toLocaleString()}
                                                    </Text>
                                                    <Text className="flex items-center gap-1 flex-row">
                                                        <Trophy className="w-3 h-3 text-amber-500/70" /> {(school.points || 0).toLocaleString()}
                                                    </Text>
                                                    {school.generalName && (
                                                        <Text className="flex items-center gap-1 truncate max-w-[120px] flex-row">
                                                            <Shield className="w-3 h-3 text-indigo-400" /> {school.generalName}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
 
                                        {/* Action Button */}
                                        <View className="w-full sm:w-auto flex-shrink-0 flex-row">
                                            {!session && (
                                                <Link href="/" className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 flex-row">
                                                    Login to Join
                                                </Link>
                                            )}
                                            {session && isMySchool && (
                                                <Link href="/war" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-4 py-2.5 rounded-xl text-xs transition-all hover:bg-indigo-500/20 flex-row">
                                                    <Swords className="w-4 h-4" /> Open War Room
                                                </Link>
                                            )}
                                            {session && !isMySchool && !userSchoolId && !isTeacher && (
                                                <View
                                                    onPress={() => handleRequestJoin(school.id)}
                                                    disabled={reqState === 'loading' || reqState === 'sent'}
                                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl text-xs transition-all ${reqState === 'sent'
                                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 cursor-default'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md active:scale-95'
                                                        } disabled:opacity-60`}
                                                >
                                                    {reqState === 'loading' ? <Clock className="w-3.5 h-3.5 animate-spin" /> :
                                                        reqState === 'sent' ? <><CheckCircle className="w-3.5 h-3.5" /> Requested</> :
                                                            <><Plus className="w-3.5 h-3.5" /> Join Faction</>}
                                                </View>
                                            )}
                                            {session && !isMySchool && userSchoolId && (
                                                <Text className="block text-center text-slate-500 dark:text-slate-600 text-[10px] font-bold uppercase tracking-wider">LOCKED</Text>
                                            )}
                                        </View>
                                    </View>
                                    
                                    {/* Action footer link */}
                                    <View className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end flex-row">
                                        <Link href={`/school/${school.id}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider flex-row">
                                            View Faction Profile <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Create School Modal */}
            <>
                {showCreate && (
                    <View
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 flex-row"
                        onPress={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
                    >
                        <View
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            <View className="flex items-center justify-between mb-6 flex-row">
                                <Text className="text-xl font-black text-slate-900 dark:text-white">Found a New School</Text>
                                <View onPress={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </View>
                            </View>
                            <Text className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                You will become the <Text className="text-amber-400 font-bold">General</Text> of this school. You can approve join requests and declare wars on behalf of your faction.
                            </Text>
                            <View className="mb-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-100">
                                If this is the same school, add <Text className="font-bold">Branch</Text> in the name to avoid duplicates (example: <Text className="font-bold">ABC Public School - East Branch</Text>).
                            </View>
                            <TextInput
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
                                <Text className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{createError}</Text>
                            )}
                            {createNote && (
                                <Text className="text-green-300 text-sm mb-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3">{createNote}</Text>
                            )}
                            <View className="flex gap-3 flex-row">
                                <View
                                    onPress={() => setShowCreate(false)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-all flex-row"
                                >
                                    Cancel
                                </View>
                                <View
                                    onPress={handleCreateSchool}
                                    disabled={!newSchoolName.trim() || creating}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 flex-row"
                                >
                                    {creating ? 'Establishing...' : 'Establish School'}
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </>
        </View>
    );
}
