import React from 'react';
import supabaseAdmin from '@/lib/supabaseAdmin';
import TeacherBadge from '@/ticks/teacher';
import QuestionCard from '@/components/QuestionCard';
import FollowButton from '@/components/FollowButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { username: string } };

export default async function TeacherProfilePage({ params }: Props) {
  const targetUsername = params.username;
  if (!targetUsername) return (<div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Teacher not found</div>);

  try {
    let fetchedUser: any = null;

    // Fetch by Username with proper pagination (inefficient scan, requires 'profiles' table for production)
    let pageNum = 1;
    let hasMore = true;
    while (hasMore && !fetchedUser) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        pageSize: 1000,
        page: pageNum,
      });
      
      if (error || !data?.users) {
        console.error('Error fetching teacher users:', error);
        break;
      }

      fetchedUser = data.users.find((u: any) =>
        (u.user_metadata?.username || '').toLowerCase() === targetUsername.toLowerCase()
      );

      hasMore = data.users.length === 1000;
      pageNum++;
    }

    if (!fetchedUser) {
      return (<div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Teacher not found</div>);
    }

    const meta = (fetchedUser as any)?.user_metadata ?? (fetchedUser as any)?.user?.user_metadata ?? {};
    const name = meta?.fullName || meta?.full_name || meta?.name || (fetchedUser as any)?.email || 'Teacher';
    const avatar = meta?.avatar_url || meta?.avatar || null;
    const bio = meta?.bio || null;
    const mainSubject = meta?.mainSubject || meta?.main_subject || null;
    const username = meta?.username || null;
    const teacherId = fetchedUser?.id || fetchedUser?.user?.id;

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
          createdAt: r.created_at,
        }));
      }
    }

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-12">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="w-28 h-28 rounded-full object-cover shadow-md ring-4 ring-slate-50 dark:ring-slate-800" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900/40 to-purple-100 dark:to-purple-900/20 flex items-center justify-center text-4xl font-bold text-indigo-500 dark:text-indigo-400 shadow-inner ring-4 ring-slate-50 dark:ring-slate-800">{String(name[0] || 'T').toUpperCase()}</div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {name}
              <TeacherBadge />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1 font-mono">@{username}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
              {mainSubject && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1 rounded-full text-sm tracking-wide">{mainSubject}</span>}

              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-bold border border-amber-100 dark:border-amber-800/50">
                <span className="text-amber-500 text-lg leading-none">★</span>
                <span>{averageRating > 0 ? averageRating.toFixed(1) : "New"}</span>
                {totalReviews > 0 && <span className="text-amber-600/60 font-medium ml-1">({totalReviews})</span>}
              </div>
            </div>

            {bio && <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">{bio}</p>}

            {teacherId && (
              <FollowButton profileUserId={teacherId} initialFollowers={initialFollowers} initialFollowing={initialFollowing} />
            )}
          </div>
        </div>

        {/* Authored Questions Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-6">Posted Questions <span className="text-slate-400 font-normal text-lg ml-2">({questions.length})</span></h2>

          {questions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions.map((q) => (
                <QuestionCard key={q.id} q={q} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
              This teacher hasn&apos;t posted any questions yet.
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    return (<div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Profile not available</div>);
  }
}
