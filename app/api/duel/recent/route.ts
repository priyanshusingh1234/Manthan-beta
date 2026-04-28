import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/duel/recent — latest 10 completed duels for the public feed
export async function GET() {
    try {
        const { data: duels, error } = await supabaseAdmin
            .from('duel_challenges')
            .select(`
                id, winner_id, challenger_id, challenged_id, created_at,
                challenger_correct, challenged_correct,
                questions (subject)
            `)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!duels || duels.length === 0) return NextResponse.json({ duels: [] });

        // Collect all unique user IDs
        const userIds = [...new Set(duels.flatMap((d: any) => [d.challenger_id, d.challenged_id]))];

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', userIds);

        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
        const isGoogleAvatar = (url: string | null) => !!url && url.includes('googleusercontent.com');

        const enriched = duels.map((d: any) => {
            const challenger = profileMap[d.challenger_id] || {};
            const challenged = profileMap[d.challenged_id] || {};
            const winner = d.winner_id ? profileMap[d.winner_id] : null;
            const isDraw = !d.winner_id;

            return {
                id: d.id,
                subject: (d.questions as any)?.subject || 'General',
                isDraw,
                winner: winner ? {
                    name: winner.full_name || 'Unknown',
                    username: winner.username || '',
                    avatar: winner.avatar_url && !isGoogleAvatar(winner.avatar_url) ? winner.avatar_url : null,
                } : null,
                loser: !isDraw ? (d.winner_id === d.challenger_id ? {
                    name: challenged.full_name || 'Unknown',
                    username: challenged.username || '',
                    avatar: challenged.avatar_url && !isGoogleAvatar(challenged.avatar_url) ? challenged.avatar_url : null,
                } : {
                    name: challenger.full_name || 'Unknown',
                    username: challenger.username || '',
                    avatar: challenger.avatar_url && !isGoogleAvatar(challenger.avatar_url) ? challenger.avatar_url : null,
                }) : null,
                challenger: { name: challenger.full_name || 'Unknown', username: challenger.username || '' },
                challenged: { name: challenged.full_name || 'Unknown', username: challenged.username || '' },
                winnerCorrect: d.winner_id === d.challenger_id ? d.challenger_correct : d.challenged_correct,
                loserCorrect: d.winner_id === d.challenger_id ? d.challenged_correct : d.challenger_correct,
                createdAt: d.created_at,
            };
        });

        return NextResponse.json({ duels: enriched });
    } catch (e: any) {
        console.error('[duel/recent]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
