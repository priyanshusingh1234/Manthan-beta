-- Add last_streak_count column to profiles table
-- This stores the streak count before it was reset to 0,
-- so the StreakLostOverlay can display "You lost your X-day streak"

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_streak_count integer NOT NULL DEFAULT 0;
