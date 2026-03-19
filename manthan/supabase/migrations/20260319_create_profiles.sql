-- ============================================================
-- PROFILES TABLE — Safe migration that handles existing tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the table if it truly doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name    TEXT,
    avatar_url   TEXT,
    school       TEXT,
    school_id    TEXT,
    is_teacher   BOOLEAN NOT NULL DEFAULT FALSE,
    total_points INTEGER NOT NULL DEFAULT 0,
    username     TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add each column in case the table already exists (Supabase default)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_teacher   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS profiles_is_teacher_idx    ON public.profiles (is_teacher);
CREATE INDEX IF NOT EXISTS profiles_total_points_idx  ON public.profiles (total_points DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "profiles_select_all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;

CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_service_all" ON public.profiles USING (auth.role() = 'service_role');
