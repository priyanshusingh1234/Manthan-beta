-- Allow users to delete their own messages ("Delete for Everyone" functionality)
CREATE POLICY "Users can delete their own messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = sender_id);
