import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getProfilesMap } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function getVerifiedUser(bearer?: string | null) {
    try {
        if (!bearer) return null;
        const token = bearer.replace(/^Bearer\s+/i, '');
        // Re-use supabaseAdmin — avoids creating a new client per request
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch { return null; }
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
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
        chapter: r.chapter || null,
        classGrade: r.class_grade,
        points: r.points,
        timeLimit: r.time_limit,
        difficulty: r.difficulty || null,
        options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options || null,
        correctOption: typeof r.correct_option === 'number' ? r.correct_option : null,
        questionType: r.question_type || 'mcq',
        matchPairs: typeof r.match_pairs === 'string' ? JSON.parse(r.match_pairs) : r.match_pairs || null,
        totalAttempts: attemptsMap[String(r.id)]?.total || 0,
        solvedCount: attemptsMap[String(r.id)]?.solved || 0,
        hasAttempted: userAttempted.has(String(r.id)),
        hasFailed: userFailed.has(String(r.id)),
        imagePath: r.image_path || null,
        imageUrl: r.image_url || null,
        is_vip: r.is_vip === true,
        createdAt: r.created_at,
        _feedLabel: feedLabel,
        _feedScore: 0,
    };
}

function normalizePost(p: any, profilesMap: Map<string, any>, currentUserId: string | null) {
    const profile = profilesMap.get(p.author_id);
    let finalContent = p.content || '';
    let isPinned = false;
    const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);
    if (finalContent.startsWith('[PINNED]')) { isPinned = true; finalContent = finalContent.substring(8).trim(); }
    return {
        id: p.id, type: 'post', content: finalContent, image_url: p.image_url,
        video_url: p.video_url, video_thumbnail: p.video_thumbnail,
        likes_count: likesCount, comments_count: p.comments_count || 0,
        created_at: p.created_at, is_pinned: isPinned,
        is_liked_by_me: currentUserId ? (p.post_likes || []).some((l: any) => l.user_id === currentUserId) : false,
        author: {
            id: p.author_id,
            name: profile?.full_name || 'Student',
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            school: profile?.school || null,
            isTeacher: profile?.is_teacher || false,
            totalPoints: Number(profile?.total_points) || 0,
        },
        _feedLabel: isPinned ? '📌 Pinned by Admin' : '📣 Community Update',
        _feedScore: isPinned ? 200 : 75,
        _layer: isPinned ? 10 : 7
    };
}

function calculatePostScore(post: any, followingIds: string[], userSchool: string | null, userGrade: string | null): number {
    if (post.is_pinned) return 1_000_000;
    let score = 100;
    const ageHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    score = score / Math.pow(ageHours + 2, 1.2);
    score += (post.likes_count || 0) * 10;
    score += (post.comments_count || 0) * 25;
    if (followingIds.includes(post.author.id)) score *= 2.5;
    if (userSchool && post.author.school === userSchool) score += 50;
    if (userGrade && post.author.grade === userGrade) score += 30;
    score += Math.floor((post.author.totalPoints || 0) / 100);
    return score;
}

function applyCommonFilters(query: any, subject: string, difficulty: string, chapter: string = '') {
    let q = query;
    if (subject) {
        const sLower = subject.toLowerCase();
        if (sLower.startsWith('math') || sLower === 'maths') {
            q = q.ilike('subject', '%math%');
        } else if (sLower === 'sst' || sLower === 'social studies' || sLower === 'social science') {
            q = q.or('subject.ilike.%SST%,subject.ilike.%social%,subject.ilike.%history%,subject.ilike.%geography%,subject.ilike.%civics%');
        } else {
            q = q.eq('subject', subject);
        }
    }
    if (difficulty) {
        const d = difficulty.toLowerCase();
        if (d === 'moderate' || d === 'medium') {
            q = q.in('difficulty', ['moderate', 'medium', 'Moderate', 'Medium']);
        } else {
            q = q.eq('difficulty', difficulty);
        }
    }
    if (chapter) q = q.ilike('chapter', `%${chapter}%`);
    return q;
}

