import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { questionId, selectedOptionIndex } = await req.json();

        if (!questionId || typeof selectedOptionIndex !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Check claim date in user metadata
        const todayStr = new Date().toISOString().split('T')[0];
        const lastClaim = user.user_metadata?.last_egg_claim_date;
        if (lastClaim === todayStr) {
            return NextResponse.json({ error: 'Already claimed today' }, { status: 403 });
        }

        // Fetch question to verify correct option
        const { data: question, error: qErr } = await supabaseAdmin
            .from('questions')
            .select('correct_option')
            .eq('id', questionId)
            .single();

        if (qErr || !question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        const isCorrect = selectedOptionIndex === question.correct_option;
        const pts = isCorrect ? 5 : -1;

        // Fetch current points
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('total_points')
            .eq('id', user.id)
            .single();

        if (profile) {
            const newPoints = Math.max(0, (profile.total_points || 0) + pts);
            
            // Update points using admin client (bypassing RLS safely)
            await supabaseAdmin.from('profiles').update({ total_points: newPoints }).eq('id', user.id);
        }

        // Update last claim date in auth metadata
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, last_egg_claim_date: todayStr }
        });

        return NextResponse.json({ success: true, isCorrect, ptsAwarded: pts });

    } catch (err: any) {
        console.error('[Daily Egg Claim Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
