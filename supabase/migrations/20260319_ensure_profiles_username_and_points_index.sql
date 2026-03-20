-- Ensure profiles has username + fast leaderboard indexes
-- Safe to run multiple times

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN NOT NULL DEFAULT FALSE;

-- Fast Top Brain ordering
CREATE INDEX IF NOT EXISTS profiles_total_points_idx
    ON public.profiles (total_points DESC);

-- Fast username lookup for /user/[username]
CREATE INDEX IF NOT EXISTS profiles_username_idx
    ON public.profiles (username);

-- Optional uniqueness for usernames (ignoring null/empty)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
    ON public.profiles (LOWER(username))
    WHERE username IS NOT NULL AND username <> '';
