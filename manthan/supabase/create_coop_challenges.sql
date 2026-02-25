-- Create the coop_challenges table
CREATE TABLE IF NOT EXISTS public.coop_challenges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    initiator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'won', 'lost')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    partner_attempted BOOLEAN DEFAULT false NOT NULL,
    initiator_attempted_again BOOLEAN DEFAULT false NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '24 hours') NOT NULL
);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.coop_challenges
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- Enable Row Level Security (RLS)
ALTER TABLE public.coop_challenges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view challenges they are involved in (either as initiator or partner)
CREATE POLICY "Users can view their own coop challenges" ON public.coop_challenges
    FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

-- Policy: Users can create a challenge if they are the initiator
CREATE POLICY "Users can create a coop challenge" ON public.coop_challenges
    FOR INSERT WITH CHECK (auth.uid() = initiator_id);

-- Policy: Users can update a challenge they are involved in
CREATE POLICY "Users can update their coop challenges" ON public.coop_challenges
    FOR UPDATE USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

-- Policy: Users can delete a challenge they initiated
CREATE POLICY "Users can delete their initiated coop challenges" ON public.coop_challenges
    FOR DELETE USING (auth.uid() = initiator_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coop_challenges_initiator_id ON public.coop_challenges (initiator_id);
CREATE INDEX IF NOT EXISTS idx_coop_challenges_partner_id ON public.coop_challenges (partner_id);
CREATE INDEX IF NOT EXISTS idx_coop_challenges_question_id ON public.coop_challenges (question_id);
CREATE INDEX IF NOT EXISTS idx_coop_challenges_status ON public.coop_challenges (status);
