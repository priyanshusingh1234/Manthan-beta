import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import React from 'react';
import { Link } from 'expo-router';
import { Star, Target, Users, Activity } from 'lucide-react-native';
import supabaseAdmin from '@/lib/supabaseAdmin';
import TeacherBadge from '@/ticks/teacher';
import TeacherPublicTabs from '@/components/TeacherPublicTabs';
import FollowButton from '@/components/FollowButton';


export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { username: string } };

export default async function TeacherProfilePage({ params }: Props) {
  const targetUsername = params.username;
  if (!targetUsername) return (<View className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Teacher not found</View>);

  try {
    let fetchedUser: any = null;

    // Fast, case-insensitive ID lookup from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_teacher, avatar_url, last_seen')
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
        <View className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 flex-row">
          <View className="text-center">
            <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Teacher Not Found</Text>
            <Text className="text-slate-500 mb-6 font-medium italic">The mentor @{targetUsername} could not be located.</Text>
            <Link href="/feed" className="text-indigo-600 font-bold hover:underline">Return to Feed</Link>
          </View>
        </View>
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

    // Online Status (active in last 3 minutes)
    const isOnline = profile?.last_seen 
        ? (new Date().getTime() - new Date(profile.last_seen).getTime()) < 3 * 60 * 1000 
        : false;

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
      <View className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-4 sm:pt-10">
        <View className="max-w-[90rem] mx-auto px-0 sm:px-6 lg:px-8">
          <View className="h-40 sm:h-72 w-full relative sm:bg-slate-800 sm:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5 group">
            {/* Fallback pattern/gradient for teacher banner */}
            <View className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-800 opacity-90 transition-transform duration-700 group-hover:scale-105" />
            <View className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <View className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
          </View>
        </View>

        <View className="max-w-5xl mx-auto sm:px-6 lg:px-8 -mt-12 sm:-mt-24 relative z-10 w-full">
          {/* Teacher Profile Card - Native Look */}
          <View className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-3xl shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] sm:shadow-xl p-6 sm:p-10 border-t sm:border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left mb-10">
            <View className="relative shrink-0">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image src={avatar} alt={name} className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20 bg-white dark:bg-slate-900 transition-transform hover:scale-105 duration-300" />
                ) : (
                  <View className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900/40 to-purple-100 dark:to-purple-900/20 flex items-center justify-center text-4xl font-bold text-indigo-500 dark:text-indigo-400 shadow-2xl ring-4 ring-white dark:ring-slate-900 relative -mt-16 sm:-mt-20 flex-row">{String(name[0] || 'T').toUpperCase()}</View>
                )}
                {isOnline && (
                    <View className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full shadow-lg z-20"></View>
                )}
            </View>

            <View className="flex-1 w-full flex-row">
              <Text className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 tracking-tighter flex-row">
                {name}
                <TeacherBadge />
              </Text>
              <View className="flex items-center gap-2 flex-wrap mt-0.5 sm:mt-1 justify-center sm:justify-start flex-row">
                  <Text className="text-indigo-500 dark:text-indigo-400 font-bold text-lg font-mono tracking-tight">@{username}</Text>
                  {isOnline && (
                      <Text className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800/50 flex-row">
                          <Text className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></Text>
                          Online
                      </Text>
                  )}
              </View>

              <View className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-4 flex-row">
                {mainSubject && <Text className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black px-4 py-1.5 rounded-full text-xs sm:text-sm tracking-widest uppercase border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">{mainSubject}</Text>}

                <View className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border border-amber-100 dark:border-amber-800/40 shadow-sm flex-row">
                  <Text className="text-amber-500 text-lg leading-none select-none">★</Text>
                  <Text>{averageRating > 0 ? averageRating.toFixed(1) : "New"} Mentor</Text>
                  {totalReviews > 0 && <Text className="text-amber-600/60 dark:text-amber-500/50 font-bold ml-1">({totalReviews})</Text>}
                </View>
              </View>

              {bio && <Text className="mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto sm:mx-0 w-full font-medium italic overflow-hidden">{bio}</Text>}

              <View className="mt-6 flex justify-center sm:justify-start flex-row">
                {teacherId && (
                  <FollowButton profileUserId={teacherId} initialFollowers={initialFollowers} initialFollowing={initialFollowing} />
                )}
              </View>
            </View>
          </View>

          {/* Render Client Component with data */}
          <TeacherPublicTabs 
            showImpact={showImpact} 
            impactStats={{ accuracy, reached, solves }} 
            questions={questions} 
          />
        </View>
      </View>
    );
  } catch (err: any) {
    if (err?.message === "NOT_A_TEACHER") {
      const { redirect } = await import('@/lib/next-navigation');
      redirect(`/user/${targetUsername}`);
    }
    return (<View className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Profile not available</View>);
  }
}
