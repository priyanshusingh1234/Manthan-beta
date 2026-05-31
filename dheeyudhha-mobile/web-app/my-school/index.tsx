import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Users, Swords, Plus, Crown, AlertCircle, Clock, CheckCircle, X, ChevronRight, User as UserIcon, Search, Pencil, Save, Zap, Flame, Skull, Crosshair, Award } from 'lucide-react-native';
import { Link } from 'expo-router';
import TeacherBadge from "@/ticks/teacher";

export default function MySchoolPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [squadData, setSquadData] = useState<any>(null);
    
    // Create new school state
    const [newSchoolName, setNewSchoolName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Leadership log state
    const [requests, setRequests] = useState<any[]>([]);
    const [reviewState, setReviewState] = useState<Record<string, 'idle' | 'loading' | 'done'>>({});

    // Leave/Disband state
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editDesc, setEditDesc] = useState("");
    const [editAvatar, setEditAvatar] = useState("shield");
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchMySquad(session.access_token);
            else setLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
            setSession(session);
            if (session) fetchMySquad(session.access_token);
        });
        return () => authListener?.subscription.unsubscribe();
    }, []);

    const fetchMySquad = async (token: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/squad', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            const d = await res.json();
            if (res.ok && d.school?.id) {
                setSquadData(d);
                if (d.squad?.general_id === session?.user?.id || d.members?.find((m: any) => m.isMe && m.role === 'General')) {
                    fetchRequests(token, d.school.id);
                }
            } else {
                setSquadData(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async (token: string, schoolId: string) => {
        try {
            const res = await fetch(`/api/schools/join?school_id=${schoolId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const d = await res.json();
                setRequests(d.requests || []);
            }
        } catch (e) {
            console.error("Failed to fetch requests", e);
        }
    };

    const handleCreateSchool = async () => {
        if (!session || !newSchoolName.trim()) return;
        setCreating(true);
        setCreateError("");
        try {
            const res = await fetch('/api/schools', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newSchoolName.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setNewSchoolName("");
                const { data: { session: newSession } } = await supabase.auth.refreshSession();
                if (newSession) {
                    setSession(newSession);
                    await fetchMySquad(newSession.access_token);
                }
            } else {
                setCreateError(data.error || 'Failed to create group.');
            }
        } catch {
            setCreateError("Network error.");
        } finally {
            setCreating(false);
        }
    };

    const reviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
        setReviewState(prev => ({ ...prev, [requestId]: 'loading' }));
        const res = await fetch('/api/schools/join', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, requestId }),
        });
        if (res.ok) {
            setReviewState(prev => ({ ...prev, [requestId]: 'done' }));
            setRequests(prev => prev.filter(r => r.id !== requestId));
            // Refresh squad if approved
            if (action === 'approve') {
                setNotification({ type: 'success', message: 'Recruit approved!' });
                fetchMySquad(session.access_token);
            }
        } else {
            setReviewState(prev => ({ ...prev, [requestId]: 'idle' }));
        }
    };

    const handleLeaveSchool = async () => {
        if (!confirm("Are you sure you want to leave this faction? You will lose access to its War Room.")) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/schools/leave', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setSquadData(null);
                const { data: { session: newSession } } = await supabase.auth.refreshSession();
                if (newSession) setSession(newSession);
                alert("You have left the faction.");
            } else {
                setNotification({ type: 'error', message: data.error || 'Failed to leave.' });
            }
        } catch {
            setNotification({ type: 'error', message: 'Network error.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisbandSchool = async () => {
        if (!confirm("CRITICAL: Are you absolutely sure you want to completely DISBAND this faction? All members will be kicked and history will be lost.")) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/schools/delete', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setSquadData(null);
                const { data: { session: newSession } } = await supabase.auth.refreshSession();
                if (newSession) setSession(newSession);
                alert("Faction permanently disbanded.");
            } else {
                setNotification({ type: 'error', message: data.error || 'Failed to disband.' });
            }
        } catch {
            setNotification({ type: 'error', message: 'Network error.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (editDesc.trim().split(' ').length > 200) {
            setNotification({ type: 'error', message: 'Description exceeds 200 words.' });
            return;
        }

        setSavingProfile(true);
        try {
            const res = await fetch('/api/schools/update', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: editAvatar, description: editDesc.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: 'Profile updated!' });
                setIsEditing(false);
                fetchMySquad(session.access_token);
            } else {
                setNotification({ type: 'error', message: data.error || 'Failed to save.' });
            }
        } catch {
            setNotification({ type: 'error', message: 'Network error.' });
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) {
        return (
            <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center pb-24 flex-row">
                <View className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></View>
            </View>
        );
    }

    if (!session) {
        return (
            <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Shield className="w-20 h-20 text-slate-300 dark:text-slate-800 mb-6" />
                <Text className="text-3xl font-black mb-2">Join the Battle</Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">You must be logged in to view your school or establish a new faction.</Text>
                <Link href="/login" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Log in</Link>
            </View>
        );
    }

    // No Faction View
    if (!squadData) {
        return (
            <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 pt-12 flex-row">
                <View className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Join Existing */}
                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 flex flex-col items-center text-center shadow-lg">
                        <View className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 flex-row">
                            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </View>
                        <Text className="text-2xl font-black mb-3">Join a School</Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                            Search for your real-world school or a study group, send a join request, and become a soldier for their faction.
                        </Text>
                        <Link href="/top-schools" className="mt-auto w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 flex-row">
                            <Search className="w-5 h-5" /> Browse Schools
                        </Link>
                    </View>

                    {/* Create New */}
                    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/40 to-white dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden shadow-lg shadow-indigo-500/5">
                        <View className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <View className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-indigo-500/20 dark:ring-indigo-500/50 flex-row">
                            <Crown className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </View>
                        <Text className="text-2xl font-black mb-3">Found a Faction</Text>
                        <Text className="text-slate-600 dark:text-slate-300 text-sm mb-8 leading-relaxed">
                            Create a completely new group called a School. You will become the <Text className="text-indigo-600 dark:text-indigo-400 font-bold">General</Text> and command its armies in War.
                        </Text>
                        <View className="w-full mt-auto space-y-3 relative z-10">
                            <TextInput
                                type="text"
                                value={newSchoolName}
                                onChange={e => setNewSchoolName(e.target.value)}
                                placeholder="Group Name (e.g. TPS Mavericks)"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                                onKeyDown={e => { if (e.key === 'Enter') handleCreateSchool(); }}
                            />
                            {createError && <Text className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">{createError}</Text>}
                            <View
                                onPress={handleCreateSchool}
                                disabled={!newSchoolName.trim() || creating}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex justify-center items-center gap-2 flex-row"
                            >
                                {creating ? 'Establishing...' : <><Plus className="w-5 h-5" /> Establish Group</>}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    const isGeneral = squadData.members?.find((m: any) => m.isMe && m.role === 'General');

    const renderAvatarIcon = (url: string | undefined, className: string = "w-6 h-6") => {
        const iconName = url || 'shield';
        switch (iconName) {
            case 'sword': return <Swords className={className} />;
            case 'crown': return <Crown className={className} />;
            case 'zap': return <Zap className={className} />;
            case 'flame': return <Flame className={className} />;
            case 'skull': return <Skull className={className} />;
            case 'crosshair': return <Crosshair className={className} />;
            default: return <Shield className={className} />;
        }
    };

    const avatarOptions = ['shield', 'sword', 'crown', 'zap', 'flame', 'skull', 'crosshair'];

    // Faction Hub View
    return (
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
            
            {/* Decorative Blur Backgrounds */}
            <View className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none" />
            <View className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none" />

            {/* Header Content */}
            <View className="max-w-5xl mx-auto px-6 mb-8 relative z-10">
                {notification && (
                    <View className={`mb-4 p-4 rounded-xl flex items-center justify-between shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <Text className="font-bold flex items-center gap-2 flex-row">
                            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {notification.message}
                        </Text>
                        <View onPress={() => setNotification(null)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></View>
                    </View>
                )}
                
                <View className="flex flex-col sm:flex-row justify-between gap-6 md:gap-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl">
                    <View className="flex flex-col sm:flex-row gap-6 sm:items-center">
                        <View className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 border-4 border-slate-50 dark:border-slate-950 flex-row">
                            {renderAvatarIcon(squadData.school.avatarUrl, "w-10 h-10")}
                        </View>
                        <View>
                            <View className="flex flex-wrap items-center gap-3 mb-2 flex-row">
                                <Text className="text-3xl font-black">{squadData.school.name}</Text>
                                {isGeneral && (
                                    <Text className="bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-500 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm flex-row">
                                        <Crown className="w-3 h-3" /> General
                                    </Text>
                                )}
                            </View>
                            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 max-w-lg">
                                {squadData.school.description || "A growing faction aiming for the top of the leaderboard."}
                            </Text>
                            <Text className="text-sm font-bold flex items-center gap-4 flex-wrap flex-row">
                                <Text className="flex items-center gap-1.5 flex-row"><Users className="w-4 h-4 text-slate-400" /> {squadData.school.membersCount} Soldiers</Text>
                                <Text className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 flex-row"><Award className="w-4 h-4" /> {squadData.school.points.toLocaleString()} Points</Text>
                            </Text>
                        </View>
                    </View>
                    
                    <View className="flex flex-row sm:flex-col items-center sm:items-stretch justify-center gap-3 shrink-0">
                        <Link href={`/war-history?schoolId=${squadData.school.id}`} className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 flex-row">
                            <Clock className="w-4 h-4" /> War History
                        </Link>
                        <Link href="/war" className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-500/30 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 flex-row">
                            <Swords className="w-4 h-4" /> War Room
                        </Link>
                    </View>
                </View>
            </View>

            <View className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                
                {/* Left Col: Roster & Actions */}
                <View className="lg:col-span-2 space-y-6">
                    {/* Action Bar */}
                    <View className="flex flex-wrap justify-between items-center gap-4 mb-2 flex-row">
                        {isGeneral && (
                            <View onPress={() => {
                                setEditAvatar(squadData.school.avatarUrl || 'shield');
                                setEditDesc(squadData.school.description || '');
                                setIsEditing(true);
                            }} className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm flex-row">
                                <Pencil className="w-4 h-4" /> Edit Profile
                            </View>
                        )}
                        <View className="flex justify-end flex-1 flex-row">
                            {isGeneral ? (
                                <View onPress={handleDisbandSchool} disabled={actionLoading} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 flex-row">
                                    <AlertCircle className="w-3.5 h-3.5" /> Disband Faction
                                </View>
                            ) : (
                                <View onPress={handleLeaveSchool} disabled={actionLoading} className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm flex-row">
                                    <X className="w-3.5 h-3.5" /> Leave Faction
                                </View>
                            )}
                        </View>
                    </View>

                    <View className="flex items-center justify-between flex-row">
                        <Text className="text-xl font-black flex items-center gap-2 flex-row">
                            <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Active Roster
                        </Text>
                    </View>
                    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none">
                        {squadData.members?.map((m: any, i: number) => (
                            <View key={m.id} className={`p-4 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${m.isMe ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                                <View className="flex items-center gap-4 flex-row">
                                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-sm flex-row">
                                        {i + 1}
                                    </View>
                                    <View>
                                        <View className="font-bold flex items-center gap-2 text-base flex-row">
                                            {m.isMe ? 'You' : m.name}
                                            {m.role === 'General' && <Crown className="w-3.5 h-3.5 text-amber-500 ml-1" />}
                                        </View>
                                        <View className="text-xs font-medium text-slate-500 mt-0.5 capitalize">{m.role}</View>
                                    </View>
                                </View>
                                <View className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg text-sm">
                                    {m.points.toLocaleString()} pts
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Right Col: Leadership Log */}
                <View className="space-y-6">
                    <Text className="text-xl font-black flex items-center gap-2 flex-row">
                        <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Leadership Log
                    </Text>
                    
                    {!isGeneral ? (
                        <View className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-lg">
                            <View className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 flex-row">
                                <Shield className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </View>
                            <Text className="font-bold mb-1">Restricted Area</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm">Only the General has access to the leadership log and recruit approvals.</Text>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {/* Requests Queue */}
                            <View className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                                <View className="absolute top-0 right-0 w-32 h-32 bg-amber-100 dark:bg-amber-500/5 blur-3xl pointer-events-none" />
                                <Text className="font-black mb-4 relative z-10 flex items-center gap-2 flex-row">
                                    Pending Recruits
                                    {requests.length > 0 && (
                                        <Text className="bg-amber-500 text-white dark:text-slate-950 text-xs px-2 py-0.5 rounded-full shadow-sm">{requests.length}</Text>
                                    )}
                                </Text>
                                
                                {requests.length === 0 ? (
                                    <View className="text-center py-6">
                                        <View className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 flex-row">
                                            <CheckCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                        </View>
                                        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">No pending requests</Text>
                                    </View>
                                ) : (
                                    <View className="space-y-3 relative z-10">
                                        {requests.map(req => (
                                            <View key={req.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none">
                                                <View className="flex items-center gap-3 mb-3 flex-row">
                                                    <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 flex-row">
                                                        <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                    </View>
                                                    <View>
                                                        <View className="text-sm font-bold leading-tight">{req.name}</View>
                                                        <View className="text-[11px] text-slate-500 font-medium">Lvl {req.classGrade} • {req.points.toLocaleString()} pts</View>
                                                    </View>
                                                </View>
                                                <View className="grid grid-cols-2 gap-2">
                                                    <View
                                                        onPress={() => reviewRequest(req.id, 'reject')}
                                                        disabled={reviewState[req.id] === 'loading' || reviewState[req.id] === 'done'}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/30 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 rounded-xl transition-all shadow-sm dark:shadow-none"
                                                    >
                                                        Reject
                                                    </View>
                                                    <View
                                                        onPress={() => reviewRequest(req.id, 'approve')}
                                                        disabled={reviewState[req.id] === 'loading' || reviewState[req.id] === 'done'}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 text-xs font-bold py-2 rounded-xl transition-all"
                                                    >
                                                        {reviewState[req.id] === 'loading' ? 'Approving...' : 'Approve'}
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Edit Profile Modal */}
            {isEditing && (
                <View className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm flex-row">
                    <View initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        <View className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-row">
                            <Text className="text-xl font-black flex items-center gap-2 flex-row"><Pencil className="w-5 h-5 text-indigo-500" /> Edit Faction Profile</Text>
                            <View onPress={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-6 h-6" /></View>
                        </View>
                        <View className="p-6 overflow-y-auto">
                            <Text className="text-sm font-bold mb-3">Faction Avatar</Text>
                            <View className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
                                {avatarOptions.map(opt => (
                                    <View 
                                        key={opt}
                                        onPress={() => setEditAvatar(opt)}
                                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${editAvatar === opt ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'}`}
                                    >
                                        {renderAvatarIcon(opt, "w-6 h-6")}
                                    </View>
                                ))}
                            </View>
                            
                            <Text className="text-sm font-bold mb-3">Mission Description <Text className="text-xs font-normal text-slate-500 ml-1">(Max 200 words)</Text></Text>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="State your faction's mission, rules, or battle cry..."
                                className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            ></textarea>
                            <View className="text-right text-xs font-medium mt-2 text-slate-400">
                                {editDesc.trim().split(/\s+/).filter(w => w.length > 0).length} / 200 words
                            </View>
                        </View>
                        <View className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 flex-row">
                            <View onPress={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancel</View>
                            <View onPress={handleSaveProfile} disabled={savingProfile} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 flex-row">
                                {savingProfile ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
