-- Add 7-day login bonus tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_bonus_day integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_claim_date text,
ADD COLUMN IF NOT EXISTS login_bonus_completed boolean NOT NULL DEFAULT false;
