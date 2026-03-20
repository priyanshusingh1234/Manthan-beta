import supabaseAdmin from "@/lib/supabaseAdmin";
import Link from "next/link";
import { Trophy, Medal, MapPin, Sparkles, Zap, Award } from "lucide-react";

export const revalidate = 0; // Always fetch fresh data

export default async function LeaderboardPage() {
  // Fetch all users and sort them by totalPoints with proper pagination
  let allUsers: any[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      pageSize: 1000,
      page: pageNum,
    });

    if (error || !data?.users) {
      console.error('Error fetching leaderboard users:', error);
      break;
    }

    allUsers = allUsers.concat(data.users);
    hasMore = data.users.length === 1000;
    pageNum++;
  }

  let students: any[] = [];

  if (allUsers.length > 0) {
    students = allUsers
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
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 relative overflow-hidden flex flex-col items-center">
      {/* Dynamic Background Blur effects */}
      <div className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent pointer-events-none" />

      <main className="w-full max-w-2xl px-4 relative z-20 pt-6">

        {/* Podium Display (Top 3) */}
        {students.length >= 3 && (
          <div className="flex justify-center items-end gap-2 sm:gap-6 mb-8 h-48 sm:h-60 mt-4 sm:mt-0">
            {/* 2nd Place */}
            <div className="relative flex flex-col items-center w-[30%] animate-slideUp" style={{ animationDelay: '100ms' }}>
              <div className="relative mb-2 group">
                <Link href={`/user/${students[1].username}`}>
                  <img src={students[1].avatar || `https://ui-avatars.com/api/?name=${students[1].name}&background=e2e8f0&color=475569`} alt={students[1].name} className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md relative z-10 bg-white" />
                </Link>
                <div className="absolute -bottom-1.5 right-0 bg-slate-200 text-slate-700 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center font-black shadow-sm text-[10px] z-20">2</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl w-full py-2 px-1 flex flex-col items-center">
                <Link href={`/user/${students[1].username}`} className="font-bold text-slate-800 dark:text-slate-200 text-center w-full text-[10px] sm:text-xs truncate">
                  {students[1].name}
                </Link>
                <span className="text-indigo-600 font-bold text-[10px] sm:text-xs mt-0.5">{students[1].totalPoints.toLocaleString()}</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="relative flex flex-col items-center w-[35%] z-10 -translate-y-4 sm:-translate-y-6 animate-slideUp">
              <div className="relative mb-2 group">
                <div className="absolute -inset-2 rounded-full bg-amber-400/20 animate-pulse blur-md"></div>
                <Link href={`/user/${students[0].username}`}>
                  <img src={students[0].avatar || `https://ui-avatars.com/api/?name=${students[0].name}&background=fef3c7&color=d97706`} alt={students[0].name} className="w-18 h-18 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] relative z-10 bg-white" />
                </Link>
                <div className="absolute -bottom-1.5 right-1 bg-gradient-to-br from-amber-400 to-amber-600 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[2px] border-white flex items-center justify-center font-black shadow-md text-xs z-20">1</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900 shadow-md rounded-xl w-full py-3 px-1 flex flex-col items-center border-t-2 border-amber-400">
                <Link href={`/user/${students[0].username}`} className="font-extrabold text-slate-900 dark:text-slate-100 text-center w-full text-xs sm:text-sm truncate">
                  {students[0].name}
                </Link>
                <span className="text-amber-600 dark:text-amber-400 font-black text-xs">{students[0].totalPoints.toLocaleString()}</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="relative flex flex-col items-center w-[30%] animate-slideUp" style={{ animationDelay: '200ms' }}>
              <div className="relative mb-2 group">
                <Link href={`/user/${students[2].username}`}>
                  <img src={students[2].avatar || `https://ui-avatars.com/api/?name=${students[2].name}&background=ffedd5&color=ea580c`} alt={students[2].name} className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md relative z-10 bg-white" />
                </Link>
                <div className="absolute -bottom-1.5 right-0 bg-orange-200 text-orange-800 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center font-black shadow-sm text-[10px] z-20">3</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl w-full py-2 px-1 flex flex-col items-center">
                <Link href={`/user/${students[2].username}`} className="font-bold text-slate-800 dark:text-slate-200 text-center w-full text-[10px] sm:text-xs truncate">
                  {students[2].name}
                </Link>
                <span className="text-indigo-600 font-bold text-[10px] sm:text-xs mt-0.5">{students[2].totalPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* List Header */}
        <div className="flex items-center justify-between mb-2 px-2">
           <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Top Players</h3>
           <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">Live</span>
        </div>

        {/* Scrollable Leaderboard List */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {students.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Award className="w-12 h-12 text-slate-300" />
              <p className="text-slate-500 font-medium">Rankings will appear here soon.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {students.slice(3).map((student, index) => {
                const rank = index + 4; // since we slice past top 3

                return (
                  <div key={student.id} className="flex items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    <div className="w-8 shrink-0 flex justify-center text-sm font-bold text-slate-400 dark:text-slate-500">
                      {rank}
                    </div>

                    <Link href={`/user/${student.username}`} className="relative shrink-0 ml-1">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-slate-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800">
                          {String(student.name[0]).toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div className="ml-3 flex-1 min-w-0">
                      <Link href={`/user/${student.username}`} className="font-bold text-[15px] text-slate-900 dark:text-slate-100 truncate">
                        {student.name}
                      </Link>
                      <div className="text-xs font-medium text-slate-500 truncate flex items-center gap-1">
                         <MapPin className="w-3 h-3 shrink-0" />
                         <span className="truncate">{student.school}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end pl-2">
                       <span className="font-bold text-slate-900 dark:text-white text-sm">{student.totalPoints.toLocaleString()}</span>
                       <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Points</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
