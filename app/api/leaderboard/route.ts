import { NextResponse } from "next/server";
import { getCachedLeaderboard } from "@/lib/cache";

// Remove force-dynamic — this route now serves from the Next.js Data Cache.
// The cache is shared across ALL Vercel instances for the same deployment,
// revalidated every 60 seconds or on-demand when points change.
export const dynamic = 'force-static';

export async function GET() {
    try {
        const topBrains = await getCachedLeaderboard();
        return NextResponse.json({ topBrains }, {
            status: 200,
            headers: {
                // 60-second browser cache + 60-second CDN cache
                'Cache-Control': 'public, s-maxage=60, max-age=60, stale-while-revalidate=120',
            },
        });
    } catch (err: any) {
        console.error('[leaderboard] error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
