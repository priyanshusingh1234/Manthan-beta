import { supabase } from './supabaseClient';

export interface FeedOptions {
  subject?: string;
  difficulty?: string;
  chapter?: string;
  limit?: number;
  excludeIds?: string[];
}

export async function fetchFeed(options: FeedOptions = {}): Promise<any[]> {
  const { subject = '', difficulty = '', chapter = '', limit = 30, excludeIds = [] } = options;

  const { data: { session } } = await supabase.auth.getSession();

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
  const url = new URL(`${API_URL}/api/feed`);

  if (subject) url.searchParams.append('subject', subject);
  if (difficulty) url.searchParams.append('difficulty', difficulty);
  if (chapter) url.searchParams.append('chapter', chapter);
  if (limit) url.searchParams.append('limit', String(limit));
  // Pass seen IDs as a comma-separated string so server can exclude them
  if (excludeIds.length > 0) url.searchParams.append('exclude', excludeIds.join(','));

  // 3. Set up the headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  try {
    // 4. Fetch from the Web API
    const res = await fetch(url.toString(), { headers });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch feed: ${res.statusText}`);
    }

    const json = await res.json();
    const questions = json.questions || [];

    // 5. Map the web API response to the format expected by React Native QuestionCard
    // The web API returns author fields like createdByName, createdByAvatar, and uses classGrade.
    // QuestionCard expects q.profiles.full_name, q.profiles.avatar_url, q.class_grade, q.solved_count.
    
    return questions.map((q: any) => {
      // If it's a community post or arena challenge, we can return as is and let the specific cards handle it.
      // (Though feed currently only renders questions via QuestionCard, we'll map question fields)
      
      if (q.type === 'post') {
        return q;
      }

      return {
        ...q,
        // Map web API author fields to local Supabase join format
        profiles: {
          full_name: q.createdByName || 'Teacher',
          avatar_url: q.createdByAvatar || null,
          username: q.createdByUsername || null,
          is_teacher: q.createdByIsTeacher || false,
        },
        
        // Map nested or renamed fields
        created_by: q.createdBy || null,
        class_grade: q.classGrade || q.class_grade || null,
        time_limit: q.timeLimit || q.time_limit || 0,
        question_type: q.questionType || q.question_type || 'mcq',
        correct_option: q.correctOption !== undefined ? q.correctOption : q.correct_option,
        match_pairs: q.matchPairs || q.match_pairs || null,
        
        // Stats mapping (solvedCount from API -> solved_count in RN UI)
        solved_count: q.solvedCount !== undefined ? q.solvedCount : q.solved_count,
        totalAttempts: q.totalAttempts || 0,
        
        // Keep the algorithmic tags for QuestionCard (`_feedLabel` handled by API in `_label` or `_feedLabel`)
        _feedLabel: q._feedLabel || q._label || null,
      };
    });

  } catch (err) {
    console.error('Error fetching feed via Web API:', err);
    return [];
  }
}
