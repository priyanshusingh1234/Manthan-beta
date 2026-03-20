-- Create table for question attempts
-- Run this in Supabase SQL editor to track user attempts on questions

CREATE TABLE IF NOT EXISTS public.question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  selected_option integer,
  is_correct boolean,
  time_taken integer,
  started_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.question_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON public.question_attempts (question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_is_correct ON public.question_attempts (is_correct);
