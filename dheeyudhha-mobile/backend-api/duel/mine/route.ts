import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function getUser(req: Request) {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const token = auth.replace(/^Bearer\s+/i, '');
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await anon.auth.getUser(token);
    return user || null;
}

// GET /api/duel/mine — fetch all duels for the current user
export async function GET(req: Request) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // optional filter

        let query = supabaseAdmin
            .from('duel_challenges')
            .select(`
                id, status, message, expires_at, created_at,
                challenger_id, challenged_id,
                challenger_answer, challenged_answer,
                challenger_correct, challenged_correct,
                challenger_time_ms, challenged_time_ms,
                winner_id,
                questions (id, title, subject, options, points)
            `)
            .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(40);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: duels, error } = await query;
        if (error) throw error;

        // Get all unique opponent IDs
        const opponentIds = [...new Set(
            (duels || []).map((d: any) =>
                d.challenger_id === user.id ? d.challenged_id : d.challenger_id
            )
        )];

        // Fetch opponent profiles
        const { data: profiles } = opponentIds.length
            ? await supabaseAdmin
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', opponentIds)
            : { data: [] };

        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
        const isGoogleAvatar = (url: string | null) => !!url && url.includes('googleusercontent.com');

        const enriched = (duels || []).map((d: any) => {
            const isChallenger = d.challenger_id === user.id;
            const opponentId = isChallenger ? d.challenged_id : d.challenger_id;
            const opp = profileMap[opponentId] || {};

            // Auto-expire check for display
            let status = d.status;
            if (status === 'pending' && new Date(d.expires_at) < new Date()) {
                status = 'expired';
            }

            return {
                id: d.id,
                status,
                message: d.message,
                expiresAt: d.expires_at,
                createdAt: d.created_at,
                isChallenger,
                myAnswer: isChallenger ? d.challenger_answer : d.challenged_answer,
                myCorrect: isChallenger ? d.challenger_correct : d.challenged_correct,
                myTimeMs: isChallenger ? d.challenger_time_ms : d.challenged_time_ms,
                winnerId: d.winner_id,
                iWon: d.winner_id === user.id,
                isDraw: d.status === 'completed' && d.winner_id === null,
                question: d.questions ? {
                    id: d.questions.id,
                    title: d.questions.title,
                    subject: d.questions.subject,
                    points: d.questions.points,
                    isMultiChoice: Array.isArray(d.questions.options) && d.questions.options.length > 0,
                } : null,
                opponent: {
                    id: opponentId,
                    name: opp.full_name || 'Unknown',
                    username: opp.username || '',
                    avatar: opp.avatar_url && !isGoogleAvatar(opp.avatar_url) ? opp.avatar_url : null,
                },
            };
        });

        return NextResponse.json({ duels: enriched });
    } catch (e: any) {
        console.error('[duel/mine]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
