import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").toLowerCase().trim();
        const exclude = searchParams.get("exclude") || "";

        if (q.length < 2) {
            return NextResponse.json({ users: [] });
        }

        // Search profiles table directly — always fresh, no stale auth metadata
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url, is_teacher')
            .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
            .eq('is_teacher', false)
            .neq('id', exclude || '00000000-0000-0000-0000-000000000000')
            .limit(15);

        if (error) throw error;

        const isGoogleAvatar = (url: string | null) =>
            !!url && url.includes('googleusercontent.com');

        const users = (profiles || [])
            .filter((p) => p.id !== exclude)
            .map((p) => ({
                id: p.id,
                name: p.full_name || 'Unknown',
                username: p.username || '',
                avatar: p.avatar_url && !isGoogleAvatar(p.avatar_url) ? p.avatar_url : null,
            }));

        return NextResponse.json({ users });
    } catch (err: any) {
        console.error("[users/search] Error:", err);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
