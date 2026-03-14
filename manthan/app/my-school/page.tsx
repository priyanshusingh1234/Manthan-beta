"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Shield, Users, Swords, Plus, Crown, AlertCircle, Clock, CheckCircle, X, ChevronRight, User as UserIcon } from "lucide-react";
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
                headers: { 'Authorization': `Bearer ${token}` }
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
                await supabase.auth.refreshSession();
                await fetchMySquad(session.access_token);
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
            if (action === 'approve') fetchMySquad(session.access_token);
        } else {
            setReviewState(prev => ({ ...prev, [requestId]: 'idle' }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center pb-24">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-20 h-20 text-slate-800 mb-6" />
                <h1 className="text-3xl font-black text-white mb-2">Join the Battle</h1>
                <p className="text-slate-400 mb-8 max-w-sm">You must be logged in to view your school or establish a new faction.</p>
                <Link href="/login" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Log in</Link>
            </div>
        );
    }

    // No Faction View
    if (!squadData) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Join Existing */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Join a School</h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Search for your real-world school or a study group, send a join request, and become a soldier for their faction.
                        </p>
                        <Link href="/top-schools" className="mt-auto w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                            <Search className="w-5 h-5" /> Browse Schools
                        </Link>
                    </motion.div>

                    {/* Create New */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-indigo-500/50">
                            <Crown className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Found a Faction</h2>
                        <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                            Create a completely new group called a School. You will become the <span className="text-indigo-400 font-bold">General</span> and command its armies in War.
                        </p>
                        <div className="w-full mt-auto space-y-3 relative z-10">
                            <input
                                type="text"
                                value={newSchoolName}
                                onChange={e => setNewSchoolName(e.target.value)}
                                placeholder="Group Name (e.g. TPS Mavericks)"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
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
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-24">
            {/* Header */}
            <div className="border-b border-white/5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white">{squadData.school.name}</h1>
                            {isGeneral && (
                                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-500 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                    <Crown className="w-3 h-3" /> General
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {squadData.school.membersCount} Soldiers</span>
                            <span className="flex items-center gap-1.5 text-indigo-400"><Shield className="w-4 h-4" /> {squadData.school.points.toLocaleString()} Points</span>
                        </p>
                    </div>
                    <Link href="/war" className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/5 flex items-center gap-2">
                        <Swords className="w-4 h-4" /> War Room
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Col: Roster */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" /> Active Roster
                        </h2>
                    </div>
                    <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-2xl">
                        {squadData.members?.map((m: any, i: number) => (
                            <div key={m.id} className={`p-4 flex items-center justify-between transition-colors hover:bg-slate-800/50 ${m.isMe ? 'bg-indigo-500/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2 text-base">
                                            {m.isMe ? 'You' : m.name}
                                            {m.role === 'General' && <Crown className="w-3.5 h-3.5 text-amber-500 ml-1" />}
                                        </div>
                                        <div className="text-xs font-medium text-slate-500 mt-0.5 capitalize">{m.role}</div>
                                    </div>
                                </div>
                                <div className="font-mono font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg text-sm">
                                    {m.points.toLocaleString()} pts
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Leadership Log */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" /> Leadership Log
                    </h2>
                    
                    {!isGeneral ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-6 h-6 text-slate-500" />
                            </div>
                            <h3 className="text-white font-bold mb-1">Restricted Area</h3>
                            <p className="text-slate-400 text-sm">Only the General has access to the leadership log and recruit approvals.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Requests Queue */}
                            <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl" />
                                <h3 className="font-black text-white mb-4 relative z-10 flex items-center gap-2">
                                    Pending Recruits
                                    {requests.length > 0 && (
                                        <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                                    )}
                                </h3>
                                
                                {requests.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium">No pending requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative z-10">
                                        {requests.map(req => (
                                            <div key={req.id} className="bg-slate-950 border border-white/5 rounded-2xl p-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                        <UserIcon className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white leading-tight">{req.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-medium">Lvl {req.classGrade} • {req.points.toLocaleString()} pts</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => reviewRequest(req.id, 'reject')}
                                                        disabled={reviewState[req.id] === 'loading' || reviewState[req.id] === 'done'}
                                                        className="bg-slate-900 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-300 text-xs font-bold py-2 rounded-xl transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => reviewRequest(req.id, 'approve')}
                                                        disabled={reviewState[req.id] === 'loading' || reviewState[req.id] === 'done'}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 text-xs font-bold py-2 rounded-xl transition-all"
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
