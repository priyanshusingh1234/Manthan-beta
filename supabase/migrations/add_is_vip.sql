-- Run this in Supabase Dashboard → SQL Editor
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_questions_is_vip ON questions(is_vip) WHERE is_vip = true;
