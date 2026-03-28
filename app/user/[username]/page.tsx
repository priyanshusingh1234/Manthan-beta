import React from 'react';
import Link from 'next/link';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { Trophy, Target, Zap, Star, MapPin, GraduationCap, TrendingUp, BookOpen, Users, ChevronRight } from 'lucide-react';
import TeacherBadge from '@/ticks/teacher';
import TopperBadge from '@/ticks/topper';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import BadgedName from '@/components/BadgedName';
import FollowButton from '@/components/FollowButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<any> {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id, full_name, total_points, username').ilike('username', params.username).single();
    if (!profile) return { title: 'User Not Found | Dheeyudha' };
    
    const name = profile.full_name || `@${profile.username}`;
    const points = profile.total_points || 0;

    // Determine badge image for social sharing
    let badgeImageUrl = '/logo-full.png'; // fallback
    try {
        const { data: allUsers } = await supabaseAdmin.from('profiles')
            .select('id')
            .order('total_points', { ascending: false })
            .limit(3);
            
        const top3Ids = allUsers?.map(u => u.id) || [];
        const rank = top3Ids.indexOf(profile.id);
        
        if (rank === 0) badgeImageUrl = '/badges/gold.png';
        else if (rank === 1) badgeImageUrl = '/badges/silver.png';
        else if (rank === 2) badgeImageUrl = '/badges/bronze.png';
    } catch (e) { console.error("Error fetching rank for metadata:", e); }
    
    // Ensure absolute URL for social platforms
    const finalImageUrl = `https://dheeyudhha-pi.vercel.app${badgeImageUrl}`;
    
    return {
        title: `${name} has earned ${points} points on Dheeyudha! 🧠`,
        description: `Check out ${name}'s learning journey and rank on Dheeyudha, the ultimate battle of brains.`,
        openGraph: {
            title: `${name}'s Profile | Dheeyudha Achievement`,
            description: `${name} has reached a milestone of ${points} points! See their badges and rank in the global leaderboard.`,
            type: 'profile',
            images: [
                {
                    url: finalImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${name}'s Badge`,
                }
            ],
        }
    };
}

