-- Remove emoji/special chars from the known railwaydriver username
UPDATE public.profiles
SET username = 'railwaydriver'
WHERE username IS NOT NULL
  AND username <> 'railwaydriver'
  AND regexp_replace(lower(username), '[^a-z0-9_]+', '', 'g') = 'railwaydriver';

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{username}',
    to_jsonb('railwaydriver'::text),
    true
)
WHERE regexp_replace(lower(COALESCE(raw_user_meta_data->>'username', '')), '[^a-z0-9_]+', '', 'g') = 'railwaydriver'
  AND COALESCE(raw_user_meta_data->>'username', '') <> 'railwaydriver';

-- Enforce: future profile usernames can only be lowercase letters, numbers, and underscores.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_username_no_emoji_chk'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_username_no_emoji_chk
            CHECK (username IS NULL OR username = '' OR username ~ '^[a-z0-9_]+$')
            NOT VALID;
    END IF;
END $$;
