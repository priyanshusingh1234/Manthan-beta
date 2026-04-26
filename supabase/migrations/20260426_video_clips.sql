-- Add video clip support to posts table
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS video_url       TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;

-- Index for fetching clip-only posts (profile clips tab)
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts (author_id, created_at DESC)
  WHERE video_url IS NOT NULL;
