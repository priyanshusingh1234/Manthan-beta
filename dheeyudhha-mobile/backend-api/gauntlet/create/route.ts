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
            reward_points, reward_threshold_percent, custom_questions
        } = body;

        const slug = `${subject.toLowerCase().replace(/\s+/g, '-')}-${difficulty.toLowerCase()}-${Date.now()}`;

        const { data, error } = await supabaseAdmin
            .from('gauntlets' as any)
            .insert({
                slug,
                title: title.trim(),
                description: description || '',
                subject: subject.trim(),
                class_grade: class_grade || null,
                difficulty,
                question_count: parseInt(question_count),
                time_minutes: parseInt(time_minutes),
                color: color || 'from-indigo-600 to-indigo-800',
                reward: reward || 'Sharpen your skills',
                reward_points: parseInt(reward_points) || 0,
                reward_threshold_percent: parseInt(reward_threshold_percent) || 0,
                custom_questions: custom_questions || null,
                is_active: true,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, gauntlet: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await req.json();
        const { error } = await supabaseAdmin.from('gauntlets' as any).delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
