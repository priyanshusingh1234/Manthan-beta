-- Call invites: durable DB-backed signaling for Agora calls.
-- This replaces fragile broadcast-only call-invite delivery with a
-- postgres row that survives missed Realtime broadcasts and lets
-- GlobalCallListener subscribe via postgres_changes instead of broadcast.

CREATE TABLE IF NOT EXISTS public.call_invites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT        NOT NULL,
  caller_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('voice', 'video')),
  status      TEXT        NOT NULL DEFAULT 'ringing'
                           CHECK (status IN ('ringing', 'accepted', 'declined', 'ended', 'missed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Row-level security
ALTER TABLE public.call_invites ENABLE ROW LEVEL SECURITY;

-- Caller can create an invite
CREATE POLICY "Caller can insert call invite"
  ON public.call_invites
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Both parties can read their own invites
CREATE POLICY "Participants can view their call invites"
  ON public.call_invites
  FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Both parties can update the invite (caller ends, receiver accepts/declines)
CREATE POLICY "Participants can update their call invites"
  ON public.call_invites
  FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Enable Supabase Realtime for postgres_changes subscriptions
ALTER TABLE public.call_invites REPLICA IDENTITY FULL;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_invites;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
