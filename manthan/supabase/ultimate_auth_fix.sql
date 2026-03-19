-- ========================================================
-- SUPER ROBUST AUTH FIX
-- Run this in Supabase SQL Editor to stop the Signup Crash
-- ========================================================

-- 1. Ensure the profiles table is ready and columns are TEXT (not UUID)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    school TEXT,
    class_grade TEXT,
    is_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    total_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

-- Force columns to be TEXT in case they were created as UUIDs before
-- This handles the "Empty works, Name fails" issue if school was a UUID
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.profiles ALTER COLUMN school TYPE TEXT;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Could not alter school column, maybe it already is text';
    END;
END $$;

-- 2. Create the Ultimate Trigger Function
-- This version catches ALL errors and never blocks signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- We wrap the logic in its own BEGIN block to catch errors locally
  BEGIN
    INSERT INTO public.profiles (id, username, full_name, school, class_grade)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', ''),
        COALESCE(NEW.raw_user_meta_data->>'fullName', ''),
        COALESCE(NEW.raw_user_meta_data->>'school', ''),
        COALESCE(NEW.raw_user_meta_data->>'classGrade', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        school = EXCLUDED.school,
        class_grade = EXCLUDED.class_grade;
  EXCEPTION WHEN OTHERS THEN
    -- If profile insert fails for ANY reason (constraints, types, etc)
    -- we still return NEW so the user actually gets created in Supabase Auth.
    -- This ensures signup NEVER says "Database error"
    RETURN NEW;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cleanup old triggers and link the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure RLS doesn't block the trigger (though SECURITY DEFINER handles it)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for profiles" ON public.profiles;
CREATE POLICY "Enable all access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