function shuffle(arr: any[]) { return arr.sort(() => 0.5 - Math.random()); }

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
    const layerOrder = [10, 8, 6, 1, 7, 2, 3, 4, 5, 0];
    let hasMore = true;
    while (hasMore) {
        hasMore = false;
        for (const layer of layerOrder) {
            const g = groups[layer];
            if (g && g.length > 0) { result.push(g.shift()); if (g.length > 0) hasMore = true; }
        }
    }
    return result;
}

// ─── GET /api/feed ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const currentUser = await getVerifiedUser(authHeader);
        const userId = currentUser?.id ?? null;
        const subject = req.nextUrl.searchParams.get('subject') || '';
        const difficulty = req.nextUrl.searchParams.get('difficulty') || '';
        const chapter = req.nextUrl.searchParams.get('chapter') || '';
        const targetClass = req.nextUrl.searchParams.get('class') || null;
        const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '30'), 60);

        const now = new Date();
        const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
        const CORE_SUBJECTS = ['Mathematics', 'Science', 'English', 'SST', 'English Literature', 'G.K', 'Hindi'];

        // ── Step 1: User context — ALL in parallel ────────────────────────
        let userGrade: string | null = targetClass || null;
        let userSchoolName: string | null = null;
        let followingIds: string[] = [];
        const userAttempted = new Set<string>();
        const userFailed = new Set<string>();
        let recentFailedSubject: string | null = null;

        if (userId && currentUser) {
            if (!targetClass) {
                userGrade = currentUser.user_metadata?.classGrade?.toString()
                    || currentUser.user_metadata?.grade?.toString()
                    || null;
            }

            // Fetch profile, follows, and last 300 attempts in parallel
            const [profileResult, followsResult, attemptsResult] = await Promise.all([
                supabaseAdmin.from('profiles').select('school').eq('id', userId).maybeSingle(),
                supabaseAdmin.from('follows').select('following_id').eq('follower_id', userId),
                supabaseAdmin.from('question_attempts')
                    .select('question_id, is_correct')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(300),
            ]);

            userSchoolName = profileResult.data?.school || currentUser.user_metadata?.school || null;
            followingIds = (followsResult.data || []).map((f: any) => f.following_id);

            const attempts = attemptsResult.data || [];
            let lastFailId: string | null = null;
            for (const a of attempts) {
                userAttempted.add(String(a.question_id));
                if (!a.is_correct) {
                    userFailed.add(String(a.question_id));
                    if (!lastFailId && attempts.indexOf(a) < 3) lastFailId = String(a.question_id);
                }
            }

            // Fetch written submissions and failed subject in parallel (no serial waits)
            const parallelTasks: Promise<any>[] = [
                supabaseAdmin.from('written_submissions').select('question_id').eq('student_id', userId)
            ];
            if (lastFailId && !subject) {
                parallelTasks.push(
                    supabaseAdmin.from('questions').select('subject').eq('id', lastFailId).maybeSingle()
                );
            }
            const [writtenResult, failedQResult] = await Promise.all(parallelTasks);
            (writtenResult?.data || []).forEach((w: any) => userAttempted.add(String(w.question_id)));
            if (failedQResult?.data?.subject) recentFailedSubject = failedQResult.data.subject;
        }

        // ── Step 2: Stratified question fetch — ALL subjects in parallel ──────
        const baseQ = () => {
            let q = supabaseAdmin.from('questions').select('*');
            return applyCommonFilters(q, subject, difficulty, chapter);
        };

        async function fetchSubjectTimeBuckets(subjectToFetch: string, gradeToFetch: string | null) {
            const applyFilter = (q: any) => {
                let query = applyCommonFilters(q, subjectToFetch, difficulty, chapter);
                if (gradeToFetch) query = query.in('class_grade', [String(gradeToFetch), 'All', 'Any']);
                return query;
            };
            const [resA, resB, resC] = await Promise.all([
                applyFilter(supabaseAdmin.from('questions').select('*')).gte('created_at', daysAgo(3)).order('created_at', { ascending: false }).limit(20),
                applyFilter(supabaseAdmin.from('questions').select('*')).lt('created_at', daysAgo(3)).gte('created_at', daysAgo(14)).order('created_at', { ascending: false }).limit(25),
                applyFilter(supabaseAdmin.from('questions').select('*')).lt('created_at', daysAgo(14)).order('created_at', { ascending: false }).limit(20),
            ]);
            return {
                subject: subjectToFetch,
                A: shuffle(resA.data || []),
                B: shuffle(resB.data || []),
                C: shuffle(resC.data || []),
            };
        }

        // ── Step 3: Launch ALL heavy queries in ONE parallel batch ─────────────
        const bucketsFetch = subject
            ? fetchSubjectTimeBuckets(subject, userGrade)
            : Promise.all(CORE_SUBJECTS.map(sub => fetchSubjectTimeBuckets(sub, userGrade)));

        // Layer 3: Schoolmates (only if school known)
        const schoolmatesFetch = (userSchoolName && userId)
            ? supabaseAdmin.from('profiles').select('id').eq('school', userSchoolName).neq('id', userId).limit(100)
            : Promise.resolve(null);

        // Layer 6: Following attempts — use profiles table ONLY (never listUsers!)
        const followingAttemptsFetch = (followingIds.length > 0 && userId)
            ? Promise.all([
                supabaseAdmin.from('question_attempts')
                    .select('question_id, user_id')
                    .in('user_id', followingIds)
                    .eq('is_correct', true)
                    .order('created_at', { ascending: false })
                    .limit(80),
                supabaseAdmin.from('profiles')
                    .select('id, full_name, username')
                    .in('id', followingIds)
            ])
            : Promise.resolve(null);

        // Layer 4: Hard questions stats (reduced from 2000 to 500)
        const hardStatsFetch = userGrade
            ? supabaseAdmin.from('question_attempts')
                .select('question_id, is_correct')
                .limit(500)
            : Promise.resolve(null);

        // Layer 7: Posts
        const postsFetch = !subject
            ? Promise.all([
                supabaseAdmin.from('posts').select('*, post_likes(user_id)')
                    .ilike('content', '[PINNED]%')
                    .gte('created_at', daysAgo(14))
                    .order('created_at', { ascending: false })
                    .limit(2),
                supabaseAdmin.from('posts').select('*, post_likes(user_id)')
                    .gte('created_at', daysAgo(30))
                    .order('created_at', { ascending: false })
                    .limit(60),
            ])
            : Promise.resolve(null);

        // Layer 2: SRS review IDs (prefetch missed questions so Layer 2 needs no serial await)
        const failedArr = userFailed.size > 0 ? shuffle(Array.from(userFailed)).slice(0, 2) : [];
        const srsReviewFetch = failedArr.length > 0
            ? supabaseAdmin.from('questions').select('*').in('id', failedArr)
            : Promise.resolve(null);

        // Layer 5: Stretch questions (one grade up) — also prefetch
        const nextGrade = userGrade ? String(Number(userGrade) + 1) : null;
        const stretchFetch = nextGrade
            ? baseQ().eq('class_grade', nextGrade).order('created_at', { ascending: false }).limit(Math.ceil(limit * 0.10) * 2)
            : Promise.resolve(null);

        // Wait for EVERYTHING at once — single await point
        const [bucketsRaw, schoolmatesRes, followingRaw, hardStatsRes, postsRaw, srsRes, stretchRes] = await Promise.all([
            bucketsFetch,
            schoolmatesFetch,
            followingAttemptsFetch,
            hardStatsFetch,
            postsFetch,
            srsReviewFetch,
            stretchFetch,
        ]);

        const bucketsData = subject
            ? [bucketsRaw as any]
            : (bucketsRaw as any[]);

        if (recentFailedSubject) {
            const b = bucketsData.find((bData: any) => bData.subject === recentFailedSubject);
            if (b) b.isWeakness = true;
        }

        // ── Step 4: Build the pool from fetched data — NO more serial awaits ──
        let pool: any[] = [];
        const overFetch = subject ? 1 : 1.5;

        // Layer 8 — New questions booster
        const layer8Count = Math.ceil(limit * 0.10 * overFetch);
        let layer8AddedCount = 0;
        let runningL8 = true;
        while (runningL8 && layer8AddedCount < layer8Count) {
            let addedInRound = false;
            for (const bData of bucketsData) {
                if (layer8AddedCount >= layer8Count) break;
                const qIdx = bData.A.findIndex((q: any) => !userAttempted.has(String(q.id)) && !pool.some((p: any) => p.id === q.id));
                if (qIdx !== -1) {
                    const q = bData.A.splice(qIdx, 1)[0];
                    pool.push({ ...q, _layer: 8, _label: bData.isWeakness ? '🎯 Target Weakness' : '✨ Just Added', _score: 120 });
                    layer8AddedCount++; addedInRound = true;
                }
            }
            if (!addedInRound) runningL8 = false;
        }

        // Layer 1 — Core feed
        const layer1Count = Math.ceil(limit * 0.35 * overFetch);
        let layer1AddedCount = 0;
        let runningL1 = true;
        while (runningL1 && layer1AddedCount < layer1Count) {
            let addedInRound = false;
            for (const bData of bucketsData) {
                if (layer1AddedCount >= layer1Count) break;
                const combined = [...bData.A, ...bData.B, ...bData.C];
                const qIdx = combined.findIndex((q: any) => !userAttempted.has(String(q.id)) && !pool.some((p: any) => p.id === q.id));
                if (qIdx !== -1) {
                    const q = combined[qIdx];
                    if (bData.A.includes(q)) bData.A.splice(bData.A.indexOf(q), 1);
                    else if (bData.B.includes(q)) bData.B.splice(bData.B.indexOf(q), 1);
                    else if (bData.C.includes(q)) bData.C.splice(bData.C.indexOf(q), 1);
                    pool.push({ ...q, _layer: 1, _label: bData.isWeakness ? '🎯 Target Weakness' : '✨ For You', _score: 100 });
                    layer1AddedCount++; addedInRound = true;
                }
            }
            if (!addedInRound) runningL1 = false;
        }

        // Layer 2 — SRS review (data already pre-fetched in parallel above)
        if (srsRes && (srsRes as any).data?.length > 0) {
            shuffle((srsRes as any).data).forEach((r: any) => {
                pool.push({ ...r, _layer: 2, _label: '🔄 Review: You missed this', _score: 95 });
            });
        }

        // Layer 3 — Schoolmate trending
        // We have schoolmatesRes already. We now need their attempts — but this is
        // a secondary query. We fire it as part of a small parallel batch with layer 4 & 5.
        // Layer 4 hard-trending and layer 5 stretch also need secondary queries.
        // Build up all secondary queries and fire them together.
        const layer3SecondaryFetch = (schoolmatesRes && (schoolmatesRes as any).data?.length > 0)
            ? (() => {
                const schoolmateIds = ((schoolmatesRes as any).data || []).map((u: any) => u.id);
                return supabaseAdmin.from('question_attempts')
                    .select('question_id')
                    .in('user_id', schoolmateIds)
                    .eq('is_correct', true)
                    .order('created_at', { ascending: false })
                    .limit(40);
            })()
            : Promise.resolve(null);

        // Layer 4 secondary — fetch actual hard questions from the stats
        let trendingHardIds: string[] = [];
        if (hardStatsRes && (hardStatsRes as any).data) {
            const allAttempts = (hardStatsRes as any).data || [];
            const statsMap: Record<string, { total: number; correct: number }> = {};
            allAttempts.forEach((a: any) => {
                const id = String(a.question_id);
                if (!statsMap[id]) statsMap[id] = { total: 0, correct: 0 };
                statsMap[id].total++;
                if (a.is_correct) statsMap[id].correct++;
            });
            trendingHardIds = Object.entries(statsMap)
                .filter(([, s]) => s.total >= 5 && s.correct / s.total < 0.4)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([id]) => id)
                .filter(id => !userAttempted.has(id))
                .slice(0, Math.ceil(limit * 0.10) * 3);
        }

        const layer4SecondaryFetch = (trendingHardIds.length > 0 && userGrade)
            ? (() => {
                let query = supabaseAdmin.from('questions').select('*').in('id', trendingHardIds).eq('class_grade', userGrade);
                query = applyCommonFilters(query, subject, difficulty, chapter);
                return query.limit(Math.ceil(limit * 0.10));
            })()
            : Promise.resolve(null);

        // Layer 3 & 4 secondary queries fire in parallel
        const [layer3AttemptsRes, layer4DataRes] = await Promise.all([
            layer3SecondaryFetch,
            layer4SecondaryFetch,
        ]);

        // Layer 3 — process results (need one more query for question details by IDs)
        if (layer3AttemptsRes && (layer3AttemptsRes as any).data) {
            const peerQIds = [...new Set(((layer3AttemptsRes as any).data || []).map((a: any) => String(a.question_id)))]
                .filter(id => !userAttempted.has(id))
                .slice(0, Math.ceil(limit * 0.15));

            if (peerQIds.length > 0) {
                let query = applyCommonFilters(supabaseAdmin.from('questions').select('*'), subject, difficulty, chapter);
                const { data } = await query.in('id', peerQIds);
                (data || []).forEach((r: any) => pool.push({ ...r, _layer: 3, _label: '🏫 Trending at Your School', _score: 90 }));
            }
        }

        // Layer 4 — Hard trending (data from parallel fetch)
        if (layer4DataRes && (layer4DataRes as any).data) {
            ((layer4DataRes as any).data || []).forEach((r: any) =>
                pool.push({ ...r, _layer: 4, _label: '🔥 Everyone\'s Struggling With This', _score: 85 })
            );
        }

        // Layer 5 — Stretch questions (data already pre-fetched)
        if (stretchRes && (stretchRes as any).data) {
            shuffle((stretchRes as any).data).slice(0, Math.ceil(limit * 0.10)).forEach((r: any) =>
                pool.push({ ...r, _layer: 5, _label: '🚀 Stretch: Class ' + nextGrade, _score: 80 })
            );
        }

        // Layer 9 — VIP Daily Challenges (max 5 per user per day, not already attempted)
        if (!subject) {
            let vipQuery = supabaseAdmin.from('questions').select('*').eq('is_vip', true).order('created_at', { ascending: false }).limit(20);
            if (userGrade) vipQuery = vipQuery.in('class_grade', [String(userGrade), 'All', 'Any']);
            const { data: vipData } = await vipQuery;
            const vipItems = shuffle(vipData || []).filter((r: any) => !userAttempted.has(String(r.id))).slice(0, 5);
            vipItems.forEach((r: any) => pool.push({ ...r, _layer: 9, _label: '👑 VIP Daily Challenge', _score: 150, is_vip: true }));
        }

        // Layer 6 — Following solved (NO listUsers call — profiles table only)
        if (followingRaw && followingIds.length > 0) {
            const [followedAttemptsRes, followerProfilesRes] = followingRaw as any[];
            const followerProfiles = followerProfilesRes?.data || [];
            const nameMap = Object.fromEntries(
                followerProfiles.map((p: any) => [p.id, p.full_name || p.username || 'A friend'])
            );

            const followedQMap: Record<string, string[]> = {};
            (followedAttemptsRes?.data || []).forEach((a: any) => {
                const id = String(a.question_id);
                if (!followedQMap[id]) followedQMap[id] = [];
                followedQMap[id].push(nameMap[a.user_id] || 'A friend');
            });

            const followedQIds = Object.keys(followedQMap)
                .filter(id => !userAttempted.has(id))
                .slice(0, Math.ceil(limit * 0.20));

            if (followedQIds.length > 0) {
                let query = applyCommonFilters(supabaseAdmin.from('questions').select('*'), subject, difficulty, chapter);
                const { data } = await query.in('id', followedQIds).limit(Math.ceil(limit * 0.20));
                (data || []).forEach((r: any) => {
                    const solvers = followedQMap[String(r.id)] || [];
                    const label = solvers.length === 1
                        ? `👤 ${solvers[0]} just solved this`
                        : `👥 ${solvers[0]} +${solvers.length - 1} you follow solved this`;
                    pool.push({ ...r, _layer: 6, _label: label, _score: 98 });
                });
            }
        }

        // Layer 7 — Posts (data already fetched in parallel)
        if (postsRaw) {
            const [pinnedRes, recentRes] = postsRaw as any[];
            const allRawPosts = [...(pinnedRes?.data || []), ...(recentRes?.data || [])];
            const uniqueRawPosts = Array.from(new Map(allRawPosts.map(item => [item.id, item])).values());

            if (uniqueRawPosts.length > 0) {
                const postAuthorIds = [...new Set(uniqueRawPosts.map((p: any) => p.author_id))];
                const postProfilesMap = await getProfilesMap(postAuthorIds as string[]);

                const scoredPosts = uniqueRawPosts.map(p => {
                    const norm = normalizePost(p, postProfilesMap, userId);
                    (norm as any)._postScore = calculatePostScore(norm, followingIds, userSchoolName, userGrade);
                    return norm;
                });
                scoredPosts.sort((a: any, b: any) => b._postScore - a._postScore);

                const bucketA: any[] = [], bucketB: any[] = [], bucketC: any[] = [];
                const authorSlots: Record<string, number> = {};

                for (const post of scoredPosts) {
                    const authorId = post.author.id;
                    if (authorId !== userId) {
                        const slots = authorSlots[authorId] || 0;
                        if (slots >= 2) continue;
                        authorSlots[authorId] = slots + 1;
                    }
                    const isFollowed = followingIds.includes(authorId);
                    const isSchoolmate = userSchoolName && post.author.school === userSchoolName;

                    if ((post as any).is_pinned) {
                        pool.push(post);
                    } else if (isFollowed || isSchoolmate) {
                        post._feedLabel = isFollowed ? '👤 Post from Peer You Follow' : '🏫 Trending at Your School';
                        post._feedScore = isFollowed ? 95 : 85;
                        bucketA.push(post);
                    } else if ((post as any)._postScore > 5) {
                        post._feedLabel = '🔥 Trending in Community';
                        post._feedScore = 78;
                        bucketB.push(post);
                    } else {
                        post._feedLabel = '💡 Discover Something New';
                        post._feedScore = 65;
                        bucketC.push(post);
                    }
                }

                const maxPosts = Math.min(25, scoredPosts.length);
                pool.push(...bucketA.slice(0, Math.ceil(maxPosts * 0.5)));
                pool.push(...bucketB.slice(0, Math.ceil(maxPosts * 0.3)));
                const soFar = bucketA.slice(0, Math.ceil(maxPosts * 0.5)).length + bucketB.slice(0, Math.ceil(maxPosts * 0.3)).length;
                pool.push(...bucketC.slice(0, Math.max(maxPosts - soFar, 0)));

                if (pool.filter(p => p.type === 'post').length < 5 && scoredPosts.length > 0) {
                    const inPool = new Set(pool.filter(p => p.type === 'post').map(p => p.id));
                    for (const post of scoredPosts) {
                        if (!inPool.has(post.id) && !(post as any).is_pinned) {
                            post._feedLabel = '💡 Community Post'; post._feedScore = 60; pool.push(post);
                        }
                    }
                }
            }
        }

        // Fallback
        if (pool.filter(p => p.type !== 'post').length < 8) {
            const { data } = await baseQ().order('created_at', { ascending: false }).limit(limit);
            (data || []).forEach((r: any) => {
                const id = String(r.id);
                if (!userAttempted.has(id) && !pool.find(p => String(p.id) === id))
                    pool.push({ ...r, _layer: 0, _label: '📚 From the Library', _score: 50 });
            });
        }

        // Deduplicate
        const seen = new Set<string>();
        pool = pool.filter(r => {
            if (seen.has(String(r.id))) return false;
            seen.add(String(r.id)); return true;
        });

        // Shuffle within layers and take limit
        let finalPool = shuffleWithinGroups(pool).slice(0, limit);

        // ── Step 5: Enrich with creator profiles + attempt counts ─────────────
        const qIds = finalPool.filter(r => r.type !== 'post').map(r => String(r.id));
        const creatorIds = [...new Set(finalPool.filter(r => r.type !== 'post').map(r => r.created_by).filter(Boolean))] as string[];

        // Both in parallel, with a reasonable row cap on attempts
        const [profilesMap, attemptsRowsRes] = await Promise.all([
            getProfilesMap(creatorIds),
            qIds.length > 0
                ? supabaseAdmin.from('question_attempts')
                    .select('question_id, is_correct')
                    .in('question_id', qIds)
                    .limit(2000)               // cap: enough for ~60 questions × reasonable attempts
                : Promise.resolve({ data: [] })
        ]);

        const userInfoMap: Record<string, any> = {};
        for (const id of creatorIds) {
            const p = profilesMap.get(id);
            userInfoMap[id] = { name: p?.full_name || 'Teacher', avatar: p?.avatar_url || null, username: p?.username || null };
        }

        const attemptsMap: Record<string, { total: number; solved: number }> = {};
        ((attemptsRowsRes as any).data || []).forEach((a: any) => {
            const id = String(a.question_id);
            if (!attemptsMap[id]) attemptsMap[id] = { total: 0, solved: 0 };
            attemptsMap[id].total++;
            if (a.is_correct) attemptsMap[id].solved++;
        });

        const questions = finalPool.map(r => {
            if (r.type === 'post') return r;
            return { ...normalizeQuestion(r, userInfoMap, attemptsMap, userAttempted, userFailed, r._label || ''), type: 'question' };
        });

        // ── Interleave VIP items at fixed positions (every 5th slot, max 5) ──
        const vipItems   = questions.filter(q => (q as any).is_vip);
        const nonVipItems = questions.filter(q => !(q as any).is_vip);
        const interleavedFeed: any[] = [];
        let vipIdx = 0;
        for (let i = 0; i < nonVipItems.length; i++) {
            // Insert a VIP card at positions 1, 6, 11, 16, 21 (0-indexed)
            if (vipIdx < vipItems.length && (i === 1 || (i > 1 && (i - 1) % 5 === 0))) {
                interleavedFeed.push(vipItems[vipIdx++]);
            }
            interleavedFeed.push(nonVipItems[i]);
        }
        // Append any remaining VIP items at the end (shouldn't happen with max 5)
        while (vipIdx < vipItems.length) interleavedFeed.push(vipItems[vipIdx++]);

        const response = NextResponse.json({
            questions: interleavedFeed,
            meta: { total: interleavedFeed.length, userId, userGrade, userSchool: userSchoolName, followingCount: followingIds.length }
        });
        // Cache on edge for 45 seconds per user (personalized)
        response.headers.set('Cache-Control', 'private, max-age=45, stale-while-revalidate=30');
        return response;

    } catch (err: any) {
        console.error('[feed]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
