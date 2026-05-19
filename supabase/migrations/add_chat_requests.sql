-- Add status column to chat_rooms for message requests
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Index for querying pending requests faster
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON public.chat_rooms(status);
