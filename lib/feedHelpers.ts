// ─── Normalizers & Helpers for Feed ─────────────────────────────────────────────

export interface FeedQuestion {
    id: string | number;
    created_by?: string | null;
    title: string;
    body?: string;
    subject: string;
    chapter?: string;
    class_grade?: string;
    points: number;
    time_limit: number;
    difficulty?: string;
    options?: any;
    correct_option?: number | null;
    question_type?: string;
    match_pairs?: any;
    image_path?: string | null;
    image_url?: string | null;
    is_vip?: boolean;
    created_at?: string;
    _label?: string;
    _layer?: number;
    _score?: number;
    type?: 'question';
}

export interface FeedPost {
    id: string | number;
    author_id: string;
    content?: string;
    image_url?: string;
    image_urls?: string[];
    video_url?: string;
    video_thumbnail?: string;
    likes_count?: number;
    comments_count?: number;
    created_at?: string;
    post_likes?: { user_id: string }[];
    is_pinned?: boolean;
    _layer?: number;
    _postScore?: number;
    _feedLabel?: string;
    _feedScore?: number;
    type?: 'post';
}

export function normalizeQuestion(
    r: FeedQuestion,
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
        createdByIsTeacher: userInfoMap[String(r.created_by)]?.is_teacher || false,
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

export function normalizePost(p: FeedPost, profilesMap: Map<string, any>, currentUserId: string | null) {
    const profile = profilesMap.get(p.author_id);
    let finalContent = p.content || '';
    let isPinned = false;
    const likesCount = Array.isArray(p.post_likes) ? p.post_likes.length : (p.likes_count || 0);
    if (finalContent.startsWith('[PINNED]')) { isPinned = true; finalContent = finalContent.substring(8).trim(); }
    return {
        id: p.id, type: 'post', content: finalContent, image_url: p.image_url,
        image_urls: p.image_urls,
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

export function calculatePostScore(post: FeedPost, followingIds: string[], userSchool: string | null, userGrade: string | null): number {
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

export function applyCommonFilters(query: any, subject: string, difficulty: string, chapter: string = '') {
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

export function shuffle(arr: any[]) { return arr.sort(() => 0.5 - Math.random()); }

export function shuffleWithinGroups(arr: any[]): any[] {
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
    const layerOrder = [-3, -2, -1, 10, 8, 6, 1, 7, 2, 3, 4, 5, 0];
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
