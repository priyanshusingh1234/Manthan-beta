-- Create push_subscriptions table (if not already created by web app setup)
-- This table stores FCM tokens (native) and web push endpoints (web)
-- The createNotification.ts backend reads from this table to send push notifications.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,  -- 'native' for FCM tokens, actual key for web push
  auth_key TEXT NOT NULL,    -- 'native' for FCM tokens, actual key for web push
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own push subscriptions
CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
