import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const testId = req.nextUrl.searchParams.get('testId') || 'class-9-hard';

        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Get the most recent result (order by completed_at so duplicate rows don't break the check)
        const { data: result } = await supabaseAdmin
            .from('test_results' as any)
            .select('*')
            .eq('user_id', user.id)
            .eq('test_id', testId)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (result) {
            return NextResponse.json({ 
                hasSubmission: true,
                summary: result
            });
        }

        return NextResponse.json({ hasSubmission: false });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
