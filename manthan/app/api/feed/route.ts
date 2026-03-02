import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get verified userId from bearer token via Supabase
// ─────────────────────────────────────────────────────────────────────────────
async function getUserId(bearer?: string | null): Promise<string | null> {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        return user?.id ?? null;
    } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: normalize a question row into the standard card shape
// ─────────────────────────────────────────────────────────────────────────────
function normalizeQuestion(
    r: any,
    userInfoMap: Record<string, any>,
    attemptsMap: Record<string, { total: number; solved: number }>,
    userAttempted: Set<string>,
    userFailed: Set<string>,
    feedLabel: string
) {
    return {
        id: String(r.id),
        createdBy: r.created_by ? String(r.created_by) : null,
        createdByName: userInfoMap[String(r.created_by)]?.name || 'Teacher',
        createdByAvatar: userInfoMap[String(r.created_by)]?.avatar || null,
        createdByUsername: userInfoMap[String(r.created_by)]?.username || null,
        title: r.title,
        body: r.body,
        subject: r.subject,
        classGrade: r.class_grade,
        points: r.points,
        timeLimit: r.time_limit,
        difficulty: r.difficulty || null,
        options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options || null,
        correctOption: typeof r.correct_option === 'number' ? r.correct_option : null,
        totalAttempts: attemptsMap[String(r.id)]?.total || 0,
        solvedCount: attemptsMap[String(r.id)]?.solved || 0,
        hasAttempted: userAttempted.has(String(r.id)),
        hasFailed: userFailed.has(String(r.id)),
        imagePath: r.image_path || null,
        imageUrl: r.image_url || null,
        createdAt: r.created_at,
        // Feed metadata — shown as label on the card
        _feedLabel: feedLabel,
        _feedScore: 0, // set per layer below
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feed
// Headers: Authorization: Bearer <token>   (optional — returns generic feed if missing)
// Query:   subject, limit
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const userId = await getUserId(authHeader);
        const subject = req.nextUrl.searchParams.get('subject') || '';
        const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '30'), 60);

        // ── Get user profile ─────────────────────────────────────────────────────────
        let userGrade: string | null = null;
        let userSchoolName: string | null = null;
        let followingIds: string[] = [];

        if (userId) {
            // Get the full user profile (token already validated above, reuse)
            const { data: { user: userProfile } } = await supabaseAdmin.auth.getUser(
                req.headers.get('authorization')!.replace(/^Bearer\s+/i, '')
            );
            userGrade = userProfile?.user_metadata?.classGrade?.toString() || null;
            userSchoolName = userProfile?.user_metadata?.school || null;

            // Get following list
            const { data: followsData } = await supabaseAdmin
                .from('follows')
                .select('following_id')
                .eq('follower_id', userId);
            followingIds = (followsData || []).map((f: any) => f.following_id);
        }

        // ── Get attempted & failed question IDs ────────────────────────────
        const userAttempted = new Set<string>();
        const userFailed = new Set<string>();

        if (userId) {
            const { data: attempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, is_correct')
                .eq('user_id', userId);

            (attempts || []).forEach((a: any) => {
                userAttempted.add(String(a.question_id));
                if (!a.is_correct) userFailed.add(String(a.question_id));
            });

            // Also count written submissions as attempted
            const { data: written } = await supabaseAdmin
                .from('written_submissions')
                .select('question_id')
                .eq('student_id', userId);
            (written || []).forEach((w: any) => userAttempted.add(String(w.question_id)));
        }

        // ── Get question pools per layer ───────────────────────────────────
        let pool: any[] = [];

        // Build a base query helper
        const baseQ = () => {
            let q = supabaseAdmin.from('questions').select('*');
            if (subject) q = q.eq('subject', subject) as any;
            return q;
        };

        // LAYER 1 (~20%): Fresh questions at user's grade, never seen by user
        const layer1Count = Math.ceil(limit * 0.20);
        if (userGrade) {
            const { data } = await baseQ()
                .eq('class_grade', userGrade)
                .not('id', 'in', userAttempted.size > 0 ? `(${Array.from(userAttempted).join(',')})` : '(NULL)')
                .order('created_at', { ascending: false })
                .limit(layer1Count);
            (data || []).forEach((r: any) => pool.push({ ...r, _layer: 1, _label: '✨ Fresh for You', _score: 100 }));
        } else {
            // No grade — show newest
            const { data } = await baseQ().order('created_at', { ascending: false }).limit(layer1Count);
            (data || []).forEach((r: any) => pool.push({ ...r, _layer: 1, _label: '✨ Fresh Questions', _score: 100 }));
        }

        // LAYER 2 (~20%): Questions user got wrong — retry zone (spaced repetition)
        if (userFailed.size > 0) {
            const layer2Count = Math.ceil(limit * 0.20);
            const failedArr = Array.from(userFailed).slice(0, layer2Count * 3);
            const { data } = await supabaseAdmin
                .from('questions')
                .select('*')
                .in('id', failedArr)
                .limit(layer2Count);
            (data || []).forEach((r: any) => pool.push({ ...r, _layer: 2, _label: '🔄 Retry Zone', _score: 95 }));
        }

        // LAYER 3 (~20%): What school peers solved recently
        if (userSchoolName && userId) {
            const layer3Count = Math.ceil(limit * 0.20);

            // Get user IDs who belong to the same school
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const schoolmateIds = (usersData?.users || [])
                .filter(u => u.user_metadata?.school === userSchoolName && u.id !== userId)
                .map(u => u.id);

            if (schoolmateIds.length > 0) {
                // Get questions recently solved by schoolmates
                const { data: peerAttempts } = await supabaseAdmin
                    .from('question_attempts')
                    .select('question_id')
                    .in('user_id', schoolmateIds)
                    .eq('is_correct', true)
                    .order('created_at', { ascending: false })
                    .limit(50);

                const peerQIds = [...new Set((peerAttempts || []).map((a: any) => String(a.question_id)))]
                    .filter(id => !userAttempted.has(id))
                    .slice(0, layer3Count);

                if (peerQIds.length > 0) {
                    const { data } = await supabaseAdmin
                        .from('questions')
                        .select('*')
                        .in('id', peerQIds);
                    (data || []).forEach((r: any) => pool.push({ ...r, _layer: 3, _label: '🏫 Trending at Your School', _score: 90 }));
                }
            }
        }

        // LAYER 4 (~10%): Hardest trending questions at user's grade (high attempts, low success)
        const layer4Count = Math.ceil(limit * 0.10);
        if (userGrade) {
            const { data: allAttempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, is_correct');

            // Compute attempt stats
            const statsMap: Record<string, { total: number; correct: number }> = {};
            (allAttempts || []).forEach((a: any) => {
                const id = String(a.question_id);
                if (!statsMap[id]) statsMap[id] = { total: 0, correct: 0 };
                statsMap[id].total++;
                if (a.is_correct) statsMap[id].correct++;
            });

            // Find popular but hard questions (>= 5 attempts, < 40% success)
            const trendingHard = Object.entries(statsMap)
                .filter(([, s]) => s.total >= 5 && s.correct / s.total < 0.4)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([id]) => id)
                .filter(id => !userAttempted.has(id))
                .slice(0, layer4Count * 3);

            if (trendingHard.length > 0) {
                const { data } = await supabaseAdmin
                    .from('questions')
                    .select('*')
                    .in('id', trendingHard)
                    .eq('class_grade', userGrade)
                    .limit(layer4Count);
                (data || []).forEach((r: any) => pool.push({ ...r, _layer: 4, _label: '🔥 Everyone\'s Struggling With This', _score: 85 }));
            }
        }

        // LAYER 5 (~10%): One level up — stretch questions
        const layer5Count = Math.ceil(limit * 0.10);
        if (userGrade) {
            const nextGrade = String(Number(userGrade) + 1);
            const { data } = await baseQ()
                .eq('class_grade', nextGrade)
                .not('id', 'in', userAttempted.size > 0 ? `(${Array.from(userAttempted).join(',')})` : '(NULL)')
                .order('created_at', { ascending: false })
                .limit(layer5Count);
            (data || []).forEach((r: any) => pool.push({ ...r, _layer: 5, _label: '🚀 Stretch: Class ' + nextGrade, _score: 80 }));
        }

        // LAYER 6 (~20%): What people you follow recently solved
        if (followingIds.length > 0 && userId) {
            const layer6Count = Math.ceil(limit * 0.20);
            const { data: followedAttempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, user_id')
                .in('user_id', followingIds)
                .eq('is_correct', true)
                .order('created_at', { ascending: false })
                .limit(100);

            // Build a map: question_id -> who solved it
            const followedQMap: Record<string, string[]> = {};
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const userNameMap = Object.fromEntries(
                (usersData?.users || []).map(u => [u.id, u.user_metadata?.fullName || u.user_metadata?.username || 'Someone'])
            );

            (followedAttempts || []).forEach((a: any) => {
                const id = String(a.question_id);
                if (!followedQMap[id]) followedQMap[id] = [];
                followedQMap[id].push(userNameMap[a.user_id] || 'Someone');
            });

            const followedQIds = Object.keys(followedQMap)
                .filter(id => !userAttempted.has(id))
                .slice(0, layer6Count);

            if (followedQIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from('questions')
                    .select('*')
                    .in('id', followedQIds)
                    .limit(layer6Count);

                (data || []).forEach((r: any) => {
                    const solvers = followedQMap[String(r.id)] || [];
                    const label = solvers.length === 1
                        ? `👤 ${solvers[0]} just solved this`
                        : `👥 ${solvers[0]} +${solvers.length - 1} you follow solved this`;
                    pool.push({ ...r, _layer: 6, _label: label, _score: 98 });
                });
            }
        }

        // ── Fallback: if pool is too small, pad with general questions ─────
        if (pool.length < 10) {
            const { data } = await baseQ()
                .order('created_at', { ascending: false })
                .limit(limit - pool.length);
            (data || []).forEach((r: any) => {
                if (!pool.find(p => String(p.id) === String(r.id))) {
                    pool.push({ ...r, _layer: 0, _label: '📚 From the Library', _score: 50 });
                }
            });
        }

        // ── Remove duplicates ──────────────────────────────────────────────
        const seen = new Set<string>();
        pool = pool.filter(r => {
            if (seen.has(String(r.id))) return false;
            seen.add(String(r.id));
            return true;
        });

        // ── Sort: by _score descending, then shuffle within same score ─────
        pool.sort((a, b) => b._score - a._score);
        // Light shuffle within groups of same layer to avoid rigid ordering
        pool = shuffleWithinGroups(pool);

        // ── Enrich with user info + attempt stats ─────────────────────────
        const qIds = pool.map(r => String(r.id));
        const creatorIds = [...new Set(pool.map(r => r.created_by).filter(Boolean))] as string[];

        const userInfoMap: Record<string, any> = {};
        await Promise.all(creatorIds.map(async id => {
            try {
                const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
                const meta = (u as any)?.user_metadata ?? (u as any)?.user?.user_metadata ?? {};
                userInfoMap[id] = {
                    name: meta?.fullName || meta?.full_name || meta?.name || 'Teacher',
                    avatar: meta?.avatar_url || meta?.avatar || null,
                    username: meta?.username || null,
                };
            } catch { userInfoMap[id] = { name: 'Teacher', avatar: null, username: null }; }
        }));

        const attemptsMap: Record<string, { total: number; solved: number }> = {};
        if (qIds.length > 0) {
            const { data: allAttempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, is_correct')
                .in('question_id', qIds);
            (allAttempts || []).forEach((a: any) => {
                const id = String(a.question_id);
                if (!attemptsMap[id]) attemptsMap[id] = { total: 0, solved: 0 };
                attemptsMap[id].total++;
                if (a.is_correct) attemptsMap[id].solved++;
            });
        }

        const questions = pool
            .slice(0, limit)
            .map(r => normalizeQuestion(r, userInfoMap, attemptsMap, userAttempted, userFailed, r._label || ''));

        return NextResponse.json({ questions, meta: { total: questions.length, userId, userGrade, userSchool: userSchoolName, followingCount: followingIds.length } });
    } catch (err: any) {
        console.error('[feed]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fisher-Yates shuffle within groups sharing the same _layer value
// ─────────────────────────────────────────────────────────────────────────────
function shuffleWithinGroups(arr: any[]): any[] {
    const groups: Record<number, any[]> = {};
    arr.forEach(item => {
        if (!groups[item._layer]) groups[item._layer] = [];
        groups[item._layer].push(item);
    });

    Object.values(groups).forEach(group => {
        for (let i = group.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [group[i], group[j]] = [group[j], group[i]];
        }
    });

    // Interleave groups so feed doesn't cluster all of one type
    const result: any[] = [];
    const layerOrder = [6, 1, 2, 3, 4, 5, 0]; // Priority order for interleaving
    let hasMore = true;
    while (hasMore) {
        hasMore = false;
        for (const layer of layerOrder) {
            const g = groups[layer];
            if (g && g.length > 0) {
                result.push(g.shift());
                if (g.length > 0) hasMore = true;
            }
        }
    }
    return result;
}
