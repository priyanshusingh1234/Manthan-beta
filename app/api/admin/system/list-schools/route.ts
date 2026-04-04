import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { data: schools, error } = await supabaseAdmin.from('schools').select('id, name');
        if (error) throw error;
        return NextResponse.json({ schools });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
