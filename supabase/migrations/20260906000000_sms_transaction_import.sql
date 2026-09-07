-- ============================================================================
-- SMS Bank Transaction Import (2026-09-06)
-- Additive migration. Existing tables/data unchanged.
-- Apply with: supabase db push  (or paste into Supabase SQL editor)
-- ============================================================================

-- ── 1. Transactions: import provenance + metadata ───────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_last4 VARCHAR(10),
  ADD COLUMN IF NOT EXISTS merchant TEXT,
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS transaction_channel VARCHAR(50),
  ADD COLUMN IF NOT EXISTS external_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS parsing_confidence REAL,
  ADD COLUMN IF NOT EXISTS import_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_transactions_source
  ON transactions(user_id, source);

CREATE INDEX IF NOT EXISTS idx_transactions_external_id
  ON transactions(user_id, external_transaction_id)
  WHERE external_transaction_id IS NOT NULL;

-- DB-level duplicate guard for future providers
-- (SMS refs, bank API IDs, CSV hashes)
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_external
  ON transactions(user_id, external_transaction_id, source)
  WHERE external_transaction_id IS NOT NULL;


-- ── 2. SMS import settings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_import_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  import_mode VARCHAR(10) NOT NULL DEFAULT 'review'
    CHECK (import_mode IN ('review', 'auto')),
  auto_add_confidence REAL NOT NULL DEFAULT 0.9,
  notify_on_detect BOOLEAN NOT NULL DEFAULT TRUE,
  excluded_senders JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ── 3. Pending review queue ─────────────────────────────────────────────────
-- Parsed SMS awaiting user confirmation.
-- raw_sms_preview is a SHORT truncated preview (max 160 chars)
-- and should be deleted as soon as the record is resolved.

CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  sender TEXT,
  raw_sms_preview TEXT,

  amount DECIMAL(15,2),
  currency VARCHAR(3),

  transaction_type VARCHAR(10)
    CHECK (transaction_type IN ('DEBIT', 'CREDIT')),

  bank_name TEXT,
  account_last4 VARCHAR(10),
  merchant TEXT,

  transaction_date DATE,
  transaction_time VARCHAR(12),

  reference_number TEXT,
  transaction_channel VARCHAR(50),

  parsing_confidence REAL NOT NULL DEFAULT 0,

  suggested_category VARCHAR(50),

  duplicate_of UUID
    REFERENCES transactions(id)
    ON DELETE SET NULL,

  status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_user
  ON pending_transactions(user_id, status);


-- ── 4. Import history ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  provider VARCHAR(20) NOT NULL,

  message_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,

  status VARCHAR(20) NOT NULL DEFAULT 'processed',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_history_user
  ON import_history(user_id, created_at);


-- ── 5. Row Level Security (RLS) ─────────────────────────────────────────────

ALTER TABLE sms_import_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;


-- SMS Import Settings Policies

CREATE POLICY "Own sms settings select"
ON sms_import_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Own sms settings insert"
ON sms_import_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own sms settings update"
ON sms_import_settings
FOR UPDATE
USING (auth.uid() = user_id);


-- Pending Transactions Policies

CREATE POLICY "Own pending select"
ON pending_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Own pending insert"
ON pending_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own pending update"
ON pending_transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Own pending delete"
ON pending_transactions
FOR DELETE
USING (auth.uid() = user_id);


-- Import History Policies

CREATE POLICY "Own import history select"
ON import_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Own import history insert"
ON import_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);