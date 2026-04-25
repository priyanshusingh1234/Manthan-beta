import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

async function getUser(req: Request) {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const token = auth.replace(/^Bearer\s+/i, '');
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await anon.auth.getUser(token);
    return user || null;
}

// ── GET /api/duel/[id] — fetch full duel state ─────────────────────────────
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: duel, error } = await supabaseAdmin
            .from('duel_challenges')
            .select('*')
            .eq('id', params.id)
            .single();
        if (error || !duel) return NextResponse.json({ error: 'Duel not found' }, { status: 404 });

        if (duel.challenger_id !== user.id && duel.challenged_id !== user.id)
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

        // Auto-expire if needed
        if (duel.status === 'pending' && new Date(duel.expires_at) < new Date()) {
            await supabaseAdmin.from('duel_challenges').update({ status: 'expired' }).eq('id', params.id);
            duel.status = 'expired';
        }

        // Fetch question
        const { data: question } = await supabaseAdmin
            .from('questions')
            .select('id, title, body, options, correct_option, points, subject, class_grade, difficulty, time_limit')
            .eq('id', duel.question_id)
            .single();

        // Fetch both profiles from profiles table
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', [duel.challenger_id, duel.challenged_id]);

        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
        const cp = profileMap[duel.challenger_id] || {};
        const dp = profileMap[duel.challenged_id] || {};

        // Only reveal correct_option after duel is completed
        const safeQuestion = duel.status === 'completed'
            ? question
            : { ...(question || {}), correct_option: undefined };

        return NextResponse.json({
            duel: {
                id: duel.id,
                status: duel.status,
                message: duel.message,
                expiresAt: duel.expires_at,
                createdAt: duel.created_at,
                challengerAnswer: user.id === duel.challenger_id ? duel.challenger_answer : (duel.status === 'completed' ? duel.challenger_answer : null),
                challengedAnswer: user.id === duel.challenged_id ? duel.challenged_answer : (duel.status === 'completed' ? duel.challenged_answer : null),
                challengerCorrect: duel.challenger_correct,
                challengedCorrect: duel.challenged_correct,
                challengerTimeMs: duel.challenger_time_ms,
                challengedTimeMs: duel.challenged_time_ms,
                winnerId: duel.winner_id,
            },
            question: safeQuestion,
            challenger: {
                id: duel.challenger_id,
                name: cp.full_name || 'Player 1',
                username: cp.username || '',
                avatar: cp.avatar_url || null,
                isCurrentUser: user.id === duel.challenger_id,
                hasAnswered: duel.challenger_answer !== null && duel.challenger_answer !== undefined,
            },
            challenged: {
                id: duel.challenged_id,
                name: dp.full_name || 'Player 2',
                username: dp.username || '',
                avatar: dp.avatar_url || null,
                isCurrentUser: user.id === duel.challenged_id,
                hasAnswered: duel.challenged_answer !== null && duel.challenged_answer !== undefined,
            },
            currentUserId: user.id,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── PATCH /api/duel/[id] — accept | reject | answer ───────────────────────
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, answer, timeMs } = body;
        // action: 'accept' | 'reject' | 'answer'

        const { data: duel, error } = await supabaseAdmin
            .from('duel_challenges')
            .select('*, questions(title, correct_option, points)')
            .eq('id', params.id)
            .single();
        if (error || !duel) return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
        if (duel.challenger_id !== user.id && duel.challenged_id !== user.id)
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

        // Auto-expire check
        if (duel.status === 'pending' && new Date(duel.expires_at) < new Date()) {
            await supabaseAdmin.from('duel_challenges').update({ status: 'expired' }).eq('id', params.id);
            return NextResponse.json({ error: 'Duel has expired' }, { status: 409 });
        }

        // Fetch profiles
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username')
            .in('id', [duel.challenger_id, duel.challenged_id]);
        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
        const challengerProfile = profileMap[duel.challenger_id] || {};
        const challengedProfile = profileMap[duel.challenged_id] || {};

        // ── ACCEPT ───────────────────────────────────────────────────────────
        if (action === 'accept') {
            if (duel.status !== 'pending') return NextResponse.json({ error: `Cannot accept: status is ${duel.status}` }, { status: 409 });
            if (user.id !== duel.challenged_id) return NextResponse.json({ error: 'Only the challenged player can accept' }, { status: 403 });

            await supabaseAdmin.from('duel_challenges').update({ status: 'accepted' }).eq('id', params.id);

            await createNotification({
                userId: duel.challenger_id,
                type: 'coop_challenge',
                title: `⚔️ Duel Accepted!`,
                body: `${challengedProfile.full_name || 'Your opponent'} accepted your duel challenge! Answer the question now.`,
                href: `/duel/${params.id}`,
                actorId: user.id,
                actorName: challengedProfile.full_name || 'Opponent',
            });
            return NextResponse.json({ success: true, status: 'accepted' });
        }

        // ── REJECT ───────────────────────────────────────────────────────────
        if (action === 'reject') {
            if (duel.status !== 'pending') return NextResponse.json({ error: `Cannot reject: status is ${duel.status}` }, { status: 409 });
            if (user.id !== duel.challenged_id) return NextResponse.json({ error: 'Only the challenged player can reject' }, { status: 403 });

            await supabaseAdmin.from('duel_challenges').update({ status: 'rejected' }).eq('id', params.id);

            await createNotification({
                userId: duel.challenger_id,
                type: 'coop_challenge',
                title: `❌ Duel Rejected`,
                body: `${challengedProfile.full_name || 'Your opponent'} rejected your duel challenge.`,
                href: `/duel/${params.id}`,
                actorId: user.id,
                actorName: challengedProfile.full_name || 'Opponent',
            });
            return NextResponse.json({ success: true, status: 'rejected' });
        }

        // ── ANSWER ───────────────────────────────────────────────────────────
        if (action === 'answer') {
            if (duel.status !== 'accepted') return NextResponse.json({ error: 'Duel is not active' }, { status: 409 });
            if (typeof answer !== 'number') return NextResponse.json({ error: 'answer must be a number' }, { status: 400 });

            const question = duel.questions as any;
            const correctOption = question?.correct_option ?? -1;
            const isCorrect = answer === correctOption;
            const isChallenger = user.id === duel.challenger_id;

            // Don't allow double-answering
            if (isChallenger && duel.challenger_answer !== null && duel.challenger_answer !== undefined)
                return NextResponse.json({ error: 'Already answered' }, { status: 409 });
            if (!isChallenger && duel.challenged_answer !== null && duel.challenged_answer !== undefined)
                return NextResponse.json({ error: 'Already answered' }, { status: 409 });

            const updateFields: any = isChallenger
                ? { challenger_answer: answer, challenger_correct: isCorrect, challenger_time_ms: timeMs || null }
                : { challenged_answer: answer, challenged_correct: isCorrect, challenged_time_ms: timeMs || null };

            await supabaseAdmin.from('duel_challenges').update(updateFields).eq('id', params.id);

            // Re-fetch to check if both have answered
            const { data: updated } = await supabaseAdmin
                .from('duel_challenges')
                .select('*')
                .eq('id', params.id)
                .single();

            const bothAnswered =
                (updated?.challenger_answer !== null && updated?.challenger_answer !== undefined) &&
                (updated?.challenged_answer !== null && updated?.challenged_answer !== undefined);

            if (bothAnswered && updated) {
                // Compute winner
                let winnerId: string | null = null;
                if (updated.challenger_correct && !updated.challenged_correct) {
                    winnerId = updated.challenger_id;
                } else if (!updated.challenger_correct && updated.challenged_correct) {
                    winnerId = updated.challenged_id;
                } else if (updated.challenger_correct && updated.challenged_correct) {
                    // Both correct → faster time wins
                    const ct = updated.challenger_time_ms || Infinity;
                    const dt = updated.challenged_time_ms || Infinity;
                    winnerId = ct <= dt ? updated.challenger_id : updated.challenged_id;
                }
                // Both wrong → no winner (draw)

                await supabaseAdmin
                    .from('duel_challenges')
                    .update({ status: 'completed', winner_id: winnerId })
                    .eq('id', params.id);

                const winnerProfile = winnerId ? profileMap[winnerId] : null;
                const winnerName = winnerProfile?.full_name || 'Your opponent';
                const isDraw = winnerId === null;

                // Notify both players
                const notifyBoth = async (userId: string, isWinner: boolean) => {
                    await createNotification({
                        userId,
                        type: 'coop_challenge',
                        title: isDraw ? '🤝 Duel — It\'s a Draw!' : isWinner ? '🏆 You won the duel!' : `💀 ${winnerName} won the duel`,
                        body: isDraw
                            ? 'Both of you answered the same way. No winner this time!'
                            : isWinner
                                ? 'You answered correctly and faster. Champion! 🎉'
                                : `${winnerName} beat you this time. Rematch?`,
                        href: `/duel/${params.id}`,
                    });
                };
                await Promise.all([
                    notifyBoth(updated.challenger_id, winnerId === updated.challenger_id),
                    notifyBoth(updated.challenged_id, winnerId === updated.challenged_id),
                ]);

                return NextResponse.json({ success: true, status: 'completed', winnerId, isDraw });
            }

            return NextResponse.json({ success: true, status: 'waiting', isCorrect });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error('[duel/patch]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
