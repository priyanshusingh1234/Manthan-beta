import React from 'react';
import Link from 'next/link';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { Trophy, Target, Zap, Star, MapPin, GraduationCap, TrendingUp, BookOpen, Users, ChevronRight, Flame } from 'lucide-react';
import TeacherBadge from '@/ticks/teacher';
import TopperBadge from '@/ticks/topper';
import { GoldBadge, SilverBadge, BronzeBadge } from '@/ticks/RankBadges';
import BadgedName from '@/components/BadgedName';
import PublicProfileTabs from '@/components/PublicProfileTabs';
import FollowButton from '@/components/FollowButton';
import { getLevel } from '@/lib/xp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { APP_URL } from '@/lib/appUrl';

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<any> {
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, total_points, username, school, avatar_url, is_teacher')
        .ilike('username', params.username)
        .single();
    if (!profile) return { title: 'User Not Found | Dheeyudha' };
    
    const name = profile.full_name || `@${profile.username}`;
    const points = Number(profile.total_points) || 0;
    const school = profile.school || 'Dheeyudha Learner';
    const profileType = profile.is_teacher ? 'Teacher' : 'Student';

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
    
    // Use avatar as OG image when available; fallback to rank badge image.
    const avatarUrl = typeof profile.avatar_url === 'string' && profile.avatar_url.trim() ? profile.avatar_url : null;
    const finalImageUrl = avatarUrl
        ? (avatarUrl.startsWith('http') ? avatarUrl : `${APP_URL}${avatarUrl}`)
        : `${APP_URL}${badgeImageUrl}`;
    const canonicalUrl = `${APP_URL}/user/${encodeURIComponent(profile.username)}`;
    
    return {
        title: `${name} (@${profile.username}) | ${profileType} Profile on Dheeyudha`,
        description: `${name} is a ${profileType.toLowerCase()} on Dheeyudha with ${points.toLocaleString()} points from ${school}. View profile, performance, and badges.`,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: `${name} on Dheeyudha`,
            description: `${profileType} from ${school} with ${points.toLocaleString()} points on Dheeyudha.`,
            url: canonicalUrl,
            siteName: 'Dheeyudha',
            type: 'profile',
            images: [
                {
                    url: finalImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${name} avatar and profile preview`,
                }
            ],
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} on Dheeyudha`,
            description: `${profileType} from ${school} with ${points.toLocaleString()} points.`,
            images: [finalImageUrl],
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
            .select('id, total_points, xp, is_teacher, avatar_url, streak_count, streak_longest, daily_solve_count, daily_solve_date') 
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

        const meta = (fetchedUser as any).user_metadata || {};
        const name = fetchedUser.full_name || meta.fullName || meta.full_name || meta.name || (fetchedUser.username ? `@${fetchedUser.username}` : (meta.username ? `@${meta.username}` : 'Student'));
        const banner = (fetchedUser as any).banner_url || meta.banner_url || null;
        const bio = (fetchedUser as any).bio || meta.bio || null;
        const school = fetchedUser.school || meta.school || null;
        const grade = (fetchedUser as any).classGrade || (fetchedUser as any).grade || meta.classGrade || meta.grade || null;
        const isTeacher = !!profile?.is_teacher || !!meta?.isTeacher || !!meta?.is_teacher;

        if (isTeacher) {
             const { redirect } = await import('next/navigation');
             redirect(`/teacher/${username}`);
        }

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

        // Always use profiles.total_points as the single authoritative source.
        // Auth metadata can lag behind when points are awarded server-side without a
        // follow-up sync (e.g. WAR bonuses).  The profiles table is always kept in
        // sync by every point-awarding API route via upsertProfile().
        const totalPoints = Number(profile?.total_points) || Number(meta.totalPoints) || 0;
        const profileXp = Number((profile as any)?.xp) || Number(meta.xp) || 0;
        const xpLevel = getLevel(profileXp);
        const avatar = (profile?.avatar_url as string | null) || fetchedUser.avatar_url || meta.avatar_url || meta.avatar || null;
        const battlesAttempted = Number(meta.battlesAttempted) || 0;
        const battlesWon = Number(meta.battlesWon) || 0;
        const winRate = battlesAttempted > 0 ? Math.round((battlesWon / battlesAttempted) * 100) : 0;

        // Streak
        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const todayIST = nowIST.toISOString().slice(0, 10);
        const streakCount = Number((profile as any)?.streak_count) || 0;
        const streakLongest = Number((profile as any)?.streak_longest) || streakCount;
        const streakGoalMetToday = (profile as any)?.daily_solve_date === todayIST && (Number((profile as any)?.daily_solve_count) || 0) >= 2;

        // Fetch Global Rank
        const isStudentProfile = !profile?.is_teacher;
        let myRank: number | null = null;
        if (isStudentProfile) {
            const { count: higherRanked } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_teacher', false)
                .gt('total_points', totalPoints);
            myRank = (higherRanked || 0) + 1;
        }

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
        
        // --- WEEKLY REPORT (PUBLIC IF ALLOWED) ---
        const showWeeklyReport = meta.showWeeklyReport !== false;
        let weeklyReportObj = null;

        if (showWeeklyReport && !isTeacher) {
            const nowTime = new Date();
            const pastWeekTime = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const { data: recentAttempts } = await supabaseAdmin
                .from('question_attempts')
                .select('is_correct, created_at')
                .eq('user_id', fetchedUser.id)
                .gte('created_at', pastWeekTime);

            let recentActivities: any[] = [];
            try {
                const res = await supabaseAdmin
                    .from('activity_logs')
                    .select('created_at')
                    .eq('user_id', fetchedUser.id)
                    .gte('created_at', pastWeekTime);
                if (!res.error) recentActivities = res.data || [];
            } catch (e) {}

            const allTimestamps = [
                ...(recentAttempts || []).map(a => a.created_at),
                ...recentActivities.map(a => a.created_at)
            ];

            const activeDays = new Set(allTimestamps.map(ts => new Date(ts).toISOString().split('T')[0])).size;
            const rep_totalAttempts = (recentAttempts || []).length;
            const rep_correctAttempts = (recentAttempts || []).filter((a: any) => a.is_correct).length;
            const rep_accuracy = rep_totalAttempts > 0 ? (rep_correctAttempts / rep_totalAttempts) * 100 : 0;

            const accuracyScore = rep_totalAttempts > 0 ? (rep_accuracy / 100) * 40 : 0;
            const volumeScore = Math.min(rep_totalAttempts * 2, 40);
            const consistencyScore = Math.min(activeDays * 4, 20);
            const rep_totalScore = accuracyScore + volumeScore + consistencyScore;

            let rating = 'Not Rated';
            let ratingMessage = 'Play more to get rated!';
            if (rep_totalScore >= 80) { rating = 'Excellent'; ratingMessage = 'Incredible work this week! They completely dominated.'; }
            else if (rep_totalScore >= 60) { rating = 'Very Good'; ratingMessage = 'Solid effort! Just a few more questions to hit Excellent.'; }
            else if (rep_totalScore >= 40) { rating = 'Good'; ratingMessage = 'Decent week. Answering more questions next time will boost this.'; }
            else if (rep_totalScore >= 20) { rating = 'Not Bad'; ratingMessage = 'They started, but there is so much more they can do!'; }
            else if (rep_totalScore >= 0 && rep_totalAttempts > 0) { rating = 'Poor'; ratingMessage = 'A bit inactive. Time to dust off and try again!'; }

            weeklyReportObj = {
                stats: { totalAttempts: rep_totalAttempts, correctAttempts: rep_correctAttempts, accuracy: Math.round(rep_accuracy), activeDays },
                rating: { label: rating, message: ratingMessage }
            };
        }
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
                </div>
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 -mt-16 sm:-mt-28 relative z-10 w-full">
                    {/* Profile Card - Native Look on Mobile */}
                    <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-3xl shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] sm:shadow-xl p-5 sm:p-10 border-t sm:border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left w-full">
                        
                        <div className="relative shrink-0">
                            {meta.cosmetics?.includes('avatar_glow') && (
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-70 animate-pulse transition-opacity -mt-16 sm:-mt-20"></div>
                            )}
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt={name} className={`w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl relative -mt-16 sm:-mt-20 bg-white dark:bg-slate-900 transition-transform hover:scale-105 duration-300 ${meta.cosmetics?.includes('avatar_glow') ? 'ring-4 ring-transparent shadow-indigo-500/50' : 'ring-4 ring-white dark:ring-slate-900'}`} />
                            ) : (
                                <div className={`w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/20 flex items-center justify-center text-5xl font-bold text-indigo-500 dark:text-indigo-400 shadow-2xl relative -mt-16 sm:-mt-20 ${meta.cosmetics?.includes('avatar_glow') ? 'ring-4 ring-transparent shadow-indigo-500/50' : 'ring-4 ring-white dark:ring-slate-900'}`}>{String(name[0] || 'S').toUpperCase()}</div>
                            )}
                        </div>
 
                        <div className="flex-1 w-full">
                            <BadgedName 
                                name={name}
                                userId={fetchedUser.id}
                                rank={myRank ?? undefined}
                                isTeacher={isTeacher}
                                totalPoints={totalPoints}
                                nameClassName="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white"
                                className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3"
                            />
                            <p className="text-lg font-mono text-indigo-500 dark:text-indigo-400 mt-1 font-semibold">@{username}</p>

                            {/* XP Level Bar — server-rendered static version */}
                            {(() => {
                                const LEVEL_COLORS = [
                                    { from: '#94a3b8', to: '#64748b', label: 'Rookie' },
                                    { from: '#22d3ee', to: '#0891b2', label: 'Scholar' },
                                    { from: '#34d399', to: '#059669', label: 'Expert' },
                                    { from: '#818cf8', to: '#4f46e5', label: 'Master' },
                                    { from: '#fb923c', to: '#ea580c', label: 'Champion' },
                                    { from: '#f472b6', to: '#db2777', label: 'Legend' },
                                    { from: '#fbbf24', to: '#d97706', label: 'Mythic' },
                                ];
                                const c = LEVEL_COLORS[Math.min(xpLevel.level - 1, 6)];
                                return (
                                    <div className="mt-3 flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                                        <div
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white shrink-0 text-xs font-black"
                                            style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                                        >
                                            ⚡ Lv.{xpLevel.level} · {c.label}
                                        </div>
                                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${xpLevel.progressPct}%`,
                                                    background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold shrink-0">{xpLevel.xpInLevel}/50</span>
                                    </div>
                                );
                            })()}

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

                            {/* Streak badge */}
                            {streakCount > 0 && (
                                <Link href={`/user/${username}`}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all w-fit cursor-default"
                                    style={{
                                        background: streakGoalMetToday ? 'linear-gradient(135deg,#fff7ed,#fff)' : undefined,
                                        borderColor: streakGoalMetToday ? '#fed7aa' : '#e2e8f0',
                                    }}
                                >
                                    <Flame
                                        className={`w-5 h-5 ${streakGoalMetToday ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`}
                                        fill={streakGoalMetToday ? '#f97316' : 'none'}
                                    />
                                    <span className={`text-sm font-black ${streakGoalMetToday ? 'text-orange-700' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {streakCount}-day streak
                                    </span>
                                    {streakLongest > streakCount && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                            · Best {streakLongest}
                                        </span>
                                    )}
                                    {streakGoalMetToday && (
                                        <span className="text-[10px] font-black text-orange-500">🔥 Active today</span>
                                    )}
                                </Link>
                            )}

                            <div className="mt-6">
                                <FollowButton profileUserId={fetchedUser.id} initialFollowers={initialFollowers} initialFollowing={initialFollowing} />
                            </div>
                        </div>
                        {/* Rank Badge & Analysis - Native layout on mobile */}
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

                    {/* Interactive Profile Content (Tabs: Stats, Badges, Solved) */}
                    {!isTeacher && (
                        <div className="mt-8 sm:mt-12 w-full">
                            <PublicProfileTabs 
                                userId={fetchedUser.id}
                                username={username}
                                myRank={myRank}
                                totalPoints={totalPoints}
                                stats={[
                                    { icon: 'trophy', label: 'Battles Won', value: battlesWon.toString(), color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
                                    { icon: 'target', label: 'Win Rate', value: `${winRate}%`, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
                                    { icon: 'zap', label: 'Attempts', value: (qAttempts?.length || 0).toString(), color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
                                    { icon: 'star', label: 'Points', value: totalPoints.toLocaleString(), color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
                                ]}
                                recentSolvedQs={recentSolvedQs}
                                isTeacher={isTeacher}
                                weeklyReport={weeklyReportObj}
                            />
                        </div>
                    )}

                </div>
            </div >
        );
    } catch (err) {
        return (<div className="min-h-screen py-12 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Profile rendering failed</div>);
    }
}
