-- ============================================================================
-- Web Push Subscriptions (2026-09-09)
-- Store PushManager subscriptions so the app can send PWA home-screen
-- notifications (due/overdue payments) even while the app is closed.
-- Additive migration. Apply with: supabase db push (or SQL editor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id);


ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own push subscriptions select"
ON push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Own push subscriptions insert"
ON push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own push subscriptions delete"
ON push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);