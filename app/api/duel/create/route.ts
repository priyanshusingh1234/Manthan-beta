import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createNotification } from '@/lib/createNotification';

export async function POST(request: Request) {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = auth.replace('Bearer ', '');

    const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { questionId, challengedId, message } = await request.json();

        if (!questionId || !challengedId)
            return NextResponse.json({ error: 'Missing questionId or challengedId' }, { status: 400 });
        if (user.id === challengedId)
            return NextResponse.json({ error: 'Cannot duel yourself' }, { status: 400 });

        // Prevent challenging teachers
        const { data: challengedProfile } = await supabaseAdmin
            .from('profiles')
            .select('is_teacher, full_name, username')
            .eq('id', challengedId)
            .maybeSingle();
        if (challengedProfile?.is_teacher)
            return NextResponse.json({ error: 'Cannot challenge a teacher' }, { status: 400 });

        // Verify question exists and is MCQ
        const { data: question } = await supabaseAdmin
            .from('questions')
            .select('id, title, options, points')
            .eq('id', questionId)
            .maybeSingle();
        if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        if (!question.options || (Array.isArray(question.options) && question.options.length === 0))
            return NextResponse.json({ error: 'Only MCQ questions can be duelled' }, { status: 400 });

        // Check no active duel between same two users for same question
        const { data: existing } = await supabaseAdmin
            .from('duel_challenges')
            .select('id')
            .eq('question_id', questionId)
            .eq('challenger_id', user.id)
            .eq('challenged_id', challengedId)
            .not('status', 'in', '(rejected,expired,completed)')
            .maybeSingle();
        if (existing)
            return NextResponse.json({ error: 'A duel for this question is already pending.' }, { status: 400 });

        // Create duel (expires in 24h)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: duel, error: insertErr } = await supabaseAdmin
            .from('duel_challenges')
            .insert({
                question_id: questionId,
                challenger_id: user.id,
                challenged_id: challengedId,
                status: 'pending',
                message: message?.trim() || null,
                expires_at: expiresAt,
            })
            .select()
            .single();
        if (insertErr) throw insertErr;

        // Notify challenged user
        const challengerName = user.user_metadata?.fullName || user.user_metadata?.full_name || 'Someone';
        const challengerAvatar = (() => {
            const u = user.user_metadata?.avatar_url || null;
            return u && !u.includes('googleusercontent.com') ? u : undefined;
        })();

        await createNotification({
            userId: challengedId,
            type: 'coop_challenge',
            title: `⚔️ ${challengerName} challenged you to a duel!`,
            body: message?.trim()
                ? `"${message.trim()}" — Accept or reject within 24 hours`
                : `Can you beat ${challengerName}? Accept or reject the duel within 24 hours.`,
            href: `/duel/${duel.id}`,
            actorId: user.id,
            actorName: challengerName,
            actorAvatar: challengerAvatar,
        });

        return NextResponse.json({ success: true, duelId: duel.id });
    } catch (e: any) {
        console.error('[duel/create]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
