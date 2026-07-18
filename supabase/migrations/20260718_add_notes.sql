-- Add document_url to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Create note_annotations table
CREATE TABLE IF NOT EXISTS public.note_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    annotations JSONB DEFAULT '{}'::jsonb,
    last_read_page INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- RLS for note_annotations
ALTER TABLE public.note_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own annotations"
    ON public.note_annotations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations"
    ON public.note_annotations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
    ON public.note_annotations FOR UPDATE
    USING (auth.uid() = user_id);
