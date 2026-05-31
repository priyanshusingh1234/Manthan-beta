import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
"use client";

import { useState, useEffect } from "react";
import { Link } from 'expo-router';
import { Link2, Search, Zap, ShieldAlert, Target, Play, Shield, User as UserIcon, Swords, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { supabase } from "@/lib/supabaseClient";

export default function WarLobbyDynamic() {
  const [session, setSession] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>({ name: "Loading...", membersCount: 0, points: 0 });
  const [squad, setSquad] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [wars, setWars] = useState<any[]>([]);
  const [globalStandings, setGlobalStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [declaringWar, setDeclaringWar] = useState(false);
  const [warError, setWarError] = useState<string | null>(null);
  const [warSuccessData, setWarSuccessData] = useState<any>(null);
  const [isGeneral, setIsGeneral] = useState(false);
  const [selectedTeamSize, setSelectedTeamSize] = useState<number>(5);
  const [selectedWarMemberIds, setSelectedWarMemberIds] = useState<string[]>([]);
  const teamSizeOptions = [5, 10, 15, 20, 25, 30];
  const [nowMs, setNowMs] = useState(Date.now());
  const [hasNoSchool, setHasNoSchool] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData(session.access_token);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData(session.access_token);
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const rosterIds = roster.map((m: any) => String(m.id));
    if (!rosterIds.length) {
      setSelectedWarMemberIds([]);
      return;
    }

    setSelectedWarMemberIds((prev) => {
      const kept = prev.filter((id) => rosterIds.includes(id));
      let next = [...kept];

      if (next.length < selectedTeamSize) {
        const needed = selectedTeamSize - next.length;
        const fill = rosterIds.filter((id) => !next.includes(id)).slice(0, needed);
        next = [...next, ...fill];
      } else if (next.length > selectedTeamSize) {
        next = next.slice(0, selectedTeamSize);
      }

      return next;
    });
  }, [roster, selectedTeamSize]);

  const formatLiveTimeLeft = (war: any) => {
    if ((war.status === 'searching' || war.status === 'preparation') && war.declared_at) {
      const declaredAt = new Date(war.declared_at).getTime();
      const phaseEnd = declaredAt + 10 * 60 * 1000;
      const diff = phaseEnd - nowMs;
      if (diff <= 0) return war.status === 'searching' ? 'Matching...' : 'Starting...';
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      return `${m}m ${s}s`;
    }

    if ((war.status === 'active' || war.status === 'calculating') && war.ends_at) {
      const diff = new Date(war.ends_at).getTime() - nowMs;
      if (diff <= 0) return 'Ended';
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m ${s}s`;
    }

    return war.timeLeft || '--';
  };

  const fetchData = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/squad', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      const json = await res.json();
      if (res.ok) {
        setHasNoSchool(false);
        setSchoolData(json.school);
        const { data: { user } } = await supabase.auth.getUser();
        setIsGeneral(json.squad?.general_id === user?.id);
        // Fetch active wars if school exists
        if (json.school?.id) {
          const warRes = await fetch(`/api/war?school_id=${json.school.id}`, { cache: 'no-store' });
          const warJson = await warRes.json();
          if (warRes.ok) setWars(warJson.wars || []);
        }
        setSquad(json.squad);
        setRoster(json.members || []);
        setGlobalStandings(json.globalStandings || []);
      } else {
        if (res.status === 400 && (json.error === 'No school assigned' || json.error === 'School not found in database')) {
          setHasNoSchool(true);
        }
        console.error("Failed to load squad:", json.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!session) return;
    setCreating(true);
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchData(session.access_token);
      } else {
        const json = await res.json();
        alert(json.error || "Failed to create squad.");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating squad.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeclareWar = async () => {
    if (!session || !isGeneral) return;
    setDeclaringWar(true);
    setWarError(null);
    setWarSuccessData(null);
    try {
      const res = await fetch('/api/war', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_size: selectedTeamSize, selected_member_ids: selectedWarMemberIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setWarSuccessData(data.war);
        await fetchData(session.access_token); // Refresh war list
        // Hide animation after 5 seconds
        setTimeout(() => setWarSuccessData(null), 5000);
      } else {
        setWarError(data.error || 'Failed to declare war.');
      }
    } catch {
      setWarError('Network error.');
    } finally {
      setDeclaringWar(false);
    }
  };

  const toggleWarMember = (memberId: string) => {
    if (!isGeneral || declaringWar) return;

    setSelectedWarMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }
      if (prev.length >= selectedTeamSize) {
        return prev;
      }
      return [...prev, memberId];
    });
  };
  const copyInviteLink = () => {
    // Generate a theoretical invite link. We will implement /api/squad/join later
    const link = `${window.location.origin}/invite?squad=${squad?.id}`;
    if (!navigator?.clipboard) {
      alert("Clipboard is not available on this device.");
      return;
    }

    navigator.clipboard
      .writeText(link)
      .then(() => alert("WhatsApp invite link copied to clipboard!"))
      .catch(() => alert("Could not copy the invite link. Please copy it manually."));
  };

    if (loading) {
        return (
            <View className="min-h-[100svh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center pb-[calc(80px+env(safe-area-inset-bottom))] flex-row">
                <View className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></View>
            </View>
        );
    }

    if (!session) {
        return (
            <View className="min-h-[100svh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-5 text-center text-slate-900 dark:text-slate-100">
                <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                <Text className="text-3xl font-black mb-2 text-red-600 dark:text-red-500">RESTRICTED ACCESS</Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">You must log in to access the War Room.</Text>
                <Link href="/login" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Log in</Link>
            </View>
        );
    }

    if (hasNoSchool) {
        return (
            <View className="min-h-[100svh] bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                {/* Background effects */}
                <View className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                <View className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
                <View className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/10 blur-[120px] rounded-full" />

                <View 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 max-w-md w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/30 p-10 rounded-[3rem] shadow-2xl"
                >
                    <View className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30 rotate-3 group hover:rotate-0 transition-transform flex-row">
                        <ShieldAlert className="w-12 h-12 text-white" />
                    </View>

                    <Text className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">
                        Neutral Territory
                    </Text>
                    
                    <Text className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                        The War Room is reserved for schools. You must list your faction before you can scout rivals or declare conflict.
                    </Text>

                    <View className="space-y-4">
                        <Link 
                            href="/profile" 
                            className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-1 active:scale-95"
                        >
                            ENLIST IN A SCHOOL
                        </Link>
                        
                        <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 py-2 rounded-lg">
                            REQUIRES VALID SCHOOL ASSIGNMENT
                        </Text>
                    </View>
                </View>
                
                <Link href="/feed" className="mt-8 text-sm font-bold text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-2 flex-row">
                    ← Return to safety
                </Link>
            </View>
        );
    }

  return (
    <>
    {/* Full Screen War Declaration Overlay */}
    {warSuccessData && (
      <View className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden perspective-1000">
        <View className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></View>
        <View className="absolute top-0 left-0 w-full h-full bg-red-600/20 mix-blend-color-burn" />

        {/* Diagonal caution stripes animation */}
        <View className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 20px, #ff0000 20px, #ff0000 40px)" }}></View>

        <View 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <View 
             animate={{ rotate: 360 }} 
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="w-48 h-48 border-4 border-red-500/30 border-t-red-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_100px_rgba(239,68,68,0.3)] flex-row"
          >
             <Swords className="w-20 h-20 text-red-500 animate-pulse" />
          </View>
          
          <Text className="text-4xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-red-500 tracking-tighter drop-shadow-2xl mb-4 text-center px-4">
            {warSuccessData.status === 'searching' ? 'INITIATING WAR' : 'WAR DECLARED'}
          </Text>
          
          {warSuccessData.status === 'searching' ? (
             <View className="flex flex-col items-center mt-8">
               <View className="text-xl sm:text-2xl font-bold text-slate-300 mb-2 uppercase tracking-widest flex items-center gap-3 flex-row">
                 <Search className="w-6 h-6 animate-spin-slow text-indigo-400" /> SEARCHING FOR OPPONENT
               </View>
             </View>
          ) : (
             <View className="flex flex-col items-center mt-8 space-y-4">
                <View className="text-2xl font-bold text-slate-400">YOUR SQUAD</View>
                <View className="text-4xl text-white font-black">VS</View>
                <View className="text-4xl font-black text-red-500 text-center uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] px-4">
                  {warSuccessData.opponent || "RIVAL SCHOOL"}
                </View>
             </View>
          )}
        </View>
      </View>
    )}

    <View className="min-h-[100svh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-[calc(112px+env(safe-area-inset-bottom))] pt-[calc(10px+env(safe-area-inset-top))] sm:pt-8 md:pt-10 relative overflow-x-hidden native-scroll">
      <View className="pointer-events-none absolute -top-32 -left-20 w-[34rem] h-[34rem] rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl mix-blend-overlay" />
      <View className="pointer-events-none absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full bg-red-400/10 dark:bg-red-500/10 blur-3xl mix-blend-overlay" />
      
      {/* Header Content */}
      <View className="max-w-7xl mx-auto px-3 sm:px-6 mb-6 sm:mb-8 relative z-10 native-page-shell">
        <View className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <View>
            <Text className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 dark:from-red-500 via-orange-600 dark:via-orange-500 to-amber-500 dark:to-amber-400 bg-clip-text text-transparent">
              WAR ROOM
            </Text>
            <View className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold flex-row">
              <Text className="text-slate-900 dark:text-white">{schoolData?.name}</Text>
              <Text className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700" />
              <Text>{schoolData?.points} POWER</Text>
            </View>
          </View>

          <View className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch gap-2">
            <select
              value={selectedTeamSize}
              onChange={(e) => setSelectedTeamSize(Number(e.target.value))}
              disabled={!squad || !isGeneral || declaringWar || wars.filter(w => ['active', 'searching', 'preparation', 'calculating'].includes(w.status)).length > 0}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
              title="War team size"
            >
              {teamSizeOptions.map((size) => (
                <option key={size} value={size} disabled={roster.length < size}>
                  {size}v{size} {roster.length < size ? `(need ${size})` : ''}
                </option>
              ))}
            </select>

            <View
              disabled={!squad || !isGeneral || declaringWar || wars.filter(w => ['active', 'searching', 'preparation', 'calculating'].includes(w.status)).length > 0 || roster.length < selectedTeamSize || selectedWarMemberIds.length !== selectedTeamSize}
              onPress={handleDeclareWar}
              className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group shadow-xl shadow-red-600/20 active:scale-95 flex-row"
              title={
                !squad ? 'No squad found for your school' :
                !isGeneral ? 'Only the General can declare war' :
                roster.length < selectedTeamSize ? `Need at least ${selectedTeamSize} squad members` :
                selectedWarMemberIds.length !== selectedTeamSize ? `Select exactly ${selectedTeamSize} members to deploy` :
                wars.filter(w => ['active', 'searching', 'preparation', 'calculating'].includes(w.status)).length > 0 ? 'Already in an ongoing war' :
                'Find and challenge a rival school'
              }
            >
              <Target className="w-4 h-4 group-hover:animate-pulse" />
              {declaringWar ? 'Searching...' : `Declare ${selectedTeamSize}v${selectedTeamSize}`}
            </View>
          </View>
          {isGeneral && squad && (
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 sm:mt-0 native-compact-text">
              Deploying: <Text className="text-slate-900 dark:text-white">{selectedWarMemberIds.length}/{selectedTeamSize}</Text> selected.
            </Text>
          )}
        </View>
      </View>

      {/* Notification Banners */}
      {warError && (
        <View className="bg-red-500/10 border-b border-red-500/30 text-red-600 dark:text-red-400 text-center py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 flex-row">
          <AlertCircle className="w-4 h-4" /> {warError}
        </View>
      )}

      <View className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 grid lg:grid-cols-3 gap-4 sm:gap-8 relative z-10 native-page-shell">
        {/* Left Column: My Squad */}
        <View className="lg:col-span-2 space-y-8">
          {/* Active Squad Builder */}
          <View className="bg-gradient-to-br from-white dark:from-slate-900 via-slate-50 dark:via-slate-900 to-slate-100 dark:to-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 relative overflow-hidden transition-all duration-500 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 shadow-lg native-card">
            <View className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/15 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

            <View className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-8 relative z-10">
              <View>
                <Text className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-row">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  Elite Squad
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-sm leading-relaxed">Your 30-member war squad. Build depth and pick your battle size wisely.</Text>
              </View>
              <View className="mt-4 sm:mt-0 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-full text-xs font-bold font-mono shadow-inner">
                {roster.length}/30 RECRUITED
              </View>
            </View>

            {!squad ? (
              <View className="text-center py-12 border-2 text-slate-600 dark:text-stone-300 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl relative z-10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                <ShieldAlert className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your school has no leader.</Text>
                <Text className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">Claim the title of General and form your squad before a rival school takes overhead control.</Text>
                <View
                  onPress={handleCreateSquad}
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto disabled:opacity-50 flex-row"
                >
                  <Target className="w-6 h-6" /> {creating ? "Establishing Governance..." : "Establish Squad Governance"}
                </View>
              </View>
            ) : (
              <>
                <View className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative z-10 max-h-[62vh] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {roster.map((member) => (
                    <View
                      key={member.id}
                      whileHover={{ y: -2 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onPress={() => toggleWarMember(String(member.id))}
                      className={`p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-800/60 ${selectedWarMemberIds.includes(String(member.id)) ? 'ring-2 ring-red-500/70 border-red-300 dark:border-red-500/40' : ''} ${member.isMe ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-900/20' : 'border-slate-200 dark:border-white/10'} ${isGeneral ? 'cursor-pointer' : ''} transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm native-card`}
                    >
                      {(() => {
                        const displayName = member?.name?.trim() || "Unknown";
                        const selectedForWar = selectedWarMemberIds.includes(String(member.id));
                        return (
                          <>
                      <View className="flex justify-between items-start mb-4 flex-row">
                        <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg text-lg flex-row">
                          {displayName.charAt(0).toUpperCase()}
                        </View>
                        <View className="flex items-center gap-1.5 flex-row">
                          {selectedForWar && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                          {member.role === "General" ? <Shield className="w-5 h-5 text-amber-500 drop-shadow-md" /> : <UserIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                        </View>
                      </View>
                      <View className="font-bold text-slate-900 dark:text-white truncate text-lg tracking-tight">
                        {displayName}
                        {member.isMe && <Text className="text-xs ml-2 text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full inline-block mt-1">You</Text>}
                      </View>
                      <View className="flex items-center justify-between mt-3 text-sm flex-row">
                        <Text className={`font-black uppercase tracking-wider text-xs ${member.role === 'General' ? 'text-amber-500' : 'text-slate-500'}`}>{member.role}</Text>
                        <Text className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">{member.points} pts</Text>
                      </View>
                          </>
                        );
                      })()}
                    </View>
                  ))}

                  {/* Empty slots placeholders (Show up to 3 empty boxes to prompt adding) */}
                  {Array.from({ length: Math.min(3, 30 - roster.length) }).map((_, i) => (
                    <View key={`empty-${i}`} className="h-[142px] p-5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer group shadow-sm dark:shadow-none">
                      <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center transition-all mb-3 group-hover:scale-110 flex-row">
                        <Search className="w-5 h-5" />
                      </View>
                      <View className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Draft Soldier</View>
                      <View className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider font-bold">Unfilled Position</View>
                    </View>
                  ))}
                </View>

                {/* Invite Link */}
                <View className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-500/30 relative z-10 gap-4 sm:gap-0 shadow-sm">
                  <View className="flex items-center gap-4 flex-row">
                    <View className="bg-indigo-50 dark:bg-indigo-500/20 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 shadow-inner block">
                      <Link2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </View>
                    <View>
                      <View className="text-sm font-bold text-slate-900 dark:text-white">Poach Students</View>
                      <View className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Send a link to classmates to steal points for your school</View>
                    </View>
                  </View>
                  <View onPress={copyInviteLink} className="w-full sm:w-auto text-sm font-black bg-white text-slate-900 px-6 py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10 hover:shadow-white/20 active:scale-95 flex-row">
                    Copy Draft Link
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Active Conflicts */}
          <View>
            <Text className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-4">Active & Pending Deployments</Text>
            <View className="space-y-4">
              {wars.length === 0 ? (
                <View className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[250px] shadow-sm">
                  <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700 shadow-inner flex-row">
                    <Zap className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                  </View>
                  <Text className="font-bold text-lg mb-1">Peacetime Maintained</Text>
                  <Text className="text-sm text-slate-500 max-w-xs mx-auto">No rival schools have challenged {schoolData?.name} recently. Establish your squad to go on the offensive.</Text>
                </View>
              ) : (
                wars.map(war => (
                  <View key={war.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-colors shadow-lg ${war.status === 'searching' ? 'border-indigo-200 dark:border-indigo-500/50 hover:border-indigo-400 shadow-indigo-500/10' : war.status === 'preparation' ? 'border-amber-200 dark:border-amber-500/50 hover:border-amber-400 shadow-amber-500/10' : war.status === 'calculating' ? 'border-fuchsia-200 dark:border-fuchsia-500/50 hover:border-fuchsia-400 shadow-fuchsia-500/10' : 'border-red-200 dark:border-red-500/40 hover:border-red-400 shadow-red-500/10'}`}>
                    <View className="flex items-center gap-4 sm:gap-6 w-full min-w-0 flex-row">
                      <View className="text-center flex flex-col items-center flex-shrink-0">
                        <View className={`text-[10px] font-black uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded inline-block ${war.status === 'searching' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20' : war.status === 'preparation' ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/20' : war.status === 'calculating' ? 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/20' : 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/20'}`}>
                          {war.status === 'searching' ? 'QUEUE' : war.isChallenger ? 'INITIATOR' : 'TARGET'}
                        </View>
                        <View className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border bg-slate-50 dark:bg-slate-800 ${war.status === 'searching' ? 'border-indigo-200 dark:border-indigo-500/30 text-indigo-500 dark:text-indigo-400 animate-pulse' : war.status === 'calculating' ? 'border-fuchsia-200 dark:border-fuchsia-500/30 text-fuchsia-500 dark:text-fuchsia-400 animate-pulse' : 'border-red-200 dark:border-red-500/30 text-red-500 shadow-inner'}`}>
                           {war.status === 'searching' ? <Search className="w-5 h-5 animate-spin-slow" /> : war.status === 'calculating' ? <Zap className="w-5 h-5 animate-pulse" /> : <ShieldAlert className="w-5 h-5" />}
                        </View>
                      </View>
                      <View className="min-w-0 flex-1 flex-row">
                        <Text className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">{war.opponent || 'Finding Rival...'}</Text>
                        <View className="flex items-center gap-3 mt-1.5 flex-row">
                           <Text className={`text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded w-fit ${war.status === 'searching' ? 'bg-indigo-500/20 text-indigo-400' : war.status === 'preparation' ? 'bg-amber-500/20 text-amber-500 animate-pulse' : war.status === 'calculating' ? 'bg-fuchsia-500/20 text-fuchsia-400 animate-pulse' : 'bg-red-500/20 text-red-500'}`}>
                             {war.status === 'searching' ? 'MATCHMAKING' : war.status === 'preparation' ? 'STRATEGY' : war.status === 'calculating' ? 'CALCULATING' : 'COMBAT'}
                           </Text>
                           <Text className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-row">
                             ⏱ {formatLiveTimeLeft(war)}
                           </Text>
                        </View>
                      </View>
                    </View>
 
                    <View className="w-full sm:w-auto flex flex-col items-center gap-3 sm:border-l sm:border-slate-800 sm:pl-6 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                      {war.status === 'preparation' && (
                        <Link href={`/war-prep/${war.id}`} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-900/40 flex-row">
                          <Target className="w-3.5 h-3.5" /> Pick Questions
                        </Link>
                      )}
 
                      {war.status === 'active' && (
                        <Link href={`/war-battle/${war.id}`} className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/50 flex-row">
                          <Swords className="w-3.5 h-3.5" /> Battle Area
                        </Link>
                      )}
 
                      {war.status === 'calculating' && (
                        <View className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border border-fuchsia-200 dark:border-fuchsia-500/30 flex-row">
                          <Zap className="w-3.5 h-3.5 animate-pulse" /> Finalizing...
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Right Column: Global Standings Widget */}
        <View className="space-y-6">
          <View className="bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden h-full native-card">
            <View className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-100 dark:bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none -mr-32 -mt-32" />

            <Text className="text-lg font-black text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/5 pb-4 flex items-center gap-2 flex-row">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Global Domination
            </Text>

            <View className="space-y-3 relative z-10">
              {globalStandings.length === 0 && <Text className="text-slate-500 text-sm text-center py-4 font-medium block">Ranking algorithms calculating...</Text>}

              {globalStandings.map(school => (
                <View key={`${school.id}-${school.rank}`} className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${school.isMe ? "bg-indigo-50 dark:bg-indigo-500/20 border-2 border-indigo-200 dark:border-indigo-500 shadow-md shadow-indigo-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border-2 border-transparent dark:bg-slate-950/30"
                  }`}>
                  <View className="flex items-center gap-4 flex-row">
                    <View className={`font-mono font-black text-lg w-8 text-center bg-clip-text text-transparent ${school.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                      school.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-300 dark:to-slate-500' :
                        school.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 dark:from-amber-700 dark:to-amber-900' :
                          "bg-slate-400 dark:bg-slate-500"
                      }`}>
                      {school.rank}
                    </View>
                    <View className={`font-bold text-sm tracking-tight ${school.isMe ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                      {school.name}
                      {school.isMe && <View className="text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mt-1">Your Faction</View>}
                    </View>
                  </View>
                  <View className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">{(school.score || 0).toLocaleString()}</View>
                </View>
              ))}
            </View>

            <Link href="/top-schools" className="block w-full mt-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-black text-slate-900 dark:text-white transition-all text-center hover:-translate-y-0.5 relative z-10 border border-slate-200 dark:border-white/10">
              Full School Rankings →
            </Link>
          </View>
        </View>
      </View>
    </View>
    </>
  );
}
