-- Run this query in your Supabase SQL Editor to add the required columns for School Avatar and Description.
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT 'shield';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS description TEXT;
