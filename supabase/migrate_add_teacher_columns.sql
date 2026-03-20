-- Migration: ensure `teacher_applications` has expected columns
-- Run this in Supabase SQL editor (or via psql) to add any columns missing from older schemas.

ALTER TABLE IF EXISTS public.teacher_applications
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS school_email text,
  ADD COLUMN IF NOT EXISTS main_subject text,
  ADD COLUMN IF NOT EXISTS experience integer,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- Optional: ensure index exists for admin filtering by status
CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON public.teacher_applications (status);

-- Quick verification (run separately if you like):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teacher_applications';
