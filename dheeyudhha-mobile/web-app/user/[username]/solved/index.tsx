import React from 'react';
import { Link } from 'expo-router';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { ArrowLeft, Trophy, Star } from 'lucide-react-native';
import QuestionCard from '@/components/QuestionCard';

type Props = { params: { username: string } };

export default async function UserSolvedQuestionsPage({ params }: Props) {
    const { username } = params;

    // Fast, case-insensitive lookup from profiles table
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, username')
        .ilike('username', username)
        .single();

    let fetchedUser = profile;
    
    // Fallback securely to auth metadata if profile entry was deleted or not synced
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
            <View className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 flex-row">
                <View className="text-center">
                    <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">User Not Found</Text>
                    <Text className="text-slate-500 mb-6">The student @{username} could not be located.</Text>
                    <Link href="/feed" className="text-indigo-600 font-bold hover:underline">Back to Feed</Link>
                </View>
            </View>
        );
    }

    const userId = fetchedUser.id;

    // Fetch question IDs from attempts and submissions
    const [qAttemptsRes, wSubsRes] = await Promise.all([
        supabaseAdmin.from('question_attempts').select('question_id').eq('user_id', userId),
        supabaseAdmin.from('written_submissions').select('question_id').eq('student_id', userId)
    ]);

    const solvedIds = Array.from(new Set([
        ...(qAttemptsRes.data || []).map(a => a.question_id),
        ...(wSubsRes.data || []).map(s => s.question_id)
    ]));

    let displayQuestions: any[] = [];
    if (solvedIds.length > 0) {
        // Query questions directly without unstable PostgREST joins
        const { data: questions } = await supabaseAdmin
            .from('questions')
            .select('*')
            .in('id', solvedIds)
            .order('created_at', { ascending: false });
        
        if (questions && questions.length > 0) {
            // Extract all unique creator IDs
            const creatorIds = Array.from(new Set(questions.map(q => String(q.created_by)).filter(Boolean)));
            
            // Manually fetch creator profiles for visual display
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, avatar_url, username')
                .in('id', creatorIds);
                
            const profileMap = new Map((profiles || []).map(p => [String(p.id), p]));

            displayQuestions = questions.map(q => {
                const creator = profileMap.get(String(q.created_by)) as any;
                return {
                    ...q,
                    hasAttempted: true,
                    createdByName: creator?.full_name || 'Teacher',
                    createdByAvatar: creator?.avatar_url,
                    createdByUsername: creator?.username
                };
            });
        }
    }

    return (
        <View className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-6 sm:pt-10">
            <View className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header Section - Native Mobile Optimization */}
                <View className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 sm:mb-12 text-center sm:text-left">
                    <Link href={`/user/${username}`} className="w-full sm:w-auto flex justify-center sm:block flex-row">
                        <View className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md hover:-translate-x-1 group flex-row">
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </View>
                    </Link>
                    <View className="flex-1 flex-row">
                        <Text className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 capitalize flex-row">
                            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 shrink-0" />
                            <Text>{username}'s Achievements</Text>
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 font-medium">
                            A showcases of successfully solved Master Challenges
                        </Text>
                    </View>
                </View>

                {/* Question Listing - Optimized for Mobile Feed Look */}
                <View className="space-y-4 sm:space-y-6 px-1 sm:px-0">
                    {displayQuestions.length === 0 ? (
                        <View className="py-20 sm:py-24 text-center bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-sm transition-all">
                             <View className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 flex-row">
                                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
                             </View>
                             <Text className="text-lg sm:text-xl font-black text-slate-800 dark:text-white mb-2 underline decoration-indigo-500/30">Quiet on the front</Text>
                             <Text className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-[13px] sm:text-sm font-medium">No questions solved yet. Check back once @{username} masters some topics!</Text>
                        </View>
                    ) : (
                        displayQuestions.map((q) => (
                            <View key={q.id} className="transition-transform active:scale-[0.98] duration-200">
                                <QuestionCard q={q} />
                            </View>
                        ))
                    )}
                </View>
            </View>
        </View>
    );
}
