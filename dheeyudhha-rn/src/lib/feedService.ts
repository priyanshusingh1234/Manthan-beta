// ─── Feed Service (ported from web app/api/feed/route.ts) ────────────────────
// Uses Supabase anon client with user session — no service role needed.

import { supabase } from './supabaseClient';
import {
  shuffle,
  shuffleWithinGroups,
  applyCommonFilters,
  normalizeQuestion,
} from './feedHelpers';

const CORE_SUBJECTS = ['Mathematics', 'Science', 'English', 'SST', 'English Literature', 'G.K', 'Hindi'];
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

async function fetchSubjectTimeBuckets(
  subjectToFetch: string,
  gradeToFetch: string | null,
  difficulty = '',
  chapter = ''
) {
  const applyFilter = (q: any) => {
    let query = applyCommonFilters(q, subjectToFetch, difficulty, chapter);
    if (gradeToFetch) query = query.in('class_grade', [String(gradeToFetch), 'All', 'Any']);
    return query;
  };

  const [resA, resB, resC] = await Promise.all([
    applyFilter(supabase.from('questions').select('*'))
      .gte('created_at', daysAgo(3))
      .order('created_at', { ascending: false })
      .limit(20),
    applyFilter(supabase.from('questions').select('*'))
      .lt('created_at', daysAgo(3))
      .gte('created_at', daysAgo(14))
      .order('created_at', { ascending: false })
      .limit(25),
    applyFilter(supabase.from('questions').select('*'))
      .lt('created_at', daysAgo(14))
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return {
    subject: subjectToFetch,
    A: shuffle(resA.data || []),
    B: shuffle(resB.data || []),
    C: shuffle(resC.data || []),
  };
}

export interface FeedOptions {
  subject?: string;
  difficulty?: string;
  chapter?: string;
  limit?: number;
}

export async function fetchFeed(options: FeedOptions = {}): Promise<any[]> {
  const { subject = '', difficulty = '', chapter = '', limit = 30 } = options;

  // ── Step 1: User context ──────────────────────────────────────────────────
  let userId: string | null = null;
  let userGrade: string | null = null;
  let userSchoolName: string | null = null;
  let followingIds: string[] = [];
  const userAttempted = new Set<string>();
  const userFailed = new Set<string>();
  let recentFailedSubject: string | null = null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    userId = session.user.id;
    userGrade =
      session.user.user_metadata?.classGrade?.toString() ||
      session.user.user_metadata?.grade?.toString() ||
      null;

    // Fetch profile, follows, and last 300 attempts in parallel
    const [profileResult, followsResult, attemptsResult] = await Promise.all([
      supabase.from('profiles').select('school, class_grade').eq('id', userId).maybeSingle(),
      supabase.from('follows').select('following_id').eq('follower_id', userId),
      supabase
        .from('question_attempts')
        .select('question_id, is_correct')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(300),
    ]);

    userSchoolName = profileResult.data?.school || session.user.user_metadata?.school || null;
    if (!userGrade) userGrade = profileResult.data?.class_grade?.toString() || null;
    followingIds = (followsResult.data || []).map((f: any) => f.following_id);

    const attempts = attemptsResult.data || [];
    let lastFailId: any = null;
    for (const a of attempts) {
      userAttempted.add(String(a.question_id));
      if (!a.is_correct) {
        userFailed.add(String(a.question_id));
        if (!lastFailId) lastFailId = a.question_id;
      }
    }

    // Fetch written submissions + failed subject in parallel
    const parallelTasks: Promise<any>[] = [
      supabase.from('written_submissions').select('question_id').eq('student_id', userId),
    ];
    if (lastFailId && !subject) {
      parallelTasks.push(
        supabase.from('questions').select('subject').eq('id', lastFailId).maybeSingle()
      );
    }
    const [writtenResult, failedQResult] = await Promise.all(parallelTasks);
    (writtenResult?.data || []).forEach((w: any) => userAttempted.add(String(w.question_id)));
    if (failedQResult?.data?.subject) recentFailedSubject = failedQResult.data.subject;
  }

  // ── Step 2: Launch ALL heavy queries in one parallel batch ────────────────
  const bucketsFetch = subject
    ? fetchSubjectTimeBuckets(subject, userGrade, difficulty, chapter)
    : Promise.all(CORE_SUBJECTS.map(sub => fetchSubjectTimeBuckets(sub, userGrade, difficulty, chapter)));

  // Schoolmates
  const schoolmatesFetch =
    userSchoolName && userId
      ? supabase.from('profiles').select('id').eq('school', userSchoolName).neq('id', userId).limit(100)
      : Promise.resolve(null);

  // Following attempts
  const followingAttemptsFetch =
    followingIds.length > 0 && userId
      ? Promise.all([
          supabase
            .from('question_attempts')
            .select('question_id, user_id')
            .in('user_id', followingIds)
            .eq('is_correct', true)
            .order('created_at', { ascending: false })
            .limit(80),
          supabase.from('profiles').select('id, full_name, username').in('id', followingIds),
        ])
      : Promise.resolve(null);

  // Hard stats
  const hardStatsFetch = userGrade
    ? supabase.from('question_attempts').select('question_id, is_correct').limit(500)
    : Promise.resolve(null);

  // SRS review
  const failedArr = userFailed.size > 0 ? shuffle(Array.from(userFailed)).slice(0, 2) : [];
  const srsReviewFetch =
    failedArr.length > 0
      ? supabase.from('questions').select('*').in('id', failedArr)
      : Promise.resolve(null);

  // Stretch questions (1 grade up)
  const nextGrade = userGrade ? String(Number(userGrade) + 1) : null;
  const baseQ = () => applyCommonFilters(supabase.from('questions').select('*'), subject, difficulty, chapter);
  const stretchFetch = nextGrade
    ? baseQ().eq('class_grade', nextGrade).order('created_at', { ascending: false }).limit(Math.ceil(limit * 0.10) * 2)
    : Promise.resolve(null);

  const [bucketsRaw, schoolmatesRes, followingRaw, hardStatsRes, srsRes, stretchRes] =
    await Promise.all([
      bucketsFetch,
      schoolmatesFetch,
      followingAttemptsFetch,
      hardStatsFetch,
      srsReviewFetch,
      stretchFetch,
    ]);

  const bucketsData: any[] = subject ? [bucketsRaw as any] : (bucketsRaw as any[]);

  if (recentFailedSubject) {
    const b = bucketsData.find((bd: any) => bd.subject === recentFailedSubject);
    if (b) b.isWeakness = true;
  }

  // ── Step 3: Build pool ────────────────────────────────────────────────────
  let pool: any[] = [];
  const overFetch = subject ? 1 : 1.5;

  // Layer 8 — New questions booster (10%)
  const layer8Count = Math.ceil(limit * 0.10 * overFetch);
  let layer8Added = 0;
  let runningL8 = true;
  while (runningL8 && layer8Added < layer8Count) {
    let addedInRound = false;
    for (const bData of bucketsData) {
      if (layer8Added >= layer8Count) break;
      const qIdx = bData.A.findIndex(
        (q: any) => !userAttempted.has(String(q.id)) && !pool.some((p: any) => p.id === q.id)
      );
      if (qIdx !== -1) {
        const q = bData.A.splice(qIdx, 1)[0];
        pool.push({ ...q, _layer: 8, _label: bData.isWeakness ? '🎯 Target Weakness' : '✨ Just Added', _score: 120 });
        layer8Added++;
        addedInRound = true;
      }
    }
    if (!addedInRound) runningL8 = false;
  }

  // Layer 1 — Core feed (35%)
  const layer1Count = Math.ceil(limit * 0.35 * overFetch);
  let layer1Added = 0;
  let runningL1 = true;
  while (runningL1 && layer1Added < layer1Count) {
    let addedInRound = false;
    for (const bData of bucketsData) {
      if (layer1Added >= layer1Count) break;
      const combined = [...bData.A, ...bData.B, ...bData.C];
      const qIdx = combined.findIndex(
        (q: any) => !userAttempted.has(String(q.id)) && !pool.some((p: any) => p.id === q.id)
      );
      if (qIdx !== -1) {
        const q = combined[qIdx];
        if (bData.A.includes(q)) bData.A.splice(bData.A.indexOf(q), 1);
        else if (bData.B.includes(q)) bData.B.splice(bData.B.indexOf(q), 1);
        else bData.C.splice(bData.C.indexOf(q), 1);
        pool.push({ ...q, _layer: 1, _label: bData.isWeakness ? '🎯 Target Weakness' : '✨ For You', _score: 100 });
        layer1Added++;
        addedInRound = true;
      }
    }
    if (!addedInRound) runningL1 = false;
  }

  // Layer 2 — SRS review (missed questions)
  if (srsRes && (srsRes as any).data?.length > 0) {
    shuffle((srsRes as any).data).forEach((r: any) => {
      pool.push({ ...r, _layer: 2, _label: '🔄 Review: You missed this', _score: 95 });
    });
  }

  // Layer 3 — Schoolmate trending (secondary fetch)
  const layer3SecondaryFetch =
    schoolmatesRes && (schoolmatesRes as any).data?.length > 0
      ? (() => {
          const schoolmateIds = ((schoolmatesRes as any).data || []).map((u: any) => u.id);
          return supabase
            .from('question_attempts')
            .select('question_id')
            .in('user_id', schoolmateIds)
            .eq('is_correct', true)
            .order('created_at', { ascending: false })
            .limit(40);
        })()
      : Promise.resolve(null);

  // Layer 4 — Hard trending (secondary fetch)
  let trendingHardIds: string[] = [];
  if (hardStatsRes && (hardStatsRes as any).data) {
    const statsMap: Record<string, { total: number; correct: number }> = {};
    ((hardStatsRes as any).data || []).forEach((a: any) => {
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

  const layer4SecondaryFetch =
    trendingHardIds.length > 0 && userGrade
      ? (() => {
          let q = supabase.from('questions').select('*').in('id', trendingHardIds).eq('class_grade', userGrade);
          q = applyCommonFilters(q, subject, difficulty, chapter);
          return q.limit(Math.ceil(limit * 0.10));
        })()
      : Promise.resolve(null);

  const [layer3AttemptsRes, layer4DataRes] = await Promise.all([
    layer3SecondaryFetch,
    layer4SecondaryFetch,
  ]);

  // Layer 3 — process schoolmate results
  if (layer3AttemptsRes && (layer3AttemptsRes as any).data) {
    const peerQIds = [
      ...new Set(((layer3AttemptsRes as any).data || []).map((a: any) => String(a.question_id))),
    ]
      .filter(id => !userAttempted.has(id as string))
      .slice(0, Math.ceil(limit * 0.15));

    if (peerQIds.length > 0) {
      let q = applyCommonFilters(supabase.from('questions').select('*'), subject, difficulty, chapter);
      const { data } = await q.in('id', peerQIds);
      (data || []).forEach((r: any) =>
        pool.push({ ...r, _layer: 3, _label: '🏫 Trending at Your School', _score: 90 })
      );
    }
  }

  // Layer 4 — Hard trending
  if (layer4DataRes && (layer4DataRes as any).data) {
    ((layer4DataRes as any).data || []).forEach((r: any) =>
      pool.push({ ...r, _layer: 4, _label: "🔥 Everyone's Struggling With This", _score: 85 })
    );
  }

  // Layer 5 — Stretch questions
  if (stretchRes && (stretchRes as any).data) {
    shuffle((stretchRes as any).data)
      .slice(0, Math.ceil(limit * 0.10))
      .forEach((r: any) =>
        pool.push({ ...r, _layer: 5, _label: '🚀 Stretch: Class ' + nextGrade, _score: 80 })
      );
  }

  // Layer 9 — VIP Daily Challenges
  if (!subject) {
    let vipQuery = supabase
      .from('questions')
      .select('*')
      .eq('is_vip', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (userGrade) vipQuery = vipQuery.in('class_grade', [String(userGrade), 'All', 'Any']);
    const { data: vipData } = await vipQuery;
    const vipItems = shuffle(vipData || [])
      .filter((r: any) => !userAttempted.has(String(r.id)))
      .slice(0, 5);
    vipItems.forEach((r: any) =>
      pool.push({ ...r, _layer: -2, _label: '👑 VIP Daily Challenge', _score: 150, is_vip: true })
    );

    // Layer 10 — Written Challenges
    let writtenQuery = supabase
      .from('questions')
      .select('*')
      .eq('question_type', 'written')
      .order('created_at', { ascending: false })
      .limit(40);
    if (userGrade) writtenQuery = writtenQuery.in('class_grade', [String(userGrade), 'All', 'Any']);
    const { data: writtenData } = await writtenQuery;
    const writtenItems = shuffle(writtenData || [])
      .filter((r: any) => !userAttempted.has(String(r.id)) && !pool.some((p: any) => p.id === r.id))
      .slice(0, 8);
    writtenItems.forEach((r: any) =>
      pool.push({ ...r, _layer: -1, _label: '✍️ Written Challenge', _score: 145, is_written_challenge: true })
    );
  }

  // Layer 6 — Following solved
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
      let q = applyCommonFilters(supabase.from('questions').select('*'), subject, difficulty, chapter);
      const { data } = await q.in('id', followedQIds).limit(Math.ceil(limit * 0.20));
      (data || []).forEach((r: any) => {
        const solvers = followedQMap[String(r.id)] || [];
        const label =
          solvers.length === 1
            ? `👤 ${solvers[0]} just solved this`
            : `👥 ${solvers[0]} +${solvers.length - 1} you follow solved this`;
        pool.push({ ...r, _layer: 6, _label: label, _score: 98 });
      });
    }
  }

  // Fallback — if pool is too small
  if (pool.length < 8) {
    const { data } = await baseQ().order('created_at', { ascending: false }).limit(limit);
    (data || []).forEach((r: any) => {
      const id = String(r.id);
      if (!pool.find((p: any) => String(p.id) === id)) {
        pool.push({ ...r, _layer: 0, _label: '📚 From the Library', _score: 50 });
      }
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  pool = pool.filter(r => {
    if (seen.has(String(r.id))) return false;
    seen.add(String(r.id));
    return true;
  });

  // Shuffle within layers and take limit
  const finalPool = shuffleWithinGroups(pool).slice(0, limit);

  // ── Step 4: Enrich with creator profiles + attempt counts ─────────────────
  const qIds = finalPool.map((r: any) => String(r.id));
  const creatorIds = [
    ...new Set(finalPool.map((r: any) => r.created_by).filter(Boolean)),
  ] as string[];

  const [profilesRes, attemptsRowsRes] = await Promise.all([
    creatorIds.length > 0
      ? supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', creatorIds)
      : Promise.resolve({ data: [] }),
    qIds.length > 0
      ? supabase.from('question_attempts').select('question_id, is_correct').in('question_id', qIds).limit(2000)
      : Promise.resolve({ data: [] }),
  ]);

  const userInfoMap: Record<string, any> = {};
  (profilesRes.data || []).forEach((p: any) => {
    userInfoMap[p.id] = { name: p.full_name || 'Teacher', avatar: p.avatar_url || null, username: p.username || null };
  });

  const attemptsMap: Record<string, { total: number; solved: number }> = {};
  ((attemptsRowsRes as any).data || []).forEach((a: any) => {
    const id = String(a.question_id);
    if (!attemptsMap[id]) attemptsMap[id] = { total: 0, solved: 0 };
    attemptsMap[id].total++;
    if (a.is_correct) attemptsMap[id].solved++;
  });

  const normalized = finalPool.map((r: any) =>
    normalizeQuestion(r, userInfoMap, attemptsMap, userAttempted, userFailed, r._label || '')
  );

  // ── Step 5: Interleave VIP + Written at fixed positions ───────────────────
  const vipItems = normalized.filter((q: any) => q.is_vip);
  const writtenItems = normalized.filter((q: any) => q.is_written_challenge);
  const normalItems = normalized.filter((q: any) => !q.is_vip && !q.is_written_challenge);

  const interleavedFeed: any[] = [];
  let vipIdx = 0;
  let writtenIdx = 0;

  for (let i = 0; i < normalItems.length; i++) {
    if (vipIdx < vipItems.length && (i === 1 || (i > 1 && (i - 1) % 5 === 0))) {
      interleavedFeed.push(vipItems[vipIdx++]);
    }
    if (writtenIdx < writtenItems.length && (i === 3 || (i > 3 && (i - 3) % 5 === 0))) {
      interleavedFeed.push(writtenItems[writtenIdx++]);
    }
    interleavedFeed.push(normalItems[i]);
  }

  while (vipIdx < vipItems.length) interleavedFeed.push(vipItems[vipIdx++]);
  while (writtenIdx < writtenItems.length) interleavedFeed.push(writtenItems[writtenIdx++]);

  return interleavedFeed;
}
