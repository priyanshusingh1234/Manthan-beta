-- ============================================================
-- ADD STREAK COLUMNS TO PROFILES
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_streak_at TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_solved  INTEGER NOT NULL DEFAULT 0;

-- Optional: Index for streak-based leaderboards
CREATE INDEX IF NOT EXISTS profiles_streak_count_idx ON public.profiles (streak_count DESC);

COMMENT ON COLUMN public.profiles.streak_count IS 'Consecutive days of meeting the scholar quota.';
COMMENT ON COLUMN public.profiles.last_streak_at IS 'The last date (YYYY-MM-DD) the scholar completed their goal.';
COMMENT ON COLUMN public.profiles.daily_solved IS 'Count of correct answers today.';
