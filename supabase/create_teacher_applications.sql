-- Run this in Supabase SQL editor or with psql to create the teacher_applications table

CREATE TABLE IF NOT EXISTS public.teacher_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text,
  school text NOT NULL,
  school_email text,
  main_subject text NOT NULL,
  experience integer,
  bio text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer text,
  notified_at timestamptz
);

-- Optional index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON public.teacher_applications (status);
