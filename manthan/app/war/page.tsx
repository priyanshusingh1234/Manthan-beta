"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Link2, Search, Zap, ShieldAlert, Target, Play, Shield, User as UserIcon, Swords, AlertCircle } from "lucide-react";
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

  const fetchData = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/squad', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok) {
        setSchoolData(json.school);
        setIsGeneral(json.squad?.general_id === (await supabase.auth.getUser()).data.user?.id);
        // Fetch active wars if school exists
        if (json.school?.id) {
          const warRes = await fetch(`/api/war?school_id=${json.school.id}`);
          const warJson = await warRes.json();
          if (warRes.ok) setWars(warJson.wars || []);
        }
        setSquad(json.squad);
        setRoster(json.members || []);
        setGlobalStandings(json.globalStandings || []);
      } else {
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
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center pb-24">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-slate-100">
                <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                <h1 className="text-3xl font-black mb-2 text-red-600 dark:text-red-500">RESTRICTED ACCESS</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">You must log in to access the War Room.</p>
                <Link href="/login" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-indigo-500 transition-all">Log in</Link>
            </div>
        );
    }

  return (
    <>
    {/* Full Screen War Declaration Overlay */}
    {warSuccessData && (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden perspective-1000">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-red-600/20 mix-blend-color-burn" />

        {/* Diagonal caution stripes animation */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 20px, #ff0000 20px, #ff0000 40px)" }}></div>

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="w-48 h-48 border-4 border-red-500/30 border-t-red-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_100px_rgba(239,68,68,0.3)]"
          >
             <Swords className="w-20 h-20 text-red-500 animate-pulse" />
          </motion.div>
          
          <h1 className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-red-500 tracking-tighter drop-shadow-2xl mb-4 text-center">
            {warSuccessData.status === 'searching' ? 'INITIATING WAR' : 'WAR DECLARED'}
          </h1>
          
          {warSuccessData.status === 'searching' ? (
             <div className="flex flex-col items-center mt-8">
               <div className="text-xl sm:text-2xl font-bold text-slate-300 mb-2 uppercase tracking-widest flex items-center gap-3">
                 <Search className="w-6 h-6 animate-spin-slow text-indigo-400" /> SEARCHING FOR OPPONENT
               </div>
               <div className="text-sm font-mono text-indigo-400">Matchmaking weight: {Math.round(warSuccessData.myWeight || 0)}</div>
             </div>
          ) : (
             <div className="flex flex-col items-center mt-8 space-y-4">
                <div className="text-2xl font-bold text-slate-400">YOUR SQUAD</div>
                <div className="text-4xl text-white font-black">VS</div>
                <div className="text-4xl font-black text-red-500 text-center uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] px-4">
                  {warSuccessData.opponent || "RIVAL SCHOOL"}
                </div>
             </div>
          )}
        </motion.div>
      </div>
    )}

    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-4 sm:pt-8 md:pt-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-20 w-[34rem] h-[34rem] rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl mix-blend-overlay" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full bg-red-400/10 dark:bg-red-500/10 blur-3xl mix-blend-overlay" />
      
      {/* Header Content */}
      <div className="max-w-7xl mx-auto px-6 mb-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 dark:from-red-500 via-orange-600 dark:via-orange-500 to-amber-500 dark:to-amber-400 bg-clip-text text-transparent">
              WAR ROOM
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
              <span className="font-bold text-slate-900 dark:text-white">{schoolData?.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-700" />
              <span>{schoolData?.points} Global Power</span>
            </div>
          </div>

          <button
            disabled={!squad || !isGeneral || declaringWar || wars.filter(w => w.status === 'active').length > 0}
            onClick={handleDeclareWar}
            className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group shadow-sm dark:shadow-red-950/30"
            title={!isGeneral ? 'Only the General can declare war' : wars.filter(w => w.status === 'active').length > 0 ? 'Already in an active war' : 'Find and challenge a rival school'}
          >
            <Target className="w-4 h-4 group-hover:animate-pulse" />
            {declaringWar ? 'Finding rival...' : 'Declare War'}
          </button>
        </div>
      </div>

      {/* Notification Banners */}
      {warError && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-600 dark:text-red-400 text-center py-3 px-6 text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {warError}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Column: My Squad */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Squad Builder */}
          <div className="bg-gradient-to-br from-white dark:from-slate-900 via-slate-50 dark:via-slate-900 to-slate-100 dark:to-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden transition-all duration-500 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 shadow-lg">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/15 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  Elite Squad
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-sm leading-relaxed">Your 50-man squad for the next global battle. Recruit heavily to prepare for Wars.</p>
              </div>
              <div className="mt-4 sm:mt-0 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-full text-xs font-bold font-mono shadow-inner">
                {roster.length}/50 RECRUITED
              </div>
            </div>

            {!squad ? (
              <div className="text-center py-12 border-2 text-slate-600 dark:text-stone-300 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl relative z-10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                <ShieldAlert className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your school has no leader.</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">Claim the title of General and form your squad before a rival school takes overhead control.</p>
                <button
                  onClick={handleCreateSquad}
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
                >
                  <Target className="w-6 h-6" /> {creating ? "Establishing Governance..." : "Establish Squad Governance"}
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {roster.map((member) => (
                    <motion.div
                      key={member.id}
                      whileHover={{ y: -2 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-5 rounded-2xl border bg-white dark:bg-slate-800/60 ${member.isMe ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-900/20' : 'border-slate-200 dark:border-white/10'} transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm`}
                    >
                      {(() => {
                        const displayName = member?.name?.trim() || "Unknown";
                        return (
                          <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg text-lg">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        {member.role === "General" ? <Shield className="w-5 h-5 text-amber-500 drop-shadow-md" /> : <UserIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white truncate text-lg tracking-tight">
                        {displayName}
                        {member.isMe && <span className="text-xs ml-2 text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full inline-block mt-1">You</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <span className={`font-black uppercase tracking-wider text-[10px] ${member.role === 'General' ? 'text-amber-500' : 'text-slate-500'}`}>{member.role}</span>
                        <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">{member.points} pts</span>
                      </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  ))}

                  {/* Empty slots placeholders (Show up to 3 empty boxes to prompt adding) */}
                  {Array.from({ length: Math.min(3, 50 - roster.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-[142px] p-5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer group shadow-sm dark:shadow-none">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center transition-all mb-3 group-hover:scale-110">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Draft Soldier</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider font-bold">Unfilled Position</div>
                    </div>
                  ))}
                </div>

                {/* Invite Link */}
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-500/30 relative z-10 gap-4 sm:gap-0 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-500/20 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 shadow-inner block">
                      <Link2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Poach Students</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Send a link to classmates to steal points for your school</div>
                    </div>
                  </div>
                  <button onClick={copyInviteLink} className="w-full sm:w-auto text-sm font-black bg-white text-slate-900 px-6 py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10 hover:shadow-white/20 active:scale-95">
                    Copy Draft Link
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Active Conflicts */}
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-4">Active & Pending Deployments</h3>
            <div className="space-y-4">
              {wars.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[250px] shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700 shadow-inner">
                    <Zap className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Peacetime Maintained</h4>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">No rival schools have challenged {schoolData?.name} recently. Establish your squad to go on the offensive.</p>
                </div>
              ) : (
                wars.map(war => (
                  <div key={war.id} className={`bg-white dark:bg-slate-900/90 border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors shadow-lg ${war.status === 'searching' ? 'border-indigo-200 dark:border-indigo-500/50 hover:border-indigo-400 shadow-indigo-500/10' : war.status === 'preparation' ? 'border-amber-200 dark:border-amber-500/50 hover:border-amber-400 shadow-amber-500/10' : war.status === 'calculating' ? 'border-fuchsia-200 dark:border-fuchsia-500/50 hover:border-fuchsia-400 shadow-fuchsia-500/10' : 'border-red-200 dark:border-red-500/40 hover:border-red-400 shadow-red-500/10'}`}>
                    <div className="flex items-center gap-6">
                      <div className="text-center flex flex-col items-center">
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 px-2 py-0.5 rounded inline-block ${war.status === 'searching' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20' : war.status === 'preparation' ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/20' : war.status === 'calculating' ? 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/20' : 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/20'}`}>
                          {war.status === 'searching' ? 'MATCHMAKING' : war.isChallenger ? 'CHALLENGER' : 'DEFENDER'}
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border bg-slate-50 dark:bg-slate-800 ${war.status === 'searching' ? 'border-indigo-200 dark:border-indigo-500/30 text-indigo-500 dark:text-indigo-400 animate-pulse' : war.status === 'calculating' ? 'border-fuchsia-200 dark:border-fuchsia-500/30 text-fuchsia-500 dark:text-fuchsia-400 animate-pulse' : 'border-red-200 dark:border-red-500/30 text-red-500'}`}>
                           {war.status === 'searching' ? <Search className="w-6 h-6 animate-spin-slow" /> : war.status === 'calculating' ? <Zap className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{war.opponent || 'Searching for Match...'}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                           <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded w-fit ${war.status === 'searching' ? 'bg-indigo-500/20 text-indigo-400' : war.status === 'preparation' ? 'bg-amber-500/20 text-amber-500 animate-pulse' : war.status === 'calculating' ? 'bg-fuchsia-500/20 text-fuchsia-400 animate-pulse' : 'bg-red-500/20 text-red-500'}`}>
                             {war.status === 'searching' ? 'IN QUEUE' : war.status === 'preparation' ? 'PREPARING' : war.status === 'calculating' ? 'CALCULATING RESULT' : 'COMBAT LIVE'}
                           </span>
                           <span className="text-sm font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                             ⏱ {war.timeLeft}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:border-l sm:border-slate-800 sm:pl-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      {war.status !== 'searching' && (
                          <div className="text-center sm:text-right hidden sm:block">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 shadow-sm">War Format</div>
                            <div className="text-lg font-mono font-black text-white">{war.war_format} v {war.war_format}</div>
                          </div>
                      )}
                      
                      {war.status === 'searching' && (
                        <div className="text-center flex flex-col items-center justify-center px-4">
                           <div className="text-xs text-indigo-400 font-bold max-w-[150px]">Ghost protocol activates after 10m</div>
                        </div>
                      )}

                      {war.status === 'preparation' && (
                        <Link href={`/war-prep/${war.id}`} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform transform hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/40">
                          <Target className="w-4 h-4" /> Pick Questions
                        </Link>
                      )}

                      {war.status === 'active' && (
                        <Link href={`/war-battle/${war.id}`} className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform transform hover:scale-105 active:scale-95 shadow-xl shadow-red-900/50">
                          <Swords className="w-4 h-4" /> Enter Battlefield
                        </Link>
                      )}

                      {war.status === 'calculating' && (
                        <div className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 border border-fuchsia-200 dark:border-fuchsia-500/30">
                          <Zap className="w-4 h-4 animate-pulse" /> Finalizing Submissions...
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Global Standings Widget */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-100 dark:bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none -mr-32 -mt-32" />

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/5 pb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Global Domination
            </h3>

            <div className="space-y-3 relative z-10">
              {globalStandings.length === 0 && <p className="text-slate-500 text-sm text-center py-4 font-medium block">Ranking algorithms calculating...</p>}

              {globalStandings.map(school => (
                <div key={`${school.id}-${school.rank}`} className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${school.isMe ? "bg-indigo-50 dark:bg-indigo-500/20 border-2 border-indigo-200 dark:border-indigo-500 shadow-md shadow-indigo-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border-2 border-transparent dark:bg-slate-950/30"
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`font-mono font-black text-lg w-8 text-center bg-clip-text text-transparent ${school.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                      school.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-300 dark:to-slate-500' :
                        school.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 dark:from-amber-700 dark:to-amber-900' :
                          "bg-slate-400 dark:bg-slate-500"
                      }`}>
                      {school.rank}
                    </div>
                    <div className={`font-bold text-sm tracking-tight ${school.isMe ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                      {school.name}
                      {school.isMe && <div className="text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mt-1">Your Faction</div>}
                    </div>
                  </div>
                  <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">{(school.score || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <Link href="/top-schools" className="block w-full mt-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-black text-slate-900 dark:text-white transition-all text-center hover:-translate-y-0.5 relative z-10 border border-slate-200 dark:border-white/10">
              Full School Rankings →
            </Link>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
