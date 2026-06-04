// ─── Feed Helpers (ported from web lib/feedHelpers.ts) ───────────────────────

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

export function shuffleWithinGroups(arr: any[]): any[] {
  const groups: Record<number, any[]> = {};
  arr.forEach(item => {
    const layer = item._layer ?? 0;
    if (!groups[layer]) groups[layer] = [];
    groups[layer].push(item);
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

export function applyCommonFilters(query: any, subject: string, difficulty = '', chapter = '') {
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

export function normalizeQuestion(
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
    profiles: {
      full_name: userInfoMap[String(r.created_by)]?.name || 'Teacher',
      avatar_url: userInfoMap[String(r.created_by)]?.avatar || null,
      username: userInfoMap[String(r.created_by)]?.username || null,
      is_teacher: userInfoMap[String(r.created_by)]?.is_teacher || false,
    },
    title: r.title,
    body: r.body,
    subject: r.subject,
    chapter: r.chapter || null,
    class_grade: r.class_grade,
    points: r.points,
    time_limit: r.time_limit,
    difficulty: r.difficulty || null,
    options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options || null,
    correct_option: typeof r.correct_option === 'number' ? r.correct_option : null,
    question_type: r.question_type || 'mcq',
    match_pairs: typeof r.match_pairs === 'string' ? JSON.parse(r.match_pairs) : r.match_pairs || null,
    solved_count: attemptsMap[String(r.id)]?.solved || r.solved_count || 0,
    totalAttempts: attemptsMap[String(r.id)]?.total || 0,
    hasAttempted: userAttempted.has(String(r.id)),
    hasFailed: userFailed.has(String(r.id)),
    image_path: r.image_path || null,
    image_url: r.image_url || null,
    is_vip: r.is_vip === true,
    created_at: r.created_at,
    _feedLabel: feedLabel,
    _layer: r._layer ?? 1,
    type: 'question',
  };
}
