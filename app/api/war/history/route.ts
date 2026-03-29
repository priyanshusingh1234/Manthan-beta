import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

function calcScore(subs: any[], schoolId: string) {
    return (subs || [])
        .filter((s: any) => s.school_id === schoolId && s.status === 'correct')
        .reduce((sum: number, s: any) => sum + (s.points_awarded || 0), 0);
}

async function finalizeWarIfNeeded(war: any) {
    const now = Date.now();
    const endsAtMs = war?.ends_at ? new Date(war.ends_at).getTime() : null;
    const shouldFinalize =
        (war.status === 'active' || war.status === 'calculating') &&
        endsAtMs !== null &&
        now > endsAtMs;

    const completedMissingResult =
        war.status === 'completed' &&
        (war.challenger_score == null || war.defender_score == null || war.winner_school_id === undefined);

    if (!shouldFinalize && !completedMissingResult) return war;

    const { data: subs } = await supabaseAdmin
        .from('war_submissions')
        .select('school_id, points_awarded, status')
        .eq('war_id', war.id);

    const cScore = calcScore(subs || [], war.challenger_school_id);
    const dScore = calcScore(subs || [], war.defender_school_id);
    const winnerSchoolId = cScore > dScore
        ? war.challenger_school_id
        : dScore > cScore
            ? war.defender_school_id
            : null;

    const { data: updated } = await supabaseAdmin
        .from('wars')
        .update({
            status: 'completed',
            challenger_score: cScore,
            defender_score: dScore,
            winner_school_id: winnerSchoolId,
        })
        .eq('id', war.id)
        .select(`
            *,
            challenger_school:schools!challenger_school_id(name),
            defender_school:schools!defender_school_id(name),
            winner_school:schools!winner_school_id(name)
        `)
        .single();

    return updated || war;
}

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
            .order('declared_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("War history error:", error);
            return NextResponse.json({ error: "Failed to fetch war history" }, { status: 500 });
        }

        const hydratedWars = await Promise.all((wars || []).map((war) => finalizeWarIfNeeded(war)));

        return NextResponse.json({ wars: hydratedWars });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