export default async function StudentProfilePage({ params }: Props) {
    const username = params.username;
    if (!username) return (<div className="min-h-screen py-12 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">User not found</div>);

    try {
        let fetchedUser: any = null;
        
        // Fast, case-insensitive ID lookup from profiles table
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id') 
            .ilike('username', username)
            .single();

        if (profile?.id) {
            // Instantly fetch the specific Auth user for full metadata
            const { data: { user }, error: idError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
            if (!idError && user) {
                fetchedUser = user;
            }
        }

        // Fallback securely to scanning auth metadata if profile entry was delayed or missing
        if (!fetchedUser) {
            let pageNum = 1;
            let hasMore = true;
            while (hasMore && !fetchedUser) {
                const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page: pageNum });
                if (error || !data?.users) break;
                fetchedUser = data.users.find((u: any) => (u.user_metadata?.username || '').toLowerCase() === username.toLowerCase());
                hasMore = data.users.length === 1000;
                pageNum++;
            }
        }

        if (!fetchedUser) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 text-center max-w-md">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">👻</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">User Not Found</h2>
                        <p className="text-slate-500 dark:text-slate-400">The student profile you are looking for doesn&apos;t exist or hasn&apos;t set a username yet.</p>
                    </div>
                </div>
            );
        }

        const meta = (fetchedUser as any)?.user_metadata ?? {};
        const name = meta?.fullName || meta?.full_name || meta?.name || (fetchedUser as any)?.email || 'Student';
        const avatar = meta?.avatar_url || meta?.avatar || null;
        const banner = meta?.banner_url || null;
        const bio = meta?.bio || null;
        const school = meta?.school || null;
        const grade = meta?.classGrade || null;
        const isTeacher = !!meta?.isTeacher;

        let initialFollowers = 0;
        let initialFollowing = 0;
        try {
            const { count: followersCount, error: fError } = await supabaseAdmin
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', fetchedUser.id);
            if (!fError && followersCount !== null) initialFollowers = followersCount;

            const { count: followingCount, error: followingError } = await supabaseAdmin
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', fetchedUser.id);
            if (!followingError && followingCount !== null) initialFollowing = followingCount;
        } catch (e) {
            console.log("Follows table might not exist yet.");
        }

        const totalPoints = Number(meta?.totalPoints) || 0;
        const battlesAttempted = Number(meta?.battlesAttempted) || 0;
        const battlesWon = Number(meta?.battlesWon) || 0;
        const winRate = battlesAttempted > 0 ? Math.round((battlesWon / battlesAttempted) * 100) : 0;

        // Fetch Global Rank
        const { count: higherRanked } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_teacher', false)
            .gt('total_points', totalPoints);
        const myRank = (higherRanked || 0) + 1;

        // --- ENHANCED ANALYSIS ---
        // Fetch attempts separately to avoid join issues
        const { data: qAttempts } = await supabaseAdmin
            .from('question_attempts')
            .select('question_id, is_correct')
            .eq('user_id', fetchedUser.id);

        const { data: wSubs } = await supabaseAdmin
            .from('written_submissions')
            .select('question_id')
            .eq('student_id', fetchedUser.id);

        const solvedQids = Array.from(new Set([
            ...(qAttempts || []).map(a => a.question_id),
            ...(wSubs || []).map(s => s.question_id)
        ]));

        let allSolvedWithMeta: any[] = [];
        if (solvedQids.length > 0) {
            const { data: solvedMeta } = await supabaseAdmin
                .from('questions')
                .select('id, subject, created_by, title, points, created_at')
                .in('id', solvedQids)
                .order('created_at', { ascending: false });
            allSolvedWithMeta = solvedMeta || [];
        }

        // Calculate Favorites
        const subjectCounts: Record<string, number> = {};
        const teacherCounts: Record<string, number> = {};
        
        allSolvedWithMeta.forEach((q: any) => {
            if (q.subject) subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
            if (q.created_by) teacherCounts[q.created_by] = (teacherCounts[q.created_by] || 0) + 1;
        });

        const favSubject = Object.entries(subjectCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "Exploring";
        const topTeacherId = Object.entries(teacherCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
        let favTeacher = "Various Teachers";
        if (topTeacherId) {
            const { data: teacherProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', topTeacherId).single();
            if (teacherProfile) favTeacher = teacherProfile.full_name;
        }

        const stats = [
            { icon: Trophy, label: 'Battles Won', value: battlesWon.toString(), color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
            { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: 'text-green-500', bgColor: 'bg-green-50' },
            { icon: Zap, label: 'Attempts', value: (qAttempts?.length || 0).toString(), color: 'text-orange-500', bgColor: 'bg-orange-50' },
            { icon: Star, label: 'Points', value: totalPoints.toLocaleString(), color: 'text-blue-500', bgColor: 'bg-blue-50' },
        ];
        // -----------------------

        const recentSolvedQs = allSolvedWithMeta.slice(0, 3);

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-6 sm:pt-8 w-full">
                {/* Banner Section - Full width on mobile */}
                <div className="max-w-[90rem] mx-auto sm:px-6 lg:px-8">
                    <div className="h-48 sm:h-80 w-full relative sm:bg-slate-800 sm:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5 transition-all duration-500">
                        {banner ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={banner} alt="banner" className="w-full h-full object-cover opacity-85 scale-105" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 opacity-90" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent sm:via-transparent" />
                    </div>
                </div>                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 -mt-16 sm:-mt-28 relative z-10 w-full">
                    {/* Profile Card - Native Look on Mobile */}
                    <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-3xl shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] sm:shadow-xl p-5 sm:p-10 border-t sm:border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left w-full">
                        {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt={name} className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20 bg-white dark:bg-slate-900 transition-transform hover:scale-105 duration-300" />
                        ) : (
                            <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/20 flex items-center justify-center text-5xl font-bold text-indigo-500 dark:text-indigo-400 shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20">{String(name[0] || 'S').toUpperCase()}</div>
                        )}
 
                        <div className="flex-1 w-full">
                            <BadgedName 
                                name={name}
                                rank={myRank}
                                isTeacher={isTeacher}
                                totalPoints={totalPoints}
                                nameClassName="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white"
                                className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3"
                            />
                            <p className="text-lg font-mono text-indigo-500 dark:text-indigo-400 mt-1 font-semibold">@{username}</p>

                            <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start text-sm font-medium text-slate-600 dark:text-slate-400 w-full">
                                {school && (
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <span>{school}</span>
                                    </div>
                                )}
                                {grade && (
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                        <GraduationCap className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <span>Class {grade}</span>
                                    </div>
                                )}
                            </div>

                            {bio && <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto sm:mx-0 w-full">{bio}</p>}

                            <div className="mt-6">
                                <FollowButton profileUserId={fetchedUser.id} initialFollowers={initialFollowers} initialFollowing={initialFollowing} />
                            </div>
                        </div>                        {/* Rank Badge & Analysis - Native layout on mobile */}
                        <div className="mt-8 sm:mt-0 flex flex-col gap-4 shrink-0 sm:w-[240px] w-full">
                            {/* Learning Profile Analysis */}
                            <div className="bg-white dark:bg-slate-900 border sm:border-slate-100 dark:sm:border-slate-800 p-6 rounded-3xl sm:rounded-[2rem] shadow-sm sm:shadow-md relative overflow-hidden group/analysis border-slate-100 dark:border-slate-800">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover/analysis:bg-indigo-500/10 transition-colors"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-5 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3" />
                                    Learning Insight
                                </h3>
                                
                                <div className="space-y-4 sm:space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Top Subject</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{favSubject}</p>
                                        </div>
                                    </div>
 
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Top Mentor</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{favTeacher}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
 
                            <div className="relative group perspective-1000 w-full shadow-2xl rounded-3xl sm:rounded-[2rem]">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-3xl sm:rounded-[2rem] blur-sm opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 text-white p-6 rounded-3xl sm:rounded-[2rem] shadow-xl text-center h-full flex flex-col justify-center transform transition-transform group-hover:-translate-y-1">
                                    <div className="flex justify-center mb-4 scale-150 transform transition-transform group-hover:scale-[1.7] group-hover:rotate-12 duration-500">
                                        {myRank === 1 ? <GoldBadge /> : myRank === 2 ? <SilverBadge /> : myRank === 3 ? <BronzeBadge /> : <div className="p-4 bg-white/10 rounded-full"><Trophy className="w-10 h-10 text-amber-400" /></div>}
                                    </div>
                                    <div className="text-[10px] items-center justify-center flex gap-1.5 font-bold text-slate-400 bg-black/20 py-1 sm:py-1.5 px-4 rounded-full border border-white/5 mx-auto w-fit">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Rank #{myRank}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isTeacher && (
                        <div className={"grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 w-full px-1 sm:px-0"}>
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center w-full group hover:shadow-lg transition-all">
                                        <div className={`${stat.bgColor} dark:bg-slate-800 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                                            <Icon className={`${stat.color} w-5 h-5 sm:w-6 sm:h-6`} />
                                        </div>
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</div>
                                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Solved Questions Section - Native style expansion */}
                    {!isTeacher && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] shadow-sm sm:shadow-lg p-5 sm:p-8 border-x-0 sm:border border-y sm:border-slate-100 dark:sm:border-slate-800 relative overflow-hidden group/solved mt-6 sm:mt-8 mb-10 border-slate-100 dark:border-slate-800">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-50 group-hover/solved:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-inner group-hover/solved:scale-110 transition-transform">
                                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                                </div>
                                <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Real Solved Questions</h2>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 font-medium italic">Latest triumphs in learning</p>

                            <div className="space-y-4">
                                {(!recentSolvedQs || recentSolvedQs.length === 0) ? (
                                    <div className="py-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">No questions solved yet.</div>
                                ) : (
                                    recentSolvedQs.map((q: any, i: number) => (
                                        <Link key={i} href={`/questions/${q.id}`} className="block group/q">
                                            <div
                                                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center font-black text-base sm:text-lg shadow-inner group-hover/q:scale-105 transition-transform overflow-hidden font-mono shrink-0">
                                                            <span className="text-slate-400">{q.subject?.charAt(0) || '?'}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white group-hover/q:text-emerald-600 transition-colors truncate">{q.title}</h3>
                                                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{q.subject}</p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                                                        Solved
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-2 sm:pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">+{q.points} <span className="hidden sm:inline">Points</span></span>
                                                    </div>
                                                    <span>{new Date(q.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                            
                            {recentSolvedQs && recentSolvedQs.length > 0 && (
                                <div className="mt-8">
                                    <Link href={`/user/${username}/solved`} className="block group/btn">
                                        <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl transition-all duration-300 active:scale-95 shadow-xl hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
                                            <span>See All Achievements</span>
                                            <Trophy className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div >
        );
    } catch (err) {
        return (<div className="min-h-screen py-12 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Profile rendering failed</div>);
    }
}
