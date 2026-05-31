import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { getTopStudents } from "@/lib/profiles";
import BadgedName from "@/components/BadgedName";
import { Link } from 'expo-router';
import { MapPin, Award } from 'lucide-react-native';
import ClientRankBanner from "@/components/ClientRankBanner";

// ISR: regenerate this page every 20 minutes — matches the leaderboard API cache TTL.
// No need for force-dynamic; data is the same for all users.
export const revalidate = 1200;

// Inline avatar component: shows photo if available, first-letter fallback otherwise.
function AvatarOrInitial({ avatar, name, size, borderClass }: {
    avatar: string | null; name: string; size: string; borderClass: string;
}) {
    const initial = String(name[0] || '?').toUpperCase();
    if (avatar) {
        return (
            <Image
                src={avatar}
                alt={name}
                className={`${size} rounded-full object-cover border-4 relative z-10 bg-white ${borderClass}`}
            />
        );
    }
    // First-letter fallback — no external service needed
    const colors = [
        'bg-indigo-100 text-indigo-600', 'bg-violet-100 text-violet-600',
        'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700',
        'bg-rose-100 text-rose-600',
    ];
    const color = colors[initial.charCodeAt(0) % colors.length];
    return (
        <View className={`${size} rounded-full border-4 relative z-10 ${borderClass} ${color} flex items-center justify-center font-black text-xl`}>
            {initial}
        </View>
    );
}

