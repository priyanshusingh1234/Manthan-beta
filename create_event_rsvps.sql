CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in', 'out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Allow users to insert/update their own RSVPs
CREATE POLICY "Users can insert their own RSVPs"
ON public.event_rsvps
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
ON public.event_rsvps
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own RSVPs"
ON public.event_rsvps
FOR SELECT
USING (auth.uid() = user_id);
