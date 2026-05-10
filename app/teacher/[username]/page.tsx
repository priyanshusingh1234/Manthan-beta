import React from 'react';
import Link from 'next/link';
import { Star, Target, Users, Activity } from 'lucide-react';
import supabaseAdmin from '@/lib/supabaseAdmin';
import TeacherBadge from '@/ticks/teacher';
import TeacherPublicTabs from '@/components/TeacherPublicTabs';
import FollowButton from '@/components/FollowButton';


export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { username: string } };

export default async function TeacherProfilePage({ params }: Props) {
  const targetUsername = params.username;
  if (!targetUsername) return (<div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Teacher not found</div>);

  try {
    let fetchedUser: any = null;

    // Fast, case-insensitive ID lookup from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_teacher, avatar_url')
      .ilike('username', targetUsername)
      .single();

    if (profile?.id) {
      // Instantly fetch the specific Auth user for full metadata
      const { data: { user }, error: idError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (!idError && user) {
        fetchedUser = user;
      }
    }

    // Fallback securely to scanning auth metadata if profiles table is out of sync
    if (!fetchedUser) {
      let pageNum = 1;
      let hasMore = true;
      while (hasMore && !fetchedUser) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page: pageNum });
        if (error || !data?.users) break;
        fetchedUser = data.users.find((u: any) => (u.user_metadata?.username || '').toLowerCase() === targetUsername.toLowerCase());
        hasMore = data.users.length === 1000;
        pageNum++;
      }
    }

    if (!fetchedUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Teacher Not Found</h2>
            <p className="text-slate-500 mb-6 font-medium italic">The mentor @{targetUsername} could not be located.</p>
            <Link href="/feed" className="text-indigo-600 font-bold hover:underline">Return to Feed</Link>
          </div>
        </div>
      );
    }

    const meta = (fetchedUser as any)?.user_metadata ?? (fetchedUser as any)?.user?.user_metadata ?? {};
    const name = meta?.fullName || meta?.full_name || meta?.name || (fetchedUser as any)?.email || 'Teacher';
    const avatar = (profile as any)?.avatar_url || meta?.avatar_url || meta?.avatar || null;
    const bio = meta?.bio || null;
    const mainSubject = meta?.mainSubject || meta?.main_subject || null;
    const username = meta?.username || null;
    const teacherId = fetchedUser?.id || fetchedUser?.user?.id;

    const isTeacher = !!profile?.is_teacher || !!meta?.isTeacher || !!meta?.is_teacher;
    if (!isTeacher) {
      throw new Error("NOT_A_TEACHER");
    }

    let initialFollowers = 0;
    let initialFollowing = 0;
    if (teacherId) {
      try {
        const { count: fCount, error: fError } = await supabaseAdmin
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', teacherId);
        if (!fError && fCount !== null) initialFollowers = fCount;

        const { count: cCount, error: cError } = await supabaseAdmin
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', teacherId);
        if (!cError && cCount !== null) initialFollowing = cCount;
      } catch (e) {
        console.log("Follows table might not exist yet.");
      }
    }

    let averageRating = 0;
    let totalReviews = 0;
    if (teacherId) {
      try {
        const { data: statsData } = await supabaseAdmin
          .from('teacher_stats')
          .select('average_rating, total_reviews')
          .eq('teacher_id', teacherId)
          .maybeSingle();

        if (statsData) {
          averageRating = Number(statsData.average_rating) || 0;
          totalReviews = Number(statsData.total_reviews) || 0;
        }
      } catch (e) {
        console.log("Stats table might not exist yet.");
      }
    }

    let questions: any[] = [];
    if (teacherId) {
      const { data: qData, error: qError } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('created_by', teacherId)
        .order('created_at', { ascending: false });

      if (!qError && qData) {
        questions = qData.map((r: any) => ({
          id: String(r.id),
          createdBy: String(r.created_by),
          createdByName: name,
          createdByAvatar: avatar,
          createdByUsername: username,
          title: r.title,
          body: r.body,
          subject: r.subject,
          classGrade: r.class_grade,
          points: r.points,
          timeLimit: r.time_limit,
          difficulty: r.difficulty || null,
          options: r.options || null,
          correctOption: typeof r.correct_option === 'number' ? r.correct_option : null,
          imagePath: r.image_path || null,
          imageUrl: r.image_url || null,
          chapter: r.chapter || null,
          createdAt: r.created_at,
        }));
      }
    }

    let reached = 0;
    let solves = 0;
    let accuracy = 0;
    const showImpact = meta?.showImpact !== false;

    if (showImpact && questions.length > 0) {
      const qIds = questions.map(q => q.id);
      const { data: attempts } = await supabaseAdmin.from('question_attempts').select('user_id, is_correct').in('question_id', qIds);
      if (attempts) {
        reached = new Set(attempts.map(a => a.user_id)).size;
        solves = attempts.filter(a => a.is_correct).length;
        accuracy = attempts.length > 0 ? Math.round((solves / attempts.length) * 100) : 0;
      }
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-4 sm:pt-10">
        <div className="max-w-[90rem] mx-auto px-0 sm:px-6 lg:px-8">
          <div className="h-40 sm:h-72 w-full relative sm:bg-slate-800 sm:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5 group">
            {/* Fallback pattern/gradient for teacher banner */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-800 opacity-90 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 -mt-12 sm:-mt-24 relative z-10 w-full">
          {/* Teacher Profile Card - Native Look */}
          <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-3xl shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] sm:shadow-xl p-6 sm:p-10 border-t sm:border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left mb-10">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20 bg-white dark:bg-slate-900 transition-transform hover:scale-105 duration-300" />
            ) : (
              <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900/40 to-purple-100 dark:to-purple-900/20 flex items-center justify-center text-4xl font-bold text-indigo-500 dark:text-indigo-400 shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20">{String(name[0] || 'T').toUpperCase()}</div>
            )}

            <div className="flex-1 w-full">
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 tracking-tighter">
                {name}
                <TeacherBadge />
              </h1>
              <p className="text-indigo-500 dark:text-indigo-400 font-bold text-lg mt-0.5 sm:mt-1 font-mono tracking-tight">@{username}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-4">
                {mainSubject && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black px-4 py-1.5 rounded-full text-xs sm:text-sm tracking-widest uppercase border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">{mainSubject}</span>}

                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border border-amber-100 dark:border-amber-800/40 shadow-sm">
                  <span className="text-amber-500 text-lg leading-none select-none">★</span>
                  <span>{averageRating > 0 ? averageRating.toFixed(1) : "New"} Mentor</span>
                  {totalReviews > 0 && <span className="text-amber-600/60 dark:text-amber-500/50 font-bold ml-1">({totalReviews})</span>}
                </div>
              </div>

              {bio && <p className="mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto sm:mx-0 w-full font-medium italic overflow-hidden">{bio}</p>}

              <div className="mt-6 flex justify-center sm:justify-start">
                {teacherId && (
                  <FollowButton profileUserId={teacherId} initialFollowers={initialFollowers} initialFollowing={initialFollowing} />
                )}
              </div>
            </div>
          </div>

          {/* Render Client Component with data */}
          <TeacherPublicTabs 
            showImpact={showImpact} 
            impactStats={{ accuracy, reached, solves }} 
            questions={questions} 
          />
        </div>
      </div>
    );
  } catch (err: any) {
    if (err?.message === "NOT_A_TEACHER") {
      const { redirect } = await import('next/navigation');
      redirect(`/user/${targetUsername}`);
    }
    return (<div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Profile not available</div>);
  }
}
