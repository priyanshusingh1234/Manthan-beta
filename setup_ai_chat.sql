CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
ON public.ai_chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
ON public.ai_chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);
