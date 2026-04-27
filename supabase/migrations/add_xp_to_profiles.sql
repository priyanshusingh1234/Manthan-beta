-- Add XP column to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

-- Optional: backfill existing users so xp starts at 0 (already handled by DEFAULT)
-- UPDATE profiles SET xp = 0 WHERE xp IS NULL;
