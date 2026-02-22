import supabaseAdmin from "@/lib/supabaseAdmin";
import Link from "next/link";
import { Trophy, Medal, MapPin, Sparkles, Zap, Award } from "lucide-react";

export const revalidate = 0; // Always fetch fresh data

export default async function LeaderboardPage() {
  // Fetch all users and sort them by totalPoints
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  let students: any[] = [];

  if (!error && data?.users) {
    students = data.users
      .filter((u: any) => !u.user_metadata?.isTeacher) // strictly students
      .map((u: any) => {
        const meta = u.user_metadata || {};
        return {
          id: u.id,
          username: meta.username || null,
          name: meta.fullName || meta.full_name || meta.name || u.email || "Student",
          school: meta.school || "Unknown School",
          totalPoints: Number(meta.totalPoints) || 0,
          avatar: meta.avatar_url || meta.avatar || null,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .filter((u) => u.username) // Only show users with usernames set up
      .slice(0, 50); // Top 50
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-20 pt-6 sm:pt-10">

        {/* Page Header Area */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/50 text-indigo-700 text-xs font-bold mb-4 border border-indigo-200/50 shadow-sm animate-fade-in">
            <Trophy className="w-3.5 h-3.5" />
            Live Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3 drop-shadow-sm">
            Global Leaderboard
          </h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto text-sm md:text-base">
            The top brightest minds competing across schools. Earn points by solving questions and climbing the ranks.
          </p>
        </div>

        {/* Top 3 Podiums Area (Only display if we have at least 3 students) */}
        {students.length >= 3 && (
          <div className="hidden sm:flex justify-center items-end gap-4 mb-12 h-64">
            {/* 2nd Place */}
            <div className="relative flex flex-col items-center w-1/3 max-w-[200px] animate-slideUp" style={{ animationDelay: '100ms' }}>
              <div className="relative mb-3 group">
                <div className="absolute -inset-1 rounded-full bg-slate-200/50 animate-pulse-soft blur-sm"></div>
                <img src={students[1].avatar || `https://ui-avatars.com/api/?name=${students[1].name}&background=f8fafc&color=94a3b8`} alt={students[1].name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-200 shadow-xl relative z-10 bg-white" />
                <div className="absolute -bottom-3 -right-2 bg-slate-200 text-slate-700 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black shadow-md z-20">2</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg rounded-t-3xl rounded-b-xl w-full p-4 flex flex-col items-center border-t-4 border-t-slate-300">
                <span className="font-bold text-slate-800 text-center truncate w-full text-sm">{students[1].name}</span>
                <span className="text-slate-500 text-xs mt-0.5 truncate w-full text-center">@{students[1].username}</span>
                <div className="mt-3 bg-slate-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner border border-slate-100">
                  <Zap className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />
                  <span className="text-slate-700 font-black text-xs">{students[1].totalPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="relative flex flex-col items-center w-1/3 max-w-[220px] z-10 -translate-y-8 animate-slideUp">
              <div className="absolute -top-12 opacity-80 animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <div className="relative mb-3 group">
                <div className="absolute -inset-2 rounded-full bg-amber-400/30 animate-pulse blur-md"></div>
                <img src={students[0].avatar || `https://ui-avatars.com/api/?name=${students[0].name}&background=fef3c7&color=d97706`} alt={students[0].name} className="w-28 h-28 rounded-full object-cover border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] relative z-10 bg-white" />
                <div className="absolute -bottom-4 right-0 bg-gradient-to-br from-amber-300 to-amber-500 text-white w-10 h-10 rounded-full border-[3px] border-white flex items-center justify-center text-lg font-black shadow-lg z-20"><Medal className="w-5 h-5" /></div>
              </div>
              <div className="bg-white/90 backdrop-blur-2xl border border-amber-200/60 shadow-xl shadow-amber-500/10 rounded-t-[2rem] rounded-b-2xl w-full p-5 flex flex-col items-center border-t-[6px] border-t-amber-400">
                <span className="font-black text-slate-900 text-center truncate w-full text-base">{students[0].name}</span>
                <span className="text-amber-600/80 text-xs mt-0.5 truncate w-full text-center font-medium">@{students[0].username}</span>
                <div className="mt-4 bg-amber-50 px-4 py-2 rounded-full flex items-center gap-1.5 shadow-inner border border-amber-100/50">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-amber-700 font-black text-sm">{students[0].totalPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="relative flex flex-col items-center w-1/3 max-w-[200px] animate-slideUp" style={{ animationDelay: '200ms' }}>
              <div className="relative mb-3 group">
                <div className="absolute -inset-1 rounded-full bg-orange-200/50 animate-pulse-soft blur-sm"></div>
                <img src={students[2].avatar || `https://ui-avatars.com/api/?name=${students[2].name}&background=ffedd5&color=ea580c`} alt={students[2].name} className="w-20 h-20 rounded-full object-cover border-4 border-orange-300 shadow-xl relative z-10 bg-white" />
                <div className="absolute -bottom-3 -right-2 bg-gradient-to-br from-orange-300 to-orange-500 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black shadow-md z-20">3</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xl border border-orange-200/60 shadow-lg rounded-t-3xl rounded-b-xl w-full p-4 flex flex-col items-center border-t-4 border-t-orange-400">
                <span className="font-bold text-slate-800 text-center truncate w-full text-sm">{students[2].name}</span>
                <span className="text-orange-600/70 text-xs mt-0.5 truncate w-full text-center">@{students[2].username}</span>
                <div className="mt-3 bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner border border-orange-100/50">
                  <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span className="text-orange-700 font-black text-xs">{students[2].totalPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main List */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden relative">
          {students.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center">
              <Award className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg">No students found on the leaderboard yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-sm sm:text-base">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <th className="py-5 px-4 sm:px-6 w-16 text-center">#</th>
                    <th className="py-5 px-4 sm:px-6">Student</th>
                    <th className="py-5 px-4 sm:px-6 hidden md:table-cell">School</th>
                    <th className="py-5 px-4 sm:px-6 text-right w-32">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {students.map((student, index) => {
                    const rank = index + 1;

                    // Style logic for the rows
                    let rankBadge = '';
                    if (rank === 1) rankBadge = 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10';
                    else if (rank === 2) rankBadge = 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm shadow-slate-500/10';
                    else if (rank === 3) rankBadge = 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm shadow-orange-500/10';
                    else rankBadge = 'bg-transparent text-slate-400 border-transparent text-sm';

                    let rowHighlight = '';
                    if (rank === 1) rowHighlight = 'bg-amber-50/20';
                    else if (rank === 2) rowHighlight = 'bg-slate-50/30';
                    else if (rank === 3) rowHighlight = 'bg-orange-50/20';

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-blue-50/30 transition-all duration-200 group ${rowHighlight}`}
                      >
                        <td className="py-4 px-4 sm:px-6 flex items-center justify-center">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black border transition-transform group-hover:scale-110 ${rankBadge}`}>
                            {rank}
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3 sm:gap-4 outline-none group/user text-slate-900 pointer-events-none">
                            <div className="relative">
                              {student.avatar ? (
                                <img src={student.avatar} alt={student.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm border border-slate-200 transition-colors" />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold border border-indigo-100 shadow-sm">
                                  {String(student.name[0]).toUpperCase()}
                                </div>
                              )}
                              {rank <= 3 && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                  {rank === 1 && <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                  {rank === 2 && <Medal className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />}
                                  {rank === 3 && <Medal className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-sm sm:text-base truncate">{student.name}</div>
                              <div className="text-xs font-semibold text-slate-400 truncate mt-0.5">@{student.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium bg-slate-50 w-max px-3 py-1.5 rounded-lg border border-slate-100 truncate max-w-[200px] lg:max-w-full">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{student.school}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-sm border shadow-sm transition-all
                            ${rank <= 3 ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-slate-200/60' : 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-white'} 
                          `}>
                            {rank === 1 ? (
                              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 drop-shadow-sm" />
                            ) : rank === 2 ? (
                              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 fill-slate-400 drop-shadow-sm" />
                            ) : rank === 3 ? (
                              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 fill-orange-400 drop-shadow-sm" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 fill-indigo-100" />
                            )}
                            <span className={rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-slate-600' : rank === 3 ? 'text-orange-600' : 'text-slate-700'}>
                              {student.totalPoints.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