export default async function LeaderboardPage() {
  const allStudents = await getTopStudents(50);
  
  const students = allStudents
    .map(p => ({
      id: p.id,
      username: p.username,
      name: p.full_name || p.username || "Student",
      school: p.school || "Unknown School",
      totalPoints: p.total_points,
      avatar: p.avatar_url || null,
      cosmetics: p.cosmetics || [],
    }));

  return (
    <View className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pb-24 relative overflow-hidden flex flex-col items-center">
      {/* Dynamic Background Blur effects */}
      <View className="absolute top-0 right-0 w-full h-[400px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent pointer-events-none" />

      <View 
        className="w-full max-w-2xl px-4 relative z-20"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >

        {/* Podium Display (Top 3) */}
        {students.length >= 3 && (
          <View className="flex justify-center items-end gap-2 sm:gap-6 mb-8 h-48 sm:h-60 mt-4 sm:mt-0 flex-row">
            {/* 2nd Place */}
            <View className="relative flex flex-col items-center w-[30%] animate-slideUp" style={{ animationDelay: '100ms' }}>
            <View className="relative mb-2 group flex justify-center items-center flex-row">
                <Link href={`/user/${students[1].username}`} className="relative">
                  {students[1].cosmetics?.includes('avatar_glow') && (
                     <View className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-70 animate-pulse"></View>
                  )}
                  <AvatarOrInitial
                    avatar={students[1].avatar}
                    name={students[1].name}
                    size="w-14 h-14 sm:w-20 sm:h-20"
                    borderClass={students[1].cosmetics?.includes('avatar_glow') ? 'border-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-white dark:border-slate-800 shadow-md'}
                  />
                </Link>
                <View className="absolute -bottom-1.5 right-0 bg-slate-200 text-slate-700 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center font-black shadow-sm text-[10px] z-20 flex-row">2</View>
              </View>
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl w-full py-2 px-1 flex flex-col items-center">
                <Link href={`/user/${students[1].username}`} className="w-full">
                  <BadgedName 
                    name={students[1].name}
                    userId={students[1].id}
                    rank={2}
                    totalPoints={students[1].totalPoints}
                    nameClassName="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200"
                    className="flex items-center justify-center gap-1 min-w-0 flex-row"
                  />
                </Link>
                <Text className="text-indigo-600 font-bold text-[10px] sm:text-xs mt-0.5">{students[1].totalPoints.toLocaleString()}</Text>
              </View>
            </View>

            {/* 1st Place */}
            <View className="relative flex flex-col items-center w-[35%] z-10 -translate-y-4 sm:-translate-y-6 animate-slideUp">
              <View className="relative mb-2 group flex justify-center items-center flex-row">
                <View className="absolute -inset-2 rounded-full bg-amber-400/20 animate-pulse blur-md"></View>
                <Link href={`/user/${students[0].username}`} className="relative">
                  {students[0].cosmetics?.includes('avatar_glow') && (
                     <View className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-lg opacity-80 animate-pulse"></View>
                  )}
                  <AvatarOrInitial
                    avatar={students[0].avatar}
                    name={students[0].name}
                    size="w-18 h-18 sm:w-24 sm:h-24"
                    borderClass={students[0].cosmetics?.includes('avatar_glow') ? 'border-transparent shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]'}
                  />
                </Link>
                <View className="absolute -bottom-1.5 right-1 bg-gradient-to-br from-amber-400 to-amber-600 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[2px] border-white flex items-center justify-center font-black shadow-md text-xs z-20 flex-row">1</View>
              </View>
              <View className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900 shadow-md rounded-xl w-full py-3 px-1 flex flex-col items-center border-t-2 border-amber-400">
                <Link href={`/user/${students[0].username}`} className="w-full">
                  <BadgedName 
                    name={students[0].name}
                    userId={students[0].id}
                    rank={1}
                    totalPoints={students[0].totalPoints}
                    nameClassName="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100"
                    className="flex items-center justify-center gap-1 min-w-0 flex-row"
                  />
                </Link>
                <Text className="text-amber-600 dark:text-amber-400 font-black text-xs">{students[0].totalPoints.toLocaleString()}</Text>
              </View>
            </View>

            {/* 3rd Place */}
            <View className="relative flex flex-col items-center w-[30%] animate-slideUp" style={{ animationDelay: '200ms' }}>
              <View className="relative mb-2 group flex justify-center items-center flex-row">
                <Link href={`/user/${students[2].username}`} className="relative">
                  {students[2].cosmetics?.includes('avatar_glow') && (
                     <View className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-70 animate-pulse"></View>
                  )}
                  <AvatarOrInitial
                    avatar={students[2].avatar}
                    name={students[2].name}
                    size="w-14 h-14 sm:w-20 sm:h-20"
                    borderClass={students[2].cosmetics?.includes('avatar_glow') ? 'border-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-white dark:border-slate-800 shadow-md'}
                  />
                </Link>
                <View className="absolute -bottom-1.5 right-0 bg-orange-200 text-orange-800 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center font-black shadow-sm text-[10px] z-20 flex-row">3</View>
              </View>
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl w-full py-2 px-1 flex flex-col items-center">
                <Link href={`/user/${students[2].username}`} className="w-full">
                  <BadgedName 
                    name={students[2].name}
                    userId={students[2].id}
                    rank={3}
                    totalPoints={students[2].totalPoints}
                    nameClassName="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200"
                    className="flex items-center justify-center gap-1 min-w-0 flex-row"
                  />
                </Link>
                <Text className="text-indigo-600 font-bold text-[10px] sm:text-xs mt-0.5">{students[2].totalPoints.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* List Header */}
        <View className="flex items-center justify-between mb-2 px-2 flex-row">
          <Text className="font-extrabold text-slate-900 dark:text-white text-lg">Top Players</Text>
          <Text className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">Live</Text>
        </View>

        {/* Scrollable Leaderboard List */}
        <View className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {students.length === 0 ? (
            <View className="p-12 text-center flex flex-col items-center gap-3">
              <Award className="w-12 h-12 text-slate-300" />
              <Text className="text-slate-500 font-medium">Rankings will appear here soon.</Text>
            </View>
          ) : (
            <View className="flex flex-col">
              {students.slice(3).map((student, index) => {
                const rank = index + 4; // since we slice past top 3

                return (
                  <View key={student.id} className="flex items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex-row">

                    <View className="w-8 shrink-0 flex justify-center text-sm font-bold text-slate-400 dark:text-slate-500 flex-row">
                      {rank}
                    </View>

                    <Link href={`/user/${student.username}`} className="relative shrink-0 ml-1">
                      {student.cosmetics?.includes('avatar_glow') && (
                          <View className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-sm opacity-70 animate-pulse"></View>
                      )}
                      {student.avatar ? (
                        <Image src={student.avatar} alt={student.name} className={`relative z-10 w-10 h-10 rounded-full object-cover border bg-slate-100 ${student.cosmetics?.includes('avatar_glow') ? 'border-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-slate-200 dark:border-slate-800'}`} />
                      ) : (
                        <View className={`relative z-10 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border ${student.cosmetics?.includes('avatar_glow') ? 'border-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-indigo-100 dark:border-indigo-800'}`}>
                          {String(student.name[0]).toUpperCase()}
                        </View>
                      )}
                    </Link>

                    <View className="ml-3 flex-1 min-w-0 flex-row">
                      <Link href={`/user/${student.username}`} className="w-full flex flex-row">
                        <BadgedName 
                          name={student.name}
                          userId={student.id}
                          rank={rank}
                          totalPoints={student.totalPoints}
                          nameClassName="font-bold text-[15px] text-slate-900 dark:text-slate-100"
                          className="flex items-center gap-1.5 min-w-0 flex-row"
                        />
                      </Link>
                      <View className="text-xs font-medium text-slate-500 truncate flex items-center gap-1 flex-row">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <Text className="truncate">{student.school}</Text>
                      </View>
                    </View>

                    <View className="shrink-0 flex flex-col items-end pl-2">
                      <Text className="font-bold text-slate-900 dark:text-white text-sm">{student.totalPoints.toLocaleString()}</Text>
                      <Text className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Points</Text>
                    </View>

                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <ClientRankBanner />
    </View>
  );
}
