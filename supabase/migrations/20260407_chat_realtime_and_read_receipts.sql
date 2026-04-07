-- Chat realtime and read receipt fixes
-- Run this in Supabase SQL editor or via migration tooling.

ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can update messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can update messages in their rooms" ON public.chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()
        )
    );
