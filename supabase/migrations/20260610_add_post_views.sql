-- Migration: Add views tracking to posts

-- 1. Add the views_count column if it doesn't already exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. Create the function to safely increment the views
CREATE OR REPLACE FUNCTION public.increment_post_views(p_post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_post_id;
$$;
