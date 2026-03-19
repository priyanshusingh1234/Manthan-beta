-- ============================================================
-- PROFILES TABLE
-- Mirrors auth user_metadata so we never need listUsers()
-- ============================================================

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

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS profiles_is_teacher_idx ON public.profiles (is_teacher);
CREATE INDEX IF NOT EXISTS profiles_total_points_idx ON public.profiles (total_points DESC);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Service role bypasses RLS (used by our admin client)
CREATE POLICY "profiles_service_all" ON public.profiles
    USING (auth.role() = 'service_role');
