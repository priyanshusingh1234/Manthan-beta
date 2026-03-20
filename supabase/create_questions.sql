-- Create table for questions
-- Run this in Supabase SQL editor to create the table used by the Create Question form

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  title text NOT NULL,
  body text,
  subject text NOT NULL,
  class_grade text NOT NULL,
  points integer NOT NULL,
  time_limit integer NOT NULL,
  difficulty text,
  options jsonb,
  correct_option integer,
  image_path text,
  image_url text,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_created_by ON public.questions (created_by);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions (subject);
CREATE INDEX IF NOT EXISTS idx_questions_class_grade ON public.questions (class_grade);