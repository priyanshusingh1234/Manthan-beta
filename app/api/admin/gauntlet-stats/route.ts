import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Since we didn't have a results table yet, let's look for users
        // who have exceptionally high points suddenly, or check for a new table
        
        // 1. Check if test_results table exists
        const { data: testResults, error: testErr } = await supabaseAdmin
            .from('test_results' as any)
            .select('*, profiles(full_name, username)')
            .order('created_at', { ascending: false });

        if (!testErr && testResults && testResults.length > 0) {
            return NextResponse.json({ source: 'test_results', data: testResults });
        }

        // 2. Fallback: Check profiles with high scores who were active recently
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, total_points, updated_at')
            .order('total_points', { ascending: false })
            .limit(20);

        return NextResponse.json({ 
            message: "No dedicated 'test_results' found yet. Showing top scholars who might have completed it.",
            profiles 
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
