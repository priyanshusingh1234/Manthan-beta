import supabaseAdmin from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let allUsers: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({
                page,
                pageSize: 1000,
            });

            if (error || !data?.users) {
                throw new Error(error?.message || 'Failed to fetch users');
            }

            allUsers = allUsers.concat(data.users);
            hasMore = data.users.length === 1000;
            page += 1;
        }

        const students = allUsers
            .filter((u: any) => {
                const meta = u.user_metadata || {};
                return meta.isTeacher !== true && meta.is_teacher !== true;
            })
            .map((u: any) => {
                const meta = u.user_metadata || {};
                return {
                    id: u.id,
                    name: meta.fullName || meta.full_name || meta.name || u.email || 'Student',
                    username: meta.username || u.id,
                    school: meta.school || 'Unknown School',
                    avatar: meta.avatar_url || meta.avatar || null,
                    points: Number(meta.totalPoints) || 0,
                    streak: 0,
                    schoolColor: 'bg-blue-500',
                };
            })
            .sort((a, b) => b.points - a.points)
            .slice(0, 10)
            .map((s, i) => ({ ...s, rank: i + 1 }));

        return NextResponse.json({ topBrains: students }, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
            },
        });
    } catch (err: any) {
        console.error('[leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
