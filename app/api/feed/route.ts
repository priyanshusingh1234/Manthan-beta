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
        chapter: r.chapter || null,
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
    let finalContent = p.content || '';
    let isPinned = false;
    const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);

    if (finalContent.startsWith('[PINNED]')) {
        isPinned = true;
        finalContent = finalContent.substring(8).trim();
    }

    return {
        id: p.id,
        type: 'post',
        content: finalContent,
        image_url: p.image_url,
        likes_count: likesCount,
        comments_count: p.comments_count || 0,
        created_at: p.created_at,
        is_pinned: isPinned,
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

// ─────────────────────────────────────────────────────────────────────────────
// Weighted Post Scorer
// Signals: recency decay, engagement, follow/school/grade proximity, authority
// ─────────────────────────────────────────────────────────────────────────────
function calculatePostScore(
    post: any,
    followingIds: string[],
    userSchool: string | null,
    userGrade: string | null
): number {
    // Absolute override: pinned posts always float to the top
    if (post.is_pinned) return 1_000_000;

    let score = 100; // Base score

    // 1. Recency decay — score decays exponentially with age
    const ageHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    score = score / Math.pow(ageHours + 2, 1.2);

    // 2. Engagement — comments signal deeper interest than likes
    score += (post.likes_count || 0) * 10;
    score += (post.comments_count || 0) * 25;

    // 3. Social graph boost — posts from people you follow are highest priority
    if (followingIds.includes(post.author.id)) score *= 2.5;

    // 4. Proximity boosts — schoolmates and grademates
    if (userSchool && post.author.school === userSchool) score += 50;
    if (userGrade && post.author.grade === userGrade) score += 30;

    // 5. Author authority — small bonus for high-ranking students
    score += Math.floor((post.author.totalPoints || 0) / 100);

    return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: apply subject filter uniformly across all query types
// ─────────────────────────────────────────────────────────────────────────────
function applyCommonFilters(query: any, subject: string, difficulty: string, chapter: string = '') {
    let q = query;
    if (subject) {
        const sLower = subject.toLowerCase();
        if (sLower.startsWith('math') || sLower === 'maths') {
            // Match 'Mathematics', 'Maths', 'Math', etc.
            q = q.ilike('subject', '%math%');
        } else if (sLower === 'sst' || sLower === 'social studies' || sLower === 'social science') {
            // Match 'SST', 'Social Studies', 'Social Science', etc.
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
    if (chapter) {
        q = q.ilike('chapter', `%${chapter}%`);
    }
    return q;
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
        const difficulty = req.nextUrl.searchParams.get('difficulty') || '';
        const chapter = req.nextUrl.searchParams.get('chapter') || '';
        const targetClass = req.nextUrl.searchParams.get('class') || null;
        const qLimit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '30'), 60);
        const qOffset = Number(req.nextUrl.searchParams.get('offset') || '0');
        const limit = qLimit + qOffset; // Expand internal horizon so stratifications can generate enough data to slice

        // ── Get user profile ─────────────────────────────────────────────────────────
        let userGrade: string | null = targetClass || null;
        let userSchoolName: string | null = null;
        let followingIds: string[] = [];

        if (userId && currentUser) {
            try {
                // Instantly fetch the minimal fields needed from the profiles table
                const { data: profile } = await supabaseAdmin.from('profiles').select('school').eq('id', userId).maybeSingle();
                if (!targetClass) userGrade = currentUser.user_metadata?.classGrade?.toString() || currentUser.user_metadata?.grade?.toString() || null;
                userSchoolName = profile?.school || currentUser.user_metadata?.school || null;
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
        let recentFailedSubject: string | null = null;

        if (userId) {
            const { data: attempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, is_correct, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            (attempts || []).forEach((a: any) => {
                userAttempted.add(String(a.question_id));
                if (!a.is_correct) userFailed.add(String(a.question_id));
            });

            // "Redemption Protocol": If user failed any of their last 3 questions, aggressively target that subject
            const recentAttempts = (attempts || []).slice(0, 3);
            const recentFail = recentAttempts.find((a: any) => !a.is_correct);
            if (recentFail && !subject) {
                const { data: qData } = await supabaseAdmin
                    .from('questions')
                    .select('subject')
                    .eq('id', recentFail.question_id)
                    .maybeSingle();
                if (qData && qData.subject) {
                    recentFailedSubject = qData.subject;
                }
            }

            const { data: written } = await supabaseAdmin
                .from('written_submissions')
                .select('question_id')
                .eq('student_id', userId);
            (written || []).forEach((w: any) => userAttempted.add(String(w.question_id)));
        }

        // ── Get question pools per layer ───────────────────────────────────
        let pool: any[] = [];
        // Over-fetch multiplier if no subject filter to allow for round-robin diversity
        const overFetch = subject ? 1 : 1.5;

        // Build a base query helper
        const baseQ = () => {
            let q = supabaseAdmin.from('questions').select('*');
            return applyCommonFilters(q, subject, difficulty, chapter);
        };

        const CORE_SUBJECTS = ['Mathematics', 'Science', 'English', 'SST', 'English Literature', 'G.K'];
        const now = new Date();
        const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
        const shuffle = (arr: any[]) => arr.sort(() => 0.5 - Math.random());

        // ── STRATIFIED TIME-BUCKETED FETCHING ──
        async function fetchSubjectTimeBuckets(subjectToFetch: string, gradeToFetch: string | null) {
            const applyFilter = (q: any) => {
                let query = q;
                query = applyCommonFilters(query, subjectToFetch, difficulty, chapter);
                if (gradeToFetch) {
                    query = query.in('class_grade', [String(gradeToFetch), 'All', 'Any']);
                }
                return query;
            };

            const [resA, resB, resC] = await Promise.all([
                applyFilter(supabaseAdmin.from('questions').select('*')).gte('created_at', daysAgo(3)).order('created_at', { ascending: false }).limit(20),
                applyFilter(supabaseAdmin.from('questions').select('*')).lt('created_at', daysAgo(3)).gte('created_at', daysAgo(14)).order('created_at', { ascending: false }).limit(30),
                applyFilter(supabaseAdmin.from('questions').select('*')).lt('created_at', daysAgo(14)).order('created_at', { ascending: false }).limit(30)
            ]);

            return {
                subject: subjectToFetch,
                A: shuffle(resA.data || []),
                B: shuffle(resB.data || []),
                C: shuffle(resC.data || [])
            };
        }

        let bucketsData: any[] = [];
        if (subject) {
            bucketsData = [await fetchSubjectTimeBuckets(subject, userGrade)];
        } else {
            bucketsData = await Promise.all(CORE_SUBJECTS.map(sub => fetchSubjectTimeBuckets(sub, userGrade)));

            if (recentFailedSubject) {
                // Redemption Protocol v2: Mark the failed subject to receive a 4x pull multiplier
                const b = bucketsData.find(bData => bData.subject === recentFailedSubject);
                if (b) b.isWeakness = true;
            }
        }

        // LAYER 8 (New Questions Booster): Pick equally from each subject's Bucket A
        const layer8Count = Math.ceil(limit * 0.10 * overFetch);
        let layer8AddedCount = 0;
        let runningL8 = true;

        while (runningL8 && layer8AddedCount < layer8Count) {
            let addedInRound = false;
            for (const bData of bucketsData) {
                if (layer8AddedCount >= layer8Count) break;

                if (layer8AddedCount >= layer8Count) break;
                // find the first unseen in A
                const qIdx = bData.A.findIndex((q: any) => !userAttempted.has(String(q.id)) && !pool.some((p: any) => p.id === q.id));
                if (qIdx !== -1) {
                    const q = bData.A.splice(qIdx, 1)[0];
                    pool.push({ ...q, _layer: 8, _label: bData.isWeakness ? '🎯 Target Weakness' : '✨ Just Added', _score: 120 });
                    layer8AddedCount++;
                    addedInRound = true;
                }
            }
            if (!addedInRound) runningL8 = false;
        }

        // LAYER 1 (~30%): Core Feed - Pick an equal mix of A, B, C from each subject
        const layer1Count = Math.ceil(limit * 0.35 * overFetch); // Handled dynamic mix
        let layer1AddedCount = 0;
        let runningL1 = true;

        while (runningL1 && layer1AddedCount < layer1Count) {
            let addedInRound = false;
            for (const bData of bucketsData) {
                if (layer1AddedCount >= layer1Count) break;

                if (layer1AddedCount >= layer1Count) break;
                // Combine remaining A, B, C for this subject
                const combined = [...bData.A, ...bData.B, ...bData.C];
                const qIdx = combined.findIndex((q: any) => !userAttempted.has(String(q.id)) && !pool.some((p: any) => p.id === q.id));

                if (qIdx !== -1) {
                    const q = combined[qIdx];
                    // Remove from original array
                    if (bData.A.includes(q)) bData.A.splice(bData.A.indexOf(q), 1);
                    else if (bData.B.includes(q)) bData.B.splice(bData.B.indexOf(q), 1);
                    else if (bData.C.includes(q)) bData.C.splice(bData.C.indexOf(q), 1);

                    pool.push({ ...q, _layer: 1, _label: bData.isWeakness ? '🎯 Target Weakness' : '✨ For You', _score: 100 });
                    layer1AddedCount++;
                    addedInRound = true;
                }
            }
            if (!addedInRound) runningL1 = false;
        }

        // LAYER 2 (max 1-2): Spaced Repetition (SRS) - Review forgotten or failed questions
        if (userAttempted.size > 0) {
            const MAX_REVIEW = 2;
            const failedArr = shuffle(Array.from(userFailed)).slice(0, 10);
            const attemptedArr = shuffle(Array.from(userAttempted).filter(id => !userFailed.has(id))).slice(0, 10);

            // Prioritize fails, then older successes
            const pickArr = [...failedArr, ...attemptedArr];

            if (pickArr.length > 0) {
                let query = supabaseAdmin.from('questions').select('*').in('id', pickArr);
                query = applyCommonFilters(query, subject, difficulty, chapter);

                const { data } = await query;
                const reviewQuestions = shuffle(data || []).slice(0, MAX_REVIEW);

                reviewQuestions.forEach((r: any) => {
                    const isFailed = userFailed.has(String(r.id));
                    const label = isFailed ? '🔄 Review: You missed this' : '🧠 SRS Review: Do you remember?';
                    pool.push({ ...r, _layer: 2, _label: label, _score: isFailed ? 95 : 70 });
                });
            }
        }

        // LAYER 3 (~20%): What school peers solved recently
        if (userSchoolName && userId) {
            const layer3Count = Math.ceil(limit * 0.20 * overFetch);
            const { data: schoolmates } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('school', userSchoolName)
                .neq('id', userId)
                .limit(200);
            const schoolmateIds = (schoolmates || []).map((u: any) => u.id);

            if (schoolmateIds.length > 0) {
                const { data: peerAttempts } = await supabaseAdmin
                    .from('question_attempts')
                    .select('question_id')
                    .in('user_id', schoolmateIds)
                    .eq('is_correct', true)
                    .order('created_at', { ascending: false })
                    .limit(Math.ceil(50 * overFetch));

                const peerQIds = [...new Set((peerAttempts || []).map((a: any) => String(a.question_id)))]
                    .filter(id => !userAttempted.has(id))
                    .slice(0, layer3Count);

                if (peerQIds.length > 0) {
                    let query = supabaseAdmin.from('questions').select('*').in('id', peerQIds);
                    query = applyCommonFilters(query, subject, difficulty, chapter);
                    const { data } = await query;
                    (data || []).forEach((r: any) => pool.push({ ...r, _layer: 3, _label: '🏫 Trending at Your School', _score: 90 }));
                }
            }
        }

        // LAYER 4 (~10%): Hardest trending questions
        const layer4Count = Math.ceil(limit * 0.10 * overFetch);
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
                .slice(0, Math.ceil(layer4Count * 3));

            if (trendingHard.length > 0) {
                let query = supabaseAdmin.from('questions').select('*').in('id', trendingHard).eq('class_grade', userGrade);
                query = applyCommonFilters(query, subject, difficulty, chapter);
                const { data } = await query.limit(layer4Count);
                (data || []).forEach((r: any) => pool.push({ ...r, _layer: 4, _label: '🔥 Everyone\'s Struggling With This', _score: 85 }));
            }
        }

        // LAYER 5 (~10%): One level up — stretch questions
        const layer5Count = Math.ceil(limit * 0.10 * overFetch);
        if (userGrade) {
            const nextGrade = String(Number(userGrade) + 1);
            const { data } = await baseQ()
                .eq('class_grade', nextGrade)
                .order('created_at', { ascending: false })
                .limit(layer5Count * 3); // Overfetch

            const shuffledStretch = shuffle(data || []).slice(0, layer5Count);
            shuffledStretch.forEach((r: any) => pool.push({ ...r, _layer: 5, _label: '🚀 Stretch: Class ' + nextGrade, _score: 80 }));
        }

        // LAYER 6 (~20%): What people you follow recently solved
        if (followingIds.length > 0 && userId) {
            const layer6Count = Math.ceil(limit * 0.20 * overFetch);
            const { data: followedAttempts } = await supabaseAdmin
                .from('question_attempts')
                .select('question_id, user_id')
                .in('user_id', followingIds)
                .eq('is_correct', true)
                .order('created_at', { ascending: false })
                .limit(Math.ceil(100 * overFetch));

            const followedQMap: Record<string, string[]> = {};

            // Build name map from profiles table first (most authoritative)
            const { data: followerProfiles } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, username')
                .in('id', followingIds);
            const profileNameMap = Object.fromEntries(
                (followerProfiles || []).map(p => [p.id, p.full_name || p.username || null])
            );

            // Merge: profiles table wins
            const userNameMap: Record<string, string> = {};
            followingIds.forEach(id => {
                userNameMap[id] = profileNameMap[id] || 'A friend';
            });

            (followedAttempts || []).forEach((a: any) => {
                const id = String(a.question_id);
                if (!followedQMap[id]) followedQMap[id] = [];
                followedQMap[id].push(userNameMap[a.user_id] || 'A friend');
            });


            const followedQIds = Object.keys(followedQMap)
                .filter(id => !userAttempted.has(id))
                .slice(0, layer6Count);

            if (followedQIds.length > 0) {
                let query = supabaseAdmin.from('questions').select('*').in('id', followedQIds);
                query = applyCommonFilters(query, subject, difficulty, chapter);
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

        // ── LAYER 7: Community Posts with Weighted Suggestion Algorithm ────────
        // Only injected into the feed when no subject filter is active.
        // Posts are scored with a multi-signal weighting function and injected
        // into three stratified buckets: Peer Circle > Trending > Discovery.
        if (!subject) {
            // 1. Fetch pinned posts — but only if created within the last 14 days
            //    (older pinned posts are stale noise and should not float forever)
            const pinnedCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
            const { data: globalPinnedRaw } = await supabaseAdmin
                .from('posts')
                .select('*, post_likes(user_id)')
                .ilike('content', '[PINNED]%')
                .gte('created_at', pinnedCutoff)
                .order('created_at', { ascending: false })
                .limit(2);

            // 2. Fetch a wide window of recent posts (30 days, 80 posts) as candidates
            const { data: rawPosts } = await supabaseAdmin
                .from('posts')
                .select('*, post_likes(user_id)')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })
                .limit(80);

            // De-duplicate (pinned posts may appear in both queries)
            const allRawPosts = [...(globalPinnedRaw || []), ...(rawPosts || [])];
            const uniqueRawPosts = Array.from(new Map(allRawPosts.map(item => [item.id, item])).values());

            if (uniqueRawPosts.length > 0) {
                const postAuthorIds = [...new Set(uniqueRawPosts.map(p => p.author_id))];
                const postProfilesMap = await getProfilesMap(postAuthorIds);

                // Normalize all posts and calculate their weighted score
                const scoredPosts = uniqueRawPosts.map(p => {
                    const norm = normalizePost(p, postProfilesMap, userId);
                    norm._postScore = calculatePostScore(norm, followingIds, userSchoolName, userGrade);
                    return norm;
                });

                // Sort by weighted score descending
                scoredPosts.sort((a, b) => b._postScore - a._postScore);

                // ── Stratified Bucket Injection (50 / 30 / 20 split) ──
                // Bucket A: Peer Circle (follow + schoolmate) — highest priority
                // Bucket B: Trending  (high engagement/score but not in circle)
                // Bucket C: Discovery (newest/recent posts from wider community)
                const bucketA: any[] = []; // Peer Circle
                const bucketB: any[] = []; // Trending
                const bucketC: any[] = []; // Discovery

                const seenAuthors = new Set<string>(); // Diversity guard — max 2 slots per author
                const authorSlots: Record<string, number> = {};

                for (const post of scoredPosts) {
                    const authorId = post.author.id;
                    // Own posts are always shown — never throttled by the diversity guard
                    if (authorId !== userId) {
                        const slots = authorSlots[authorId] || 0;
                        if (slots >= 2) continue; // Diversity guard
                        authorSlots[authorId] = slots + 1;
                    }

                    const isFollowed = followingIds.includes(authorId);
                    const isSchoolmate = userSchoolName && post.author.school === userSchoolName;

                    if (post.is_pinned) {
                        // Pinned posts go straight to the feed pool with max score
                        pool.push(post);
                    } else if (isFollowed || isSchoolmate) {
                        post._feedLabel = isFollowed ? '👤 Post from Peer You Follow' : '🏫 Trending at Your School';
                        post._feedScore = isFollowed ? 95 : 85;
                        bucketA.push(post);
                    } else if (post._postScore > 5) {
                        // Nearly any post with recency score > 5 counts as "Trending"
                        // (threshold lowered — base score decays quickly for older posts)
                        post._feedLabel = '🔥 Trending in Community';
                        post._feedScore = 78;
                        bucketB.push(post);
                    } else {
                        // Remaining recent posts → Discovery bucket
                        post._feedLabel = '💡 Discover Something New';
                        post._feedScore = 65;
                        bucketC.push(post);
                    }
                }

                // ── Bucket quota: up to 30 posts max from community layer ──
                // Split: 50% Peer Circle, 30% Trending, 20% Discovery
                // Smart fallback: if a bucket is empty, give its slots to the next one.
                const maxPostsToShow = Math.min(30, scoredPosts.length);
                const peerSlots = Math.ceil(maxPostsToShow * 0.50);
                const trendSlots = Math.ceil(maxPostsToShow * 0.30);
                const discSlots = maxPostsToShow; // fallback fills remaining slots

                pool.push(...bucketA.slice(0, peerSlots));
                pool.push(...bucketB.slice(0, trendSlots));

                // Smart fallback: if peer + trending didn't fill enough posts,
                // pull from discovery to ensure 30 posts minimum
                const soFar = bucketA.slice(0, peerSlots).length + bucketB.slice(0, trendSlots).length;
                const remaining = Math.max(maxPostsToShow - soFar, discSlots);
                pool.push(...bucketC.slice(0, remaining));

                // Additional fallback: if we still have very few posts after buckets,
                // dump ALL scored posts into pool (removes all filters) so the page
                // is never empty for new users with no follows/school matches.
                const totalPostsAdded = pool.filter(p => p.type === 'post').length;
                if (totalPostsAdded < 5 && scoredPosts.length > 0) {
                    const alreadyInPool = new Set(pool.filter(p => p.type === 'post').map(p => p.id));
                    for (const post of scoredPosts) {
                        if (!alreadyInPool.has(post.id) && !post.is_pinned) {
                            post._feedLabel = '💡 Community Post';
                            post._feedScore = 60;
                            pool.push(post);
                        }
                    }
                }
            }
        }

        // ── Fallback ─────
        if (pool.length < 10) {
            // Fetch more, but strictly exclude what the user has already done
            const { data } = await baseQ()
                .order('created_at', { ascending: false })
                .limit(limit); // fetch enough to filter

            (data || []).forEach((r: any) => {
                const id = String(r.id);
                if (!userAttempted.has(id) && !pool.find(p => String(p.id) === id)) {
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

        // ── WRITTEN QUESTION DIVERSITY (Prioritize until 40% target) ──
        // Ensure that at least 40% of the final feed consists of written questions if available.
        // We overfetch slightly to ensure we have enough written candidates to hit the quota.
        const writtenItems = pool.filter(p => !p.type && (p.points || 0) > 15);
        const nonWrittenItems = pool.filter(p => p.type === 'post' || (p.points || 0) <= 15);

        const targetWritten = Math.floor(limit * 0.4);
        const selectedWritten = writtenItems.slice(0, targetWritten);
        // If we have fewer than targetWritten, we just take all we have.

        // Combine them back ensuring stratified order is preserved as much as possible
        // but prioritized by the 40% quota.
        let finalPool = [...selectedWritten, ...nonWrittenItems, ...writtenItems.slice(targetWritten)];

        // ── Stratified Sort ──
        // This restores the layer-based ordering (Just Added > Peer Solved > For You, etc.)
        finalPool = shuffleWithinGroups(finalPool);

        pool = finalPool;


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
                username: p?.username || null,
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
            .slice(qOffset, limit)
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
    const layerOrder = [10, 8, 6, 1, 7, 2, 3, 4, 5, 0];
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
