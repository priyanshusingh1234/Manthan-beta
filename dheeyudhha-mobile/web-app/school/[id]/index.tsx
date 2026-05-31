"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from '@/lib/next-navigation';
import { supabase } from "@/lib/supabaseClient";
import { Shield, Users, Swords, Crown, Target, ChevronLeft, Globe, Award, Calendar, Handshake, CheckBadge, CheckCircle, Search, Zap, Flame, Skull, Crosshair } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function PublicSchoolPage() {
    const params = useParams();
    const router = useRouter();
    const schoolId = params.id as string;

    const [session, setSession] = useState<any>(null);
    const [mySchoolId, setMySchoolId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [warHistory, setWarHistory] = useState<any[]>([]);

    const [joinError, setJoinError] = useState("");
    // Join actions
    const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'requested'>('idle');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            if (currentSession?.user) {
                // Try metadata first
                let sid = currentSession.user.user_metadata?.school_id || null;
                if (!sid) {
                    supabase.from('profiles').select('school_id').eq('id', currentSession.user.id).maybeSingle().then(({ data }) => {
                        if (data?.school_id) setMySchoolId(data.school_id);
                    });
                } else {
                    setMySchoolId(sid);
                }
            }
        });

        const fetchAll = async () => {
            if (!schoolId) return;
            try {
                const [schoolRes, historyRes] = await Promise.all([
                    fetch(`/api/schools/${schoolId}`),
                    fetch(`/api/war/history?schoolId=${schoolId}`)
                ]);

                if (schoolRes.ok) {
                    const data = await schoolRes.json();
                    setSchoolInfo(data);
                }

                if (historyRes.ok) {
                    const hData = await historyRes.json();
                    setWarHistory(hData.wars || []);
                }
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [schoolId]);

    const handleJoinRequest = async () => {
        if (!session) {
            router.push('/login');
            return;
        }

        setJoinStatus('loading');
        setJoinError('');
        try {
            const res = await fetch('/api/schools/join', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'request', schoolId: schoolInfo?.school?.id })
            });
            const data = await res.json();

            if (res.ok) {
                setJoinStatus('requested');
            } else {
                setJoinStatus('idle');
                setJoinError(data.error || 'Failed to send request.');
            }
        } catch (e) {
            setJoinStatus('idle');
            setJoinError('Network error during request.');
        }
    };

    if (loading) {
        return (
            <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center pb-24 flex-row">
                <View className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></View>
            </View>
        );
    }

    if (!schoolInfo?.school) {
        return (
            <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Shield className="w-20 h-20 text-slate-300 dark:text-slate-800 mb-6" />
                <Text className="text-3xl font-black mb-2">Faction Not Found</Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">The school or faction you are looking for does not exist or has been disbanded.</Text>
                <Link href="/top-schools" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Back to Leaderboards</Link>
            </View>
        );
    }

    const { school, members } = schoolInfo;
    const isMySchool = mySchoolId === school.id;
    const isTeacher = session?.user?.user_metadata?.isTeacher === true;
    const formattedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(school.createdAt));

    if (isTeacher) {
        return (
            <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <Shield className="w-20 h-20 text-slate-300 dark:text-slate-800 mb-6" />
                <Text className="text-3xl font-black mb-2">Access Restricted</Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Teacher accounts are not permitted to view or join student factions to maintain fairness.</Text>
                <Link href="/top-schools" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Back to Leaderboards</Link>
            </View>
        );
    }

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

    return (
        <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-4 sm:pt-10">
            {/* Background Decor */}
            <View className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/50 dark:from-indigo-900/10 to-transparent pointer-events-none" />

            <View className="max-w-6xl mx-auto px-6 relative z-10">

                {/* Back Link */}
                <View className="mb-6">
                    <Link href="/top-schools" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-row">
                        <ChevronLeft className="w-4 h-4" /> Back to Leaderboards
                    </Link>
                </View>

                {/* Hero / Banner Area */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/40 dark:shadow-none mb-10 overflow-hidden relative">
                    <View className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

                    <View className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">

                        {/* School Identity */}
                        <View className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7 text-center sm:text-left">
                            <View className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-indigo-500/20 text-white border-4 border-white dark:border-slate-800 transform rotate-2 sm:rotate-0 flex-row">
                                {renderAvatarIcon(school.avatarUrl, "w-10 h-10 sm:w-14 sm:h-14 opacity-90")}
                            </View>
                            <View className="min-w-0 flex-1 flex-row">
                                <Text className="text-3xl sm:text-4xl font-black mb-2 tracking-tight truncate">{school.name}</Text>
                                <View className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mb-4 uppercase tracking-wider flex-row">
                                    <Text className="flex items-center gap-1.5 flex-row"><Globe className="w-3.5 h-3.5" /> Rank #{school.rank}</Text>
                                    <Text className="flex items-center gap-1.5 flex-row"><Users className="w-3.5 h-3.5" /> {school.memberCount} Squad</Text>
                                    <Text className="flex items-center gap-1.5 flex-row"><Calendar className="w-3.5 h-3.5" /> Est. {new Date(school.createdAt).getFullYear()}</Text>
                                </View>
                                <Text className="text-slate-600 dark:text-slate-300 max-w-xl text-sm leading-relaxed hidden sm:line-clamp-3">
                                    {school.description || `A premier faction on Dheeyudha dedicated to commanding intelligence and dominating the war room.`}
                                </Text>
                            </View>
                        </View>

                        {/* Call to Action Column */}
                        <View className="flex flex-col items-center sm:items-end gap-3 shrink-0 w-full sm:w-auto">
                            <View className="bg-indigo-600 text-white font-black px-6 py-2.5 rounded-2xl flex items-center gap-2.5 text-xl shadow-lg shadow-indigo-600/20 w-full sm:w-auto justify-center flex-row">
                                <Award className="w-5 h-5 text-amber-400" /> {school.points.toLocaleString()}
                            </View>

                            {isMySchool ? (
                                <Link href="/my-school" className="w-full sm:w-auto text-center bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:border-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 flex-row">
                                    <Shield className="w-4 h-4" /> View Base
                                </Link>
                            ) : (
                                <View
                                    onPress={handleJoinRequest}
                                    disabled={joinStatus !== 'idle'}
                                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-8 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 flex-row"
                                >
                                    {joinStatus === 'loading' ? 'Sending...' :
                                        joinStatus === 'requested' ? <><CheckCircle className="w-4 h-4" /> Sent</> :
                                            <><Swords className="w-4 h-4" /> Join Faction</>}
                                </View>
                            )}
                            {joinError && <Text className="text-red-500 text-[10px] font-bold w-full text-center mt-1 bg-red-500/10 px-2 py-1 rounded">{joinError}</Text>}
                        </View>

                    </View>
                    {/* Mobile description */}
                    <Text className="text-slate-600 dark:text-slate-300 mt-6 text-sm leading-relaxed sm:hidden relative z-10">
                        {school.description || `A premier faction on Dheeyudha dedicated to commanding intelligence and dominating the war room. They currently rank #${school.rank} in the world with a battle-hardened squad of ${school.memberCount} members.`}
                    </Text>
                </View>

                {/* Grid Layout: Roster & War History */}
                <View className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Active Roster */}
                    <View className="space-y-6">
                        <View className="flex items-center justify-between flex-row">
                            <Text className="text-2xl font-black flex items-center gap-2 flex-row">
                                <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" /> Active Roster
                            </Text>
                        </View>

                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none divide-y divide-slate-100 dark:divide-slate-800/50">
                            {members?.length === 0 ? (
                                <View className="p-8 text-center text-slate-500 font-medium">No soldiers have enlisted yet.</View>
                            ) : (
                                members?.map((m: any, i: number) => (
                                    <View key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors flex-row">
                                        <View className="flex items-center gap-4 flex-row">
                                            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-sm flex-row">
                                                {i + 1}
                                            </View>
                                            <View>
                                                <View className="font-bold flex items-center gap-2 text-base text-slate-900 dark:text-white flex-row">
                                                    {m.name}
                                                    {m.role === 'General' && <Crown className="w-4 h-4 text-amber-500 ml-1" />}
                                                </View>
                                                <View className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{m.role} • Lvl {m.classGrade}</View>
                                            </View>
                                        </View>
                                        <View className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg text-sm shadow-sm">
                                            {m.points.toLocaleString()}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    {/* War History Board */}
                    <View className="space-y-6 flex flex-col h-full items-stretch">
                        <View className="flex items-center justify-between flex-row">
                            <Text className="text-2xl font-black flex items-center gap-2 flex-row">
                                <Swords className="w-6 h-6 text-rose-500 dark:text-rose-400" /> War History
                            </Text>
                        </View>

                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/30 dark:shadow-none flex-1 flex flex-col overflow-hidden max-h-[600px] overflow-y-auto">
                            {warHistory.length === 0 ? (
                                <View className="text-center py-16 my-auto">
                                    <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                                    <Text className="text-slate-500 dark:text-slate-400 font-medium">This faction has not engaged in any wars yet.</Text>
                                </View>
                            ) : (
                                <View className="space-y-4">
                                    {warHistory.map((war) => {
                                        const isChallenger = war.challenger_school_id === school.id;
                                        const opponentName = isChallenger ? war.defender_school?.name : war.challenger_school?.name;
                                        const isLive = war.status === 'active' || war.status === 'preparation' || war.status === 'calculating';

                                        let resultBadge = null;
                                        if (war.status === 'completed') {
                                            if (war.winner_school_id === school.id) {
                                                resultBadge = <Text className="text-emerald-600 dark:text-emerald-400 font-black">W</Text>;
                                            } else if (war.winner_school_id) {
                                                resultBadge = <Text className="text-red-500 font-black">L</Text>;
                                            } else {
                                                resultBadge = <Text className="text-slate-400 font-black">D</Text>;
                                            }
                                        } else {
                                            resultBadge = <Text className="text-amber-500 font-black animate-pulse">●</Text>;
                                        }

                                        const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(war.declared_at));

                                        return (
                                            <View key={war.id} className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <View className="flex items-center gap-4 flex-row">
                                                    <View className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-lg shadow-sm flex-row">
                                                        {resultBadge}
                                                    </View>
                                                    <View>
                                                        <View className="font-bold flex items-center gap-2 text-sm flex-row">
                                                            <Text className="text-slate-400 text-xs italic">vs</Text> {opponentName || "Unknown"}
                                                        </View>
                                                        <View className="text-xs font-semibold text-slate-400 mt-0.5">{dateLabel}</View>
                                                    </View>
                                                </View>

                                                <View className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-1 rounded-xl w-full sm:w-auto mt-2 sm:mt-0 shadow-inner flex-shrink-0 flex-row">
                                                    <View className="flex-1 sm:px-3 text-center py-1 flex-row">
                                                        <View className="text-[8px] text-slate-400 uppercase font-black mb-0.5">Faction</View>
                                                        <View className={`font-mono text-xs sm:text-sm font-black ${war.status === 'completed' && war.winner_school_id === school.id ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {isChallenger ? war.challenger_score : war.defender_score}
                                                        </View>
                                                    </View>
                                                    <View className="w-px h-5 bg-slate-200 dark:bg-slate-800 self-center"></View>
                                                    <View className="flex-1 sm:px-3 text-center py-1 flex-row">
                                                        <View className="text-[8px] text-slate-400 uppercase font-black mb-0.5">Opponent</View>
                                                        <View className={`font-mono text-xs sm:text-sm font-black ${war.status === 'completed' && war.winner_school_id && war.winner_school_id !== school.id ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {!isChallenger ? war.challenger_score : war.defender_score}
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    })}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

            </View>
        </View>
    );
}
