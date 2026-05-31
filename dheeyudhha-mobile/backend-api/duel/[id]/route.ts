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

// ── GET /api/duel/[id] ────────────────────────────────────────────────────────
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

        // Auto-expire
        if (duel.status === 'pending' && new Date(duel.expires_at) < new Date()) {
            await supabaseAdmin.from('duel_challenges').update({ status: 'expired' }).eq('id', params.id);
            duel.status = 'expired';
        }

        const { data: question } = await supabaseAdmin
            .from('questions')
            .select('id, title, body, options, correct_option, points, subject, class_grade, difficulty')
            .eq('id', duel.question_id)
            .maybeSingle();

        // Fetch profiles
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', [duel.challenger_id, duel.challenged_id]);

        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
        const cp = profileMap[duel.challenger_id] || {};
        const dp = profileMap[duel.challenged_id] || {};

        // Only reveal correct_option once completed; always spread safely in case question was deleted
        const safeQuestion = question
            ? (duel.status === 'completed'
                ? question
                : { ...question, correct_option: undefined })
            : null;

        return NextResponse.json({
            duel: {
                id: duel.id,
                status: duel.status,
                message: duel.message,
                expiresAt: duel.expires_at,
                createdAt: duel.created_at,
                // Only challenged person's answer is relevant now
                challengedAnswer: duel.status === 'completed' ? duel.challenged_answer : (user.id === duel.challenged_id ? duel.challenged_answer : null),
                challengedCorrect: duel.challenged_correct,
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

// ── PATCH /api/duel/[id] ── accept | reject | answer ─────────────────────────
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await getUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, answer, timeMs } = body;

        const { data: duel, error } = await supabaseAdmin
            .from('duel_challenges')
            .select('*, questions(title, correct_option, points)')
            .eq('id', params.id)
            .single();
        if (error || !duel) return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
        if (duel.challenger_id !== user.id && duel.challenged_id !== user.id)
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

        // Auto-expire
        if (duel.status === 'pending' && new Date(duel.expires_at) < new Date()) {
            await supabaseAdmin.from('duel_challenges').update({ status: 'expired' }).eq('id', params.id);
            return NextResponse.json({ error: 'Duel has expired' }, { status: 409 });
        }

        // Fetch profiles
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
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
                body: `${challengedProfile.full_name || 'Your opponent'} accepted your duel challenge. Waiting for their answer!`,
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

        // ── ANSWER (only the challenged person answers) ───────────────────────
        if (action === 'answer') {
            if (duel.status !== 'accepted') return NextResponse.json({ error: 'Duel is not active' }, { status: 409 });
            // Only the challenged person answers
            if (user.id !== duel.challenged_id) return NextResponse.json({ error: 'Only the challenged player answers' }, { status: 403 });
            if (typeof answer !== 'number') return NextResponse.json({ error: 'answer must be a number' }, { status: 400 });

            // Prevent double-answer
            if (duel.challenged_answer !== null && duel.challenged_answer !== undefined)
                return NextResponse.json({ error: 'Already answered' }, { status: 409 });

            const question = duel.questions as any;
            const correctOption = question?.correct_option ?? -1;
            const isCorrect = answer === correctOption;

            // Challenged correct → challenged wins. Challenged wrong → challenger wins.
            const winnerId = isCorrect ? duel.challenged_id : duel.challenger_id;

            await supabaseAdmin.from('duel_challenges').update({
                challenged_answer: answer,
                challenged_correct: isCorrect,
                challenged_time_ms: timeMs || null,
                status: 'completed',
                winner_id: winnerId,
            }).eq('id', params.id);

            const winnerName = isCorrect
                ? (challengedProfile.full_name || 'Your opponent')
                : (challengerProfile.full_name || 'You');

            // Notify challenger of the result
            await createNotification({
                userId: duel.challenger_id,
                type: 'coop_challenge',
                title: isCorrect ? `💀 ${challengedProfile.full_name || 'Opponent'} answered correctly!` : `🏆 Your challenge held up!`,
                body: isCorrect
                    ? `${challengedProfile.full_name || 'Your opponent'} cracked your question. Well played!`
                    : `${challengedProfile.full_name || 'Your opponent'} couldn't answer your question. You win!`,
                href: `/duel/${params.id}`,
                actorId: user.id,
                actorName: challengedProfile.full_name || 'Opponent',
            });

            // Notify challenged of their result
            await createNotification({
                userId: duel.challenged_id,
                type: 'coop_challenge',
                title: isCorrect ? `✅ You answered correctly!` : `❌ Wrong answer`,
                body: isCorrect
                    ? `You cracked ${challengerProfile.full_name || 'the challenger'}'s question!`
                    : `You got it wrong. ${challengerProfile.full_name || 'The challenger'} wins this round.`,
                href: `/duel/${params.id}`,
                actorId: duel.challenger_id,
                actorName: challengerProfile.full_name || 'Challenger',
            });

            return NextResponse.json({ success: true, status: 'completed', isCorrect, winnerId });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error('[duel/patch]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
