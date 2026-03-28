import { Preferences } from '@capacitor/preferences';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'dheeyudha_user_weights';
const HISTORY_LIMIT = 50;

export interface UserStats {
  subjectWeights: Record<string, number>; // Higher = Needs more of this subject
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
  async trackSolve(subject: string, isCorrect: boolean) {
    const stats = await this.getStats();
    
    // Normalize subject string
    const sub = subject.toLowerCase().trim();
    if (!stats.subjectWeights[sub]) stats.subjectWeights[sub] = 1.0;

    if (isCorrect) {
      // User is good at this; reduce priority slightly
      stats.subjectWeights[sub] = Math.max(0.2, stats.subjectWeights[sub] - 0.1);
    } else {
      // User struggled; increase priority to help them practice
      stats.subjectWeights[sub] = Math.min(3.0, stats.subjectWeights[sub] + 0.3);
    }

    stats.totalSolves += 1;

    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(stats)
    });
    
    console.log(`[ActivityTracker] Updated weights for ${sub}:`, stats.subjectWeights[sub]);
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
        errorPatterns: {}, 
        totalSolves: 0 
      };
    }
    
    try {
      const parsed = JSON.parse(value);
      return {
        subjectWeights: parsed.subjectWeights || {},
        errorPatterns: parsed.errorPatterns || {},
        totalSolves: typeof parsed.totalSolves === 'number' ? parsed.totalSolves : 0
      };
    } catch (e) {
      console.error("[ActivityTracker] parse error", e);
      return { subjectWeights: {}, errorPatterns: {}, totalSolves: 0 };
    }
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
