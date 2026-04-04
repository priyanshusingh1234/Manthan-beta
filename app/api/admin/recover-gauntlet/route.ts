import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // 1. Get IDs of all 'hard' questions for Class 9
        const { data: hardQs } = await supabaseAdmin.from('questions').select('id').eq('class_grade', '9').eq('difficulty', 'hard');
        const hardQIds = (hardQs || []).map(q => q.id);
        
        // 2. Find users who attempted a high volume of these in a short window (e.g. 60 mins)
        // Since we can't easily do a "window" grouping in a simple query, 
        // we'll fetch all attempts on these questions in the last 72 hours.
        const { data: attempts } = await supabaseAdmin.from('question_attempts')
            .select('user_id, created_at, is_correct')
            .in('question_id', hardQIds)
            .gte('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());

        if (!attempts || attempts.length === 0) {
            return NextResponse.json({ message: "No recent activity on hard questions found." });
        }

        const userStats: Record<string, { count: number; correct: number; firstAt: string; lastAt: string }> = {};
        
        attempts.forEach(a => {
            if (!userStats[a.user_id]) {
                userStats[a.user_id] = { count: 0, correct: 0, firstAt: a.created_at, lastAt: a.created_at };
            }
            userStats[a.user_id].count++;
            if (a.is_correct) userStats[a.user_id].correct++;
            
            if (new Date(a.created_at) < new Date(userStats[a.user_id].firstAt)) userStats[a.user_id].firstAt = a.created_at;
            if (new Date(a.created_at) > new Date(userStats[a.user_id].lastAt)) userStats[a.user_id].lastAt = a.created_at;
        });

        // 3. Filter for candidates who likely took the Gauntlet (High count in a small time window)
        const candidates = [];
        for (const [uId, stats] of Object.entries(userStats)) {
            const durationMins = (new Date(stats.lastAt).getTime() - new Date(stats.firstAt).getTime()) / 60000;
            
            // If they did 30+ hard questions within 70 minutes, it's 99% the Gauntlet!
            if (stats.count >= 30 && durationMins <= 70) {
                const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, username').eq('id', uId).maybeSingle();
                candidates.push({
                    name: profile?.full_name || 'Unknown',
                    username: profile?.username || uId,
                    score: stats.correct * 3,
                    accuracy: Math.round((stats.correct / stats.count) * 100),
                    timeTaken: Math.round(durationMins * 60),
                    completedAt: stats.lastAt
                });
            }
        }

        return NextResponse.json({ 
            recoverySource: 'Heuristic analysis of question_attempts',
            potentialWinners: candidates 
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
