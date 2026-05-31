import { supabase } from './supabaseClient';

const Preferences = { 
  get: async () => ({ value: null }), 
  set: async () => {}, 
  remove: async () => {}
};

const STORAGE_KEY = 'dheeyudha_user_weights';
const HISTORY_LIMIT = 50;

export interface UserStats {
  subjectWeights: Record<string, number>; // Higher = Needs more of this subject
  tagWeights: Record<string, number>; // Higher = struggling with this topic
  timeSpentMap: Record<string, number[]>; // tracks time taken (seconds) for each subject
  errorPatterns: Record<string, number>; // Tracks specific tag errors
  totalSolves: number;
}

/**
 * 🚀 High-performance local activity tracker for Dheeyudha.
 * Uses Capacitor Preferences (Async, Non-blocking) for Android/Web.
 */
export const ActivityTracker = {
  
  /**
   * Tracks a question solve and recalculates weights.
   * If they get it wrong, the "Weight" for that subject increases (to show it more).
   * If they keep getting it right, the "Weight" decreases.
   */
  async trackSolve(subject: string, isCorrect: boolean, tags: string[] = [], timeTakenSeconds: number = 0) {
    const stats = await this.getStats();
    
    // Normalize subject string
    const sub = subject.toLowerCase().trim();
    if (!stats.subjectWeights[sub]) stats.subjectWeights[sub] = 1.0;
    if (!stats.timeSpentMap[sub]) stats.timeSpentMap[sub] = [];

    // Track time spent
    if (timeTakenSeconds > 0) {
      stats.timeSpentMap[sub].push(timeTakenSeconds);
      // Keep only last 20 sessions for memory efficiency
      if (stats.timeSpentMap[sub].length > 20) stats.timeSpentMap[sub].shift();
    }

    if (isCorrect) {
      // User is good at this; reduce priority slightly
      stats.subjectWeights[sub] = Math.max(0.2, stats.subjectWeights[sub] - 0.1);
      
      // Reduce weight for tags on success
      tags.forEach(t => {
        const tag = t.toLowerCase().trim();
        stats.tagWeights[tag] = Math.max(0.1, (stats.tagWeights[tag] || 1.0) - 0.1);
      });
    } else {
      // User struggled; increase priority to help them practice
      stats.subjectWeights[sub] = Math.min(3.0, stats.subjectWeights[sub] + 0.3);

      // Increase weight for tags on failure
      tags.forEach(t => {
        const tag = t.toLowerCase().trim();
        stats.tagWeights[tag] = Math.min(5.0, (stats.tagWeights[tag] || 1.0) + 0.5);
      });
    }

    stats.totalSolves += 1;

    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(stats)
    });
    
    console.log(`[ActivityTracker] Updated weights for ${sub} and tags:`, tags);
  },

  /**
   * Returns the current user's learning weights.
   * Higher weight = User is struggling here! Feed should prioritize this.
   */
  async getStats(): Promise<UserStats> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) {
      return { 
        subjectWeights: {}, 
        tagWeights: {},
        timeSpentMap: {},
        errorPatterns: {}, 
        totalSolves: 0 
      };
    }
    
    try {
      const parsed = JSON.parse(value);
      return {
        subjectWeights: parsed.subjectWeights || {},
        tagWeights: parsed.tagWeights || {},
        timeSpentMap: parsed.timeSpentMap || {},
        errorPatterns: parsed.errorPatterns || {},
        totalSolves: typeof parsed.totalSolves === 'number' ? parsed.totalSolves : 0
      };
    } catch (e) {
      console.error("[ActivityTracker] parse error", e);
      return { subjectWeights: {}, tagWeights: {}, timeSpentMap: {}, errorPatterns: {}, totalSolves: 0 };
    }
  },

  /**
   * 🎯 Suggests a difficulty level based on historical performance in a subject.
   */
  async getRecommendedDifficulty(subject: string): Promise<'Easy' | 'Medium' | 'Hard'> {
    const stats = await this.getStats();
    const sub = subject.toLowerCase().trim();
    const weight = stats.subjectWeights[sub] || 1.0;

    if (weight > 2.0) return 'Easy'; // Struggling, show easier ones
    if (weight < 0.6) return 'Hard'; // Pro, show hard ones
    return 'Medium';
  },

  /**
   * Clears local cache (for testing or profile reset)
   */
  async reset() {
    await Preferences.remove({ key: STORAGE_KEY });
  },

  /**
   * 🌥️ Syncs local stats to Supabase for persistence across uninstalls.
   */
  async syncToCloud() {
    try {
      const stats = await this.getStats();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.auth.updateUser({
          data: { learning_stats: stats }
        });
        console.log("[ActivityTracker] Stats synced to cloud!");
      }
    } catch (e) {
      console.error("[ActivityTracker] Cloud sync failed:", e);
    }
  },

  /**
   * 📥 Restores stats from Supabase (Call after login or reinstall).
   */
  async restoreFromCloud() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const stats = user?.user_metadata?.learning_stats;
      
      if (stats) {
        await Preferences.set({
          key: STORAGE_KEY,
          value: JSON.stringify(stats)
        });
        console.log("[ActivityTracker] Stats restored from cloud!");
      }
    } catch (e) {
      console.error("[ActivityTracker] Cloud restore failed:", e);
    }
  }
};