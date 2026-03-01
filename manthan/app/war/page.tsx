"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Search, Zap, ShieldAlert, Target, Play, Shield, ArrowRight, User as UserIcon, Swords, AlertCircle, Clock } from "lucide-react";
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
  const [warSuccess, setWarSuccess] = useState<string | null>(null);
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
    setWarSuccess(null);
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
        setWarSuccess(`⚔️ War declared against ${data.war.opponent}! Battle ends in 24 hours.`);
        await fetchData(session.access_token); // Refresh war list
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
    navigator.clipboard.writeText(link);
    alert("WhatsApp invite link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <h1 className="text-3xl font-black text-red-500 mb-4">RESTRICTED ACCESS</h1>
        <p className="text-slate-400">You must log in to access the War Room.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-pointer">
              WAR ROOM
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <span className="font-bold text-white">{schoolData?.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span>{schoolData?.points} Global Power</span>
            </div>
          </div>

          <button
            disabled={!squad || !isGeneral || declaringWar || wars.filter(w => w.status === 'active').length > 0}
            onClick={handleDeclareWar}
            className="disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 group"
            title={!isGeneral ? 'Only the General can declare war' : wars.filter(w => w.status === 'active').length > 0 ? 'Already in an active war' : 'Find and challenge a rival school'}
          >
            <Target className="w-4 h-4 group-hover:animate-pulse" />
            {declaringWar ? 'Finding rival...' : 'Declare War'}
          </button>
        </div>
      </header>

      {/* Notification Banners */}
      {warSuccess && (
        <div className="bg-green-500/10 border-b border-green-500/30 text-green-400 text-center py-3 px-6 text-sm font-bold flex items-center justify-center gap-2">
          <Swords className="w-4 h-4" /> {warSuccess}
        </div>
      )}
      {warError && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-400 text-center py-3 px-6 text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> {warError}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left Column: My Squad */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Squad Builder */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 relative overflow-hidden transition-all duration-500 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  Elite Squad
                </h2>
                <p className="text-slate-400 text-sm mt-1 max-w-sm leading-relaxed">Your 50-man squad for the next global battle. Recruit heavily to prepare for Wars.</p>
              </div>
              <div className="mt-4 sm:mt-0 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-5 py-2 rounded-full text-xs font-bold font-mono shadow-inner">
                {roster.length}/50 RECRUITED
              </div>
            </div>

            {!squad ? (
              <div className="text-center py-12 border-2 text-stone-300 border-dashed border-slate-700 rounded-2xl relative z-10 bg-slate-900/50 hover:bg-slate-800/80 transition-colors">
                <ShieldAlert className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">Your school has no leader.</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8 font-medium">Claim the title of General and form your squad before a rival school takes overhead control.</p>
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
                      className={`p-5 rounded-2xl border bg-slate-800/50 ${member.isMe ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5'} transition-all hover:bg-slate-800`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        {member.role === "General" ? <Shield className="w-5 h-5 text-amber-500 drop-shadow-md" /> : <UserIcon className="w-5 h-5 text-slate-500" />}
                      </div>
                      <div className="font-bold text-white truncate text-lg tracking-tight">
                        {member.name}
                        {member.isMe && <span className="text-xs ml-2 text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full inline-block mt-1">You</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <span className={`font-black uppercase tracking-wider text-[10px] ${member.role === 'General' ? 'text-amber-500' : 'text-slate-500'}`}>{member.role}</span>
                        <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">{member.points} pts</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Empty slots placeholders (Show up to 3 empty boxes to prompt adding) */}
                  {Array.from({ length: Math.min(3, 50 - roster.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-[142px] p-5 rounded-2xl border bg-slate-900/50 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
                      <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 text-slate-500 group-hover:text-indigo-400 flex items-center justify-center transition-all mb-3 group-hover:scale-110">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-400 group-hover:text-white transition-colors">Draft Solider</div>
                      <div className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider font-bold">Unfilled Position</div>
                    </div>
                  ))}
                </div>

                {/* Invite Link */}
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl bg-slate-950/50 border border-indigo-500/30 relative z-10 gap-4 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-500/20 p-2.5 rounded-lg border border-indigo-500/30 shadow-inner block">
                      <Link2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Poach Students</div>
                      <div className="text-xs text-slate-400 mt-0.5">Send a link to classmates to steal points for your school</div>
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
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider border-b border-white/5 pb-4">Active Deployments</h3>
            <div className="space-y-4">
              {wars.length === 0 ? (
                <div className="bg-slate-900/50 border border-white/5 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[250px]">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-inner">
                    <Zap className="w-8 h-8 text-slate-600" />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">Peacetime Maintained</h4>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">No rival schools have challenged {schoolData?.name} recently. Establish your squad to go on the offensive.</p>
                </div>
              ) : (
                wars.map(war => (
                  <div key={war.id} className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-red-500/50 transition-colors shadow-lg shadow-red-500/5">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs text-red-500 font-black uppercase tracking-widest mb-2 bg-red-500/10 px-2 py-0.5 rounded inline-block">CHALLENGER</div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 animate-pulse border border-red-500/30 flex items-center justify-center" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white">{war.opponent}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded bg-red-500/20 text-red-500`}>
                            {war.status || 'Combat Live'}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">{war.timeLeft || '1h 22m'} remaining</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:border-l sm:border-slate-800 sm:pl-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-left sm:text-right flex-1">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Deployment Stake</div>
                        <div className="text-xl font-mono font-black text-amber-500">{war.stake || '0'} PTS</div>
                      </div>
                      <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-transform transform hover:scale-105 active:scale-95 shadow-xl shadow-red-900/50">
                        <Play className="w-4 h-4" /> Enter Battlefield
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Global Standings Widget */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none -mr-32 -mt-32" />

            <h3 className="text-lg font-black text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" /> Global Domination
            </h3>

            <div className="space-y-3 relative z-10">
              {globalStandings.length === 0 && <p className="text-slate-500 text-sm text-center py-4 font-medium block">Ranking algorithms calculating...</p>}

              {globalStandings.map(school => (
                <div key={`${school.id}-${school.rank}`} className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${school.isMe ? "bg-indigo-500/20 border-2 border-indigo-500" : "hover:bg-slate-800/50 border-2 border-transparent bg-slate-950/30"
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`font-mono font-black text-lg w-8 text-center bg-clip-text text-transparent ${school.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-amber-600' :
                      school.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                        school.rank === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-900' :
                          "bg-slate-500"
                      }`}>
                      {school.rank}
                    </div>
                    <div className={`font-bold text-sm tracking-tight ${school.isMe ? "text-white" : "text-slate-300"}`}>
                      {school.name}
                      {school.isMe && <div className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold mt-1">Your Faction</div>}
                    </div>
                  </div>
                  <div className="font-mono font-black text-indigo-400 text-sm bg-indigo-500/10 px-2 py-1 rounded">{(school.score || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-black text-white transition-all flex items-center justify-center gap-2 relative z-10 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 outline-none focus:ring-2 focus:ring-indigo-500">
              Full Strategy Map <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
