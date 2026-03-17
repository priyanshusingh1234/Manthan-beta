-- Run this in your Supabase SQL Editor to prepare for War Battle mechanics!

CREATE TABLE IF NOT EXISTS public.war_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    war_id UUID REFERENCES public.wars(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    submission_path TEXT,
    submission_url TEXT,
    status TEXT DEFAULT 'pending_check', -- 'pending_check', 'correct', 'incorrect'
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store the UUIDs of the questions picked by each faction's general
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS challenger_questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.wars ADD COLUMN IF NOT EXISTS defender_questions JSONB DEFAULT '[]'::jsonb;

-- RLS
ALTER TABLE public.war_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all on war_submissions"
  ON public.war_submissions FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON public.war_submissions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on student_id"
  ON public.war_submissions FOR UPDATE
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
