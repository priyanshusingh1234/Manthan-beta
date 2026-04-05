import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userEmail = user.email?.toLowerCase() || '';
        if (!ADMIN_EMAILS.includes(userEmail)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const body = await req.json();
        const {
            title, description, subject, class_grade, difficulty,
            question_count, time_minutes, color, reward,
            reward_points, reward_threshold_percent
        } = body;

        if (!title || !subject || !difficulty || !question_count || !time_minutes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const slug = `${subject.toLowerCase().replace(/\s+/g, '-')}-${class_grade || 'all'}-${difficulty.toLowerCase()}-${Date.now()}`;

        const { data, error } = await supabaseAdmin
            .from('gauntlets' as any)
            .insert({
                slug,
                title,
                description: description || '',
                subject,
                class_grade: class_grade || null,
                difficulty,
                question_count: parseInt(question_count),
                time_minutes: parseInt(time_minutes),
                color: color || 'from-indigo-600 to-indigo-800',
                reward: reward || 'Sharpen your skills',
                reward_points: parseInt(reward_points) || 0,
                reward_threshold_percent: parseInt(reward_threshold_percent) || 0,
                is_active: true,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, gauntlet: data });
    } catch (err: any) {
        console.error('[gauntlet/create]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userEmail = user.email?.toLowerCase() || '';
        if (!ADMIN_EMAILS.includes(userEmail)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('gauntlets' as any)
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
