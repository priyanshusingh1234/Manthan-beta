import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const schoolId = searchParams.get('schoolId');

        if (!schoolId) {
            return NextResponse.json({ error: "Missing schoolId" }, { status: 400 });
        }

        const { data: wars, error } = await supabaseAdmin
            .from('wars')
            .select(`
                *,
                challenger_school:schools!challenger_school_id(name),
                defender_school:schools!defender_school_id(name),
                winner_school:schools!winner_school_id(name)
            `)
            .or(`challenger_school_id.eq.${schoolId},defender_school_id.eq.${schoolId}`)
            .not('status', 'eq', 'searching')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("War history error:", error);
            return NextResponse.json({ error: "Failed to fetch war history" }, { status: 500 });
        }

        return NextResponse.json({ wars });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
