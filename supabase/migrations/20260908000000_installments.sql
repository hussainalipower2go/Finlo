-- ============================================================================
-- Installment Plans (2026-09-08)
-- Track purchases bought on installments + upcoming payment alerts.
-- Additive migration. Existing tables/data unchanged.
-- Apply with: supabase db push  (or paste into Supabase SQL editor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  item_name TEXT NOT NULL,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  down_payment DECIMAL(15,2) NOT NULL DEFAULT 0,
  monthly_installment DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_months INTEGER NOT NULL DEFAULT 1,
  total_interest DECIMAL(15,2) NOT NULL DEFAULT 0,

  paid_count INTEGER NOT NULL DEFAULT 0,
  next_due_date DATE,
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_installments_user
  ON installments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_installments_next_due
  ON installments(user_id, next_due_date)
  WHERE status = 'active';


ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own installments select"
ON installments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Own installments insert"
ON installments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own installments update"
ON installments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Own installments delete"
ON installments
FOR DELETE
USING (auth.uid() = user_id);
