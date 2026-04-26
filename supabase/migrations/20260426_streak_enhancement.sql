-- ─────────────────────────────────────────────────────────────────────
-- Streak Enhancement Migration
-- Adds daily question tracking and longest-streak columns to profiles
-- Run in Supabase SQL Editor > New Query
-- ─────────────────────────────────────────────────────────────────────

-- Add new columns (safe to run multiple times)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS streak_longest   integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS daily_solve_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS daily_solve_date  date;

-- Back-fill longest streak from existing streak_count where appropriate
UPDATE public.profiles
SET streak_longest = streak_count
WHERE streak_longest < streak_count;

-- Create index for efficient daily-solve queries
CREATE INDEX IF NOT EXISTS profiles_daily_solve_date_idx ON public.profiles (daily_solve_date);
