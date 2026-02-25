-- ============================================================
-- MANTHAN CO-OP CHALLENGE MIGRATION
-- Run this in Supabase SQL Editor (it's safe to run multiple times)
-- ============================================================

-- 1. Create coop_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coop_challenges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    initiator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'won', 'lost')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '24 hours') NOT NULL
);

-- 2. Enable RLS on coop_challenges
ALTER TABLE public.coop_challenges ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for coop_challenges (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view their own coop challenges" ON public.coop_challenges;
DROP POLICY IF EXISTS "Users can create a coop challenge" ON public.coop_challenges;
DROP POLICY IF EXISTS "Users can update their coop challenges" ON public.coop_challenges;

CREATE POLICY "Users can view their own coop challenges" ON public.coop_challenges
    FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create a coop challenge" ON public.coop_challenges
    FOR INSERT WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update their coop challenges" ON public.coop_challenges
    FOR UPDATE USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coop_challenges_initiator_id ON public.coop_challenges (initiator_id);
CREATE INDEX IF NOT EXISTS idx_coop_challenges_partner_id ON public.coop_challenges (partner_id);
CREATE INDEX IF NOT EXISTS idx_coop_challenges_question_id ON public.coop_challenges (question_id);

-- 5. Add challenge_id column to written_submissions (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'written_submissions'
        AND column_name = 'challenge_id'
    ) THEN
        ALTER TABLE public.written_submissions
        ADD COLUMN challenge_id UUID REFERENCES public.coop_challenges(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Done!
SELECT 'Migration complete ✅' AS result;
