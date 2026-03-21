import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function getVerifiedUser(bearer?: string | null) {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch { return null; }
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);

        // We can only provide smart suggestions if the user is authenticated
        if (!currentUser) {
            return NextResponse.json({ suggestions: [] });
        }

        const userId = currentUser.id;
        const userGrade = currentUser.user_metadata?.classGrade?.toString();
        const userSchool = currentUser.user_metadata?.school;

        // 1. Get who the user is ALREADY following so we don't suggest them
        const { data: followsData } = await supabaseAdmin
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        const alreadyFollowingIds = new Set((followsData || []).map((f: any) => f.following_id));
        alreadyFollowingIds.add(userId); // Don't suggest themselves

        // 2. Get a wide pool of users to evaluate (up to 100 for performance)
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
        const users = usersData?.users || [];

        // 3. Score each user based on our algorithm
        const scoredUsers = users
            .filter(u => !alreadyFollowingIds.has(u.id))
            .map(u => {
                const meta = u.user_metadata || {};
                let score = 0;
                let reason = '';

                // Scoring Logic
                if (meta.isTeacher) {
                    score += 50;
                    reason = 'Teacher';
                }

                if (userSchool && meta.school === userSchool) {
                    score += 30;
                    if (!reason || reason === 'Teacher') reason = reason ? 'Teacher at your school' : 'From your school';
                }

                if (userGrade && meta.classGrade?.toString() === userGrade) {
                    score += 20;
                    if (!reason) reason = `Class ${userGrade} Student`;
                }

                // Minor fallback reason
                if (!reason) {
                    reason = 'Suggested for you';
                    score += Math.random() * 5; // Light randomness to fallback suggestions
                }

                return {
                    id: u.id,
                    name: meta.fullName || meta.full_name || meta.name || 'User',
                    username: meta.username || null,
                    avatar: meta.avatar_url || meta.avatar || null,
                    isTeacher: meta.isTeacher || false,
                    reason,
                    score,
                    totalPoints: Number(meta.totalPoints) || 0,
                };
            });

        // 4. Sort by highest score first, slice top 5
        scoredUsers.sort((a, b) => b.score - a.score);
        const topSuggestions = scoredUsers.slice(0, 5);

        return NextResponse.json({ suggestions: topSuggestions });

    } catch (err: any) {
        console.error('[Suggestions API]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
