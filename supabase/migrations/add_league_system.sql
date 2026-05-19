-- Add monthly points tracking for league system
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_points_month text; -- stored as 'YYYY-MM'
