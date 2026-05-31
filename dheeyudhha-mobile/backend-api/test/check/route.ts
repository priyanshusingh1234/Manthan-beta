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

        // Check if a result exists in test_results OR if they have recent high pts (fallback)
        const { data: result } = await supabaseAdmin
            .from('test_results' as any)
            .select('id')
            .eq('user_id', user.id)
            .eq('test_id', testId)
            .maybeSingle();

        return NextResponse.json({ 
            hasSubmission: !!result,
            userId: user.id
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
