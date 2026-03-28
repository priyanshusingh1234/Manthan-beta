-- Add message column to coop_challenges so help request messages can be stored
ALTER TABLE public.coop_challenges
ADD COLUMN IF NOT EXISTS message TEXT;
