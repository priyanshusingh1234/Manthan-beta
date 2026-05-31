import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // First, get the user's points
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('total_points, is_teacher')
            .eq('id', id)
            .single();

        if (profileError || !userProfile || userProfile.is_teacher) {
            return NextResponse.json({ rank: null }, { status: 200 });
        }

        // Count how many students have STRICTLY MORE points
        const { count: higherRanked, error: countError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_teacher', false)
            .gt('total_points', userProfile.total_points);

        if (countError) {
            throw countError;
        }

        // Rank is the number of people with more points + 1
        const rank = (higherRanked || 0) + 1;

        return NextResponse.json({ rank }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
