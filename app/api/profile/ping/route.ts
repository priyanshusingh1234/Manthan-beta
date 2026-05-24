import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

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
        
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', user.id);
            
        if (error) throw error;
        
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Profile Ping Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
