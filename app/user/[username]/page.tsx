import React from 'react';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { Trophy, Target, Zap, Star, MapPin, GraduationCap } from 'lucide-react';
import TeacherBadge from '@/ticks/teacher';
import FollowButton from '@/components/FollowButton';

type Props = { params: { username: string } };

export default async function StudentProfilePage({ params }: Props) {
    const username = params.username;
    if (!username) return (<div className="min-h-screen py-12 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">User not found</div>);

    try {
        let fetchedUser: any = null;

        // Fetch by Username with proper pagination
        let pageNum = 1;
        let hasMore = true;
        while (hasMore && !fetchedUser) {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({
                pageSize: 1000, // Increase page size to reduce API calls
                page: pageNum,
            });

            if (error || !data?.users) {
                console.error('Error fetching users:', error);
                break;
            }

            // Search for user in this page
            fetchedUser = data.users.find((u: any) => (u.user_metadata?.username || '').toLowerCase() === username.toLowerCase());

            // Check if there are more pages
            hasMore = data.users.length === 1000;
            pageNum++;
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

        const stats = [
            { icon: Trophy, label: 'Battles Won', value: battlesWon.toString(), color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
            { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: 'text-green-500', bgColor: 'bg-green-50' },
            { icon: Zap, label: 'Battles Taken', value: battlesAttempted.toString(), color: 'text-orange-500', bgColor: 'bg-orange-50' },
            { icon: Star, label: 'Points', value: totalPoints.toLocaleString(), color: 'text-blue-500', bgColor: 'bg-blue-50' },
        ];

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-6 sm:pt-8 w-full">
                {/* Banner Section */}
                <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-64 sm:h-80 w-full relative bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
                        {banner ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={banner} alt="banner" className="w-full h-full object-cover opacity-85" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 opacity-90" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 relative z-10 w-full">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left w-full">
                        {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt={name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20 bg-white dark:bg-slate-900" />
                        ) : (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/20 flex items-center justify-center text-5xl font-bold text-indigo-500 dark:text-indigo-400 shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20">{String(name[0] || 'S').toUpperCase()}</div>
                        )}

                        <div className="flex-1 w-full">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                {name}
                                {isTeacher && <TeacherBadge />}
                            </h1>
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
                        </div>

                        {/* Global Rank Snippet */}
                        <div className="mt-6 sm:mt-0 relative group">
                            <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 rounded-3xl shadow-lg text-white text-center min-w-[160px] transform transition-transform group-hover:scale-105">
                                <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Global Rank</div>
                                <div className="text-5xl font-black">Genius</div>
                                <div className="text-sm font-medium opacity-80 mt-2">Top 5% Student</div>
                            </div>
                        </div>
                    </div>

                    {!isTeacher && (
                        <div className={"grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full"}>
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center w-full">
                                        <div className={`${stat.bgColor} dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                                            <Icon className={`${stat.color} w-6 h-6`} />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Hide recent activity for teachers */}
                    {!isTeacher && (
                        <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 w-full mb-10">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                                Recent Victories
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { o: 'Algebra Championship', d: '2 hours ago', p: '+50 pts' },
                                    { o: 'Physics Motion Quiz', d: '1 day ago', p: '+30 pts' },
                                    { o: 'History Trivia Clash', d: '3 days ago', p: '+45 pts' },
                                ].map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                                                {v.o.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-200">{v.o}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{v.d}</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full text-sm">
                                            {v.p}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div >
        );
    } catch (err) {
        return (<div className="min-h-screen py-12 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Profile rendering failed</div>);
    }
}
