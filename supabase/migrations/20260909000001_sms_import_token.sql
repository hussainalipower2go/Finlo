-- ============================================================================
-- SMS Import: personal import token (2026-09-09)
-- Additive. Lets an external SMS-forwarder post to /api/import/sms with a
-- stable per-user token instead of a rotating Supabase session.
-- Apply with: supabase db push  (or paste into Supabase SQL editor)
-- ============================================================================

ALTER TABLE sms_import_settings
  ADD COLUMN IF NOT EXISTS import_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sms_import_token
  ON sms_import_settings(import_token)
  WHERE import_token IS NOT NULL;