import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getProfilesMap } from '@/lib/profiles';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: verify user token using anon-key client (same as /api/questions)
// The service-role admin client cannot verify USER tokens — must use anon key
// ─────────────────────────────────────────────────────────────────────────────
async function getVerifiedUser(bearer?: string | null) {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch { return null; }
}

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
        _feedLabel: feedLabel,
        _feedScore: 0, 
    };
}

function normalizePost(p: any, profilesMap: Map<string, any>, currentUserId: string | null) {
    const profile = profilesMap.get(p.author_id);
    return {
        id: p.id,
        type: 'post',
        content: p.content,
        image_url: p.image_url,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        created_at: p.created_at,
        is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
        author: {
            id: p.author_id,
            name: profile?.full_name || 'Student',
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            school: profile?.school || null,
            isTeacher: profile?.is_teacher || false,
        },
        _feedLabel: '📣 Community Update',
        _feedScore: 75,
        _layer: 7
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: apply subject filter uniformly across all query types
// ─────────────────────────────────────────────────────────────────────────────
function applySubjectFilter(query: any, subject: string) {
    if (!subject) return query;
    // Support "Maths" or "Mathematics" interchangeably with fuzzy matching
    if (subject.toLowerCase().startsWith('math')) {
        return query.ilike('subject', '%math%');
    }
    return query.eq('subject', subject);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feed
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);
        const userId = currentUser?.id ?? null;
        const subject = req.nextUrl.searchParams.get('subject') || '';
        const targetClass = req.nextUrl.searchParams.get('class') || null;
        const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '30'), 60);

        // ── Get user profile ─────────────────────────────────────────────────────────
        let userGrade: string | null = targetClass || null;
        let userSchoolName: string | null = null;
        let followingIds: string[] = [];

        if (userId && currentUser) {
            try {
                const { data: freshUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                const freshMeta = freshUser?.user?.user_metadata ?? currentUser.user_metadata ?? {};
                if (!targetClass) userGrade = freshMeta?.classGrade?.toString() || null;
                userSchoolName = freshMeta?.school || null;
            } catch {
                if (!targetClass) userGrade = currentUser.user_metadata?.classGrade?.toString() || null;
                userSchoolName = currentUser.user_metadata?.school || null;
            }

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
            return applySubjectFilter(q, subject);
        };

        // LAYER 8 (New Questions Booster): Always show newest unseen
        const { data: recentQ } = await baseQ()
            .order('created_at', { ascending: false })
            .limit(10);
        
        (recentQ || []).forEach((r: any) => {
            if (!userAttempted.has(String(r.id))) {
                pool.push({ ...r, _layer: 8, _label: '✨ Just Added', _score: 120 });
            }
        });

        // LAYER 1 (~30%): Questions at user's grade
        const layer1Count = Math.ceil(limit * 0.30);
        if (userGrade) {
            const { data } = await baseQ()
                .eq('class_grade', userGrade)
                .order('created_at', { ascending: false })
                .limit(layer1Count);
            (data || []).forEach((r: any) => pool.push({ ...r, _layer: 1, _label: '✨ For You', _score: 100 }));
        } else {
            const { data } = await baseQ().order('created_at', { ascending: false }).limit(layer1Count);
            (data || []).forEach((r: any) => pool.push({ ...r, _layer: 1, _label: '✨ Fresh Questions', _score: 100 }));
        }

        // LAYER 2 (max 1): Questions user already attempted
        if (userAttempted.size > 0) {
            const layer2Count = 1; 
            const failedArr = Array.from(userFailed).slice(0, 5);
            const attemptedArr = Array.from(userAttempted).slice(0, 10);
            const pickArr = failedArr.length > 0 ? failedArr : attemptedArr;
            
            let query = supabaseAdmin.from('questions').select('*').in('id', pickArr);
            query = applySubjectFilter(query, subject);
            
            const { data } = await query.limit(layer2Count);
            (data || []).forEach((r: any) => {
                const label = userFailed.has(String(r.id)) ? '🔄 You Got This Wrong — Review' : '✅ Already Solved';
                pool.push({ ...r, _layer: 2, _label: label, _score: 60 });
            });
        }

        // LAYER 3 (~20%): What school peers solved recently
        if (userSchoolName && userId) {
            const layer3Count = Math.ceil(limit * 0.20);
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const schoolmateIds = (usersData?.users || [])
                .filter(u => u.user_metadata?.school === userSchoolName && u.id !== userId)
                .map(u => u.id);

            if (schoolmateIds.length > 0) {
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
                    let query = supabaseAdmin.from('questions').select('*').in('id', peerQIds);
                    query = applySubjectFilter(query, subject);
                    const { data } = await query;
                    (data || []).forEach((r: any) => pool.push({ ...r, _layer: 3, _label: '🏫 Trending at Your School', _score: 90 }));
                }
            }
        }

        // LAYER 4 (~10%): Hardest trending questions
        const layer4Count = Math.ceil(limit * 0.10);
        if (userGrade) {
            const { data: allAttempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, is_correct');

            const statsMap: Record<string, { total: number; correct: number }> = {};
            (allAttempts || []).forEach((a: any) => {
                const id = String(a.question_id);
                if (!statsMap[id]) statsMap[id] = { total: 0, correct: 0 };
                statsMap[id].total++;
                if (a.is_correct) statsMap[id].correct++;
            });

            const trendingHard = Object.entries(statsMap)
                .filter(([, s]) => s.total >= 5 && s.correct / s.total < 0.4)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([id]) => id)
                .filter(id => !userAttempted.has(id))
                .slice(0, layer4Count * 3);

            if (trendingHard.length > 0) {
                let query = supabaseAdmin.from('questions').select('*').in('id', trendingHard).eq('class_grade', userGrade);
                query = applySubjectFilter(query, subject);
                const { data } = await query.limit(layer4Count);
                (data || []).forEach((r: any) => pool.push({ ...r, _layer: 4, _label: '🔥 Everyone\'s Struggling With This', _score: 85 }));
            }
        }

        // LAYER 5 (~10%): One level up — stretch questions
        const layer5Count = Math.ceil(limit * 0.10);
        if (userGrade) {
            const nextGrade = String(Number(userGrade) + 1);
            const { data } = await baseQ()
                .eq('class_grade', nextGrade)
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
                let query = supabaseAdmin.from('questions').select('*').in('id', followedQIds);
                query = applySubjectFilter(query, subject);
                const { data } = await query.limit(layer6Count);

                (data || []).forEach((r: any) => {
                    const solvers = followedQMap[String(r.id)] || [];
                    const label = solvers.length === 1
                        ? `👤 ${solvers[0]} just solved this`
                        : `👥 ${solvers[0]} +${solvers.length - 1} you follow solved this`;
                    pool.push({ ...r, _layer: 6, _label: label, _score: 98 });
                });
            }
        }

        // LAYER 7 (Community Posts): ONLY if no subject filter is active
        if (!subject) {
            let postPool: any[] = [];
            const { data: rawPosts } = await supabaseAdmin
                .from('posts')
                .select('*, post_likes(user_id)')
                .order('created_at', { ascending: false })
                .limit(30);

            if (rawPosts && rawPosts.length > 0) {
                const postAuthorIds = [...new Set(rawPosts.map(p => p.author_id))];
                const profilesMap = await getProfilesMap(postAuthorIds);
                
                rawPosts.forEach(p => {
                    const isFollowed = followingIds.includes(p.author_id);
                    const isSchoolmate = userSchoolName && profilesMap.get(p.author_id)?.school === userSchoolName;
                    
                    if (isFollowed || isSchoolmate || (p.likes_count || 0) > 5) {
                        const norm = normalizePost(p, profilesMap, userId);
                        if (isFollowed) { 
                            norm._feedLabel = '👤 Post from Peer You Follow'; 
                            norm._feedScore = 95; 
                        } else if (isSchoolmate) { 
                            norm._feedLabel = '🏫 Trending at Your School'; 
                            norm._feedScore = 85; 
                        }
                        postPool.push(norm);
                    }
                });
            }
            pool.push(...postPool);
        }

        // ── Fallback ─────
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

        // ── Deduplicate ──
        const seen = new Set<string>();
        pool = pool.filter(r => {
            if (seen.has(String(r.id))) return false;
            seen.add(String(r.id));
            return true;
        });

        // ── Sort & Shuffle ──
        pool.sort((a, b) => b._score - a._score);
        pool = shuffleWithinGroups(pool);

        // ── Enrich ──
        const qIds = pool.map(r => String(r.id));
        const creatorIds = [...new Set(pool.filter(r => r.type !== 'post').map(r => r.created_by).filter(Boolean))] as string[];

        const profilesMap = await getProfilesMap(creatorIds);
        const userInfoMap: Record<string, any> = {};
        for (const id of creatorIds) {
            const p = profilesMap.get(id);
            userInfoMap[id] = {
                name: p?.full_name || 'Teacher',
                avatar: p?.avatar_url || null,
                username: p?.username || null
            };
        }

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
            .map(r => {
                if (r.type === 'post') return r;
                return { 
                    ...normalizeQuestion(r, userInfoMap, attemptsMap, userAttempted, userFailed, r._label || ''),
                    type: 'question'
                };
            });

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

    const result: any[] = [];
    const layerOrder = [8, 6, 1, 7, 2, 3, 4, 5, 0];
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
