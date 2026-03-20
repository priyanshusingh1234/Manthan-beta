-- ============================================================
-- Written Answer System for Manthan (Questions > 15 Points)
-- Run this entire script in your Supabase SQL editor
-- ============================================================

-- ⚠️  IMPORTANT: Before running this SQL, create a Storage Bucket:
--   1. Go to Supabase Dashboard → Storage → New Bucket
--   2. Name: written-answers
--   3. Public: YES (so images load without auth)
--   4. File size limit: 10MB
--   5. Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
-- ============================================================


-- 1. Teacher model solutions table
CREATE TABLE IF NOT EXISTS public.teacher_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  solution_path text NOT NULL,         -- Supabase storage path
  solution_url text,                   -- Public URL (optional cache)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(question_id)                  -- One model answer per question
);

CREATE INDEX IF NOT EXISTS idx_teacher_solutions_question_id ON public.teacher_solutions (question_id);
CREATE INDEX IF NOT EXISTS idx_teacher_solutions_teacher_id ON public.teacher_solutions (teacher_id);

-- 2. Student written submissions table
CREATE TABLE IF NOT EXISTS public.written_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  submission_path text NOT NULL,       -- Supabase storage path of student's uploaded answer
  submission_url text,                 -- Public/signed URL (optional cache)
  self_marked_correct boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'pending_check', 'points_given', 'flagged', 'teacher_confirmed_wrong', 'teacher_confirmed_correct')),
  points_awarded integer NOT NULL DEFAULT 0,   -- Points given on self-mark (provisional)
  checker_deadline timestamptz,               -- Set when student self-marks: now() + 5 minutes
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, question_id)            -- One submission per student per question
);

CREATE INDEX IF NOT EXISTS idx_written_submissions_question_id ON public.written_submissions (question_id);
CREATE INDEX IF NOT EXISTS idx_written_submissions_student_id ON public.written_submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_written_submissions_status ON public.written_submissions (status);
CREATE INDEX IF NOT EXISTS idx_written_submissions_checker_deadline ON public.written_submissions (checker_deadline);

-- 3. Checker votes table
CREATE TABLE IF NOT EXISTS public.checker_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.written_submissions(id) ON DELETE CASCADE,
  checker_id uuid NOT NULL,
  vote text NOT NULL CHECK (vote IN ('correct', 'wrong')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, checker_id)           -- One vote per checker per submission
);

CREATE INDEX IF NOT EXISTS idx_checker_votes_submission_id ON public.checker_votes (submission_id);
CREATE INDEX IF NOT EXISTS idx_checker_votes_checker_id ON public.checker_votes (checker_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.teacher_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.written_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checker_votes ENABLE ROW LEVEL SECURITY;

-- Teacher solutions: anyone can read, only teachers can insert via service role
CREATE POLICY "teacher_solutions_read" ON public.teacher_solutions FOR SELECT USING (true);

-- Written submissions: students can read their own, checkers see pending_check ones
CREATE POLICY "written_submissions_own_read" ON public.written_submissions FOR SELECT USING (true);

-- Checker votes: anyone can read
CREATE POLICY "checker_votes_read" ON public.checker_votes FOR SELECT USING (true);

-- ============================================================
-- ⚠️  MIGRATION: If you've already created the tables, run this
--     in your Supabase SQL editor to update the status constraint:
-- ============================================================
-- ALTER TABLE public.written_submissions
--   DROP CONSTRAINT IF EXISTS written_submissions_status_check;
-- ALTER TABLE public.written_submissions
--   ADD CONSTRAINT written_submissions_status_check
--   CHECK (status IN ('pending', 'pending_check', 'points_given', 'flagged', 'teacher_confirmed_wrong', 'teacher_confirmed_correct'));
