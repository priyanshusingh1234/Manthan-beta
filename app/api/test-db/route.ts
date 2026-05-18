import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Try selecting
        const { data: s, error: sErr } = await supabaseAdmin.from('saved_questions').select('*').limit(1);
        
        // Check indexes
        const { data: i, error: iErr } = await supabaseAdmin.rpc('get_indexes', {}).catch(() => ({ error: 'rpc failed' }));

        return NextResponse.json({
            select_error: sErr,
            select_data: s,
            indexes: i,
            index_error: iErr
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
