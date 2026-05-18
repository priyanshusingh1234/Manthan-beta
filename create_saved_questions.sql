-- Run this script in the Supabase SQL Editor to create the saved_questions table

CREATE TABLE IF NOT EXISTS public.saved_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own saved questions" ON public.saved_questions;
CREATE POLICY "Users can manage their own saved questions" ON public.saved_questions
  FOR ALL USING (auth.uid() = user_id);

-- Optional: Create an index for faster lookups when checking if a user saved a question
CREATE INDEX IF NOT EXISTS saved_questions_user_id_idx ON public.saved_questions(user_id);

-- Performance index for the Solved page
CREATE INDEX IF NOT EXISTS question_attempts_user_id_created_at_idx ON public.question_attempts(user_id, created_at DESC);
