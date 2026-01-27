-- SQL migration: create teacher_applications table
-- Run this in Supabase SQL editor or via psql connected to your database

CREATE TABLE IF NOT EXISTS public.teacher_applications (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  name text NOT NULL,
  main_subject text NOT NULL,
  school text,
  social_handle text,
  proof_url text,
  proof_path text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Optional index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON public.teacher_applications(status);
