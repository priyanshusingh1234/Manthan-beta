-- ============================================================
-- ADD ONBOARDING TRACKER TO PROFILES
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.onboarding IS 'Tracks scholar induction milestones for the 10-point bonus.';
