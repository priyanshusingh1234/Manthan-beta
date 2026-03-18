"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Shield, Users, Swords, Plus, Crown, AlertCircle, Clock, CheckCircle, X, ChevronRight, User as UserIcon, Search } from "lucide-react";
import Link from "next/link";
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

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center pb-24">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Shield className="w-20 h-20 text-slate-300 dark:text-slate-800 mb-6" />
                <h1 className="text-3xl font-black mb-2">Join the Battle</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">You must be logged in to view your school or establish a new faction.</p>
                <Link href="/login" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Log in</Link>
            </div>
        );
    }

    // No Faction View
    if (!squadData) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 pt-12">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Join Existing */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 flex flex-col items-center text-center shadow-lg">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black mb-3">Join a School</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                            Search for your real-world school or a study group, send a join request, and become a soldier for their faction.
                        </p>
                        <Link href="/top-schools" className="mt-auto w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                            <Search className="w-5 h-5" /> Browse Schools
                        </Link>
                    </motion.div>

                    {/* Create New */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/40 to-white dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden shadow-lg shadow-indigo-500/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-indigo-500/20 dark:ring-indigo-500/50">
                            <Crown className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black mb-3">Found a Faction</h2>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-8 leading-relaxed">
                            Create a completely new group called a School. You will become the <span className="text-indigo-600 dark:text-indigo-400 font-bold">General</span> and command its armies in War.
                        </p>
                        <div className="w-full mt-auto space-y-3 relative z-10">
                            <input
                                type="text"
                                value={newSchoolName}
                                onChange={e => setNewSchoolName(e.target.value)}
                                placeholder="Group Name (e.g. TPS Mavericks)"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                                onKeyDown={e => { if (e.key === 'Enter') handleCreateSchool(); }}
                            />
                            {createError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">{createError}</p>}
                            <button
                                onClick={handleCreateSchool}
                                disabled={!newSchoolName.trim() || creating}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {creating ? 'Establishing...' : <><Plus className="w-5 h-5" /> Establish Group</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    const isGeneral = squadData.members?.find((m: any) => m.isMe && m.role === 'General');

    // Faction Hub View
    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
            
            {/* Decorative Blur Backgrounds */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full mix-blend-overlay filter blur-3xl pointer-events-none" />

            {/* Header Content */}
            <div className="max-w-5xl mx-auto px-6 mb-8 relative z-10">
                {notification && (
                    <div className={`mb-4 p-4 rounded-xl flex items-center justify-between shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <span className="font-bold flex items-center gap-2">
                            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {notification.message}
                        </span>
                        <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black">{squadData.school.name}</h1>
                            {isGeneral && (
                                <span className="bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-500 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <Crown className="w-3 h-3" /> General
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {squadData.school.membersCount} Soldiers</span>
                            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400"><Shield className="w-4 h-4" /> {squadData.school.points.toLocaleString()} Points</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/war-history?schoolId=${squadData.school.id}`} className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" /> War History
                        </Link>
                        <Link href="/war" className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-500/30 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                            <Swords className="w-4 h-4" /> War Room
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                
                {/* Left Col: Roster & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Action Bar */}
                    <div className="flex justify-end mb-2">
                        {isGeneral ? (
                            <button onClick={handleDisbandSchool} disabled={actionLoading} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Disband Faction
                            </button>
                        ) : (
                            <button onClick={handleLeaveSchool} disabled={actionLoading} className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                                <X className="w-3.5 h-3.5" /> Leave Faction
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Active Roster
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none">
                        {squadData.members?.map((m: any, i: number) => (
                            <div key={m.id} className={`p-4 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${m.isMe ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold flex items-center gap-2 text-base">
                                            {m.isMe ? 'You' : m.name}
                                            {m.role === 'General' && <Crown className="w-3.5 h-3.5 text-amber-500 ml-1" />}
                                        </div>
                                        <div className="text-xs font-medium text-slate-500 mt-0.5 capitalize">{m.role}</div>
                                    </div>
                                </div>
                                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg text-sm">
                                    {m.points.toLocaleString()} pts
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Leadership Log */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Leadership Log
                    </h2>
                    
                    {!isGeneral ? (
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-lg">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="font-bold mb-1">Restricted Area</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Only the General has access to the leadership log and recruit approvals.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Requests Queue */}
                            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 dark:bg-amber-500/5 blur-3xl pointer-events-none" />
                                <h3 className="font-black mb-4 relative z-10 flex items-center gap-2">
                                    Pending Recruits
                                    {requests.length > 0 && (
                                        <span className="bg-amber-500 text-white dark:text-slate-950 text-xs px-2 py-0.5 rounded-full shadow-sm">{requests.length}</span>
                                    )}
                                </h3>
                                
                                {requests.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No pending requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative z-10">
                                        {requests.map(req => (
                                            <div key={req.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                        <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold leading-tight">{req.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-medium">Lvl {req.classGrade} • {req.points.toLocaleString()} pts</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => reviewRequest(req.id, 'reject')}
                                                        disabled={reviewState[req.id] === 'loading' || reviewState[req.id] === 'done'}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/30 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 rounded-xl transition-all shadow-sm dark:shadow-none"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => reviewRequest(req.id, 'approve')}
                                                        disabled={reviewState[req.id] === 'loading' || reviewState[req.id] === 'done'}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 text-xs font-bold py-2 rounded-xl transition-all"
                                                    >
                                                        {reviewState[req.id] === 'loading' ? 'Approving...' : 'Approve'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
