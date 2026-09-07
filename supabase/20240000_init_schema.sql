-- ============================================================
-- Finlo V1 Supabase Schema Initialization
-- ============================================================
-- This file creates all tables, indexes, and RLS policies
-- Run this via the Supabase SQL Editor or migration system
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- User Preferences Table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency VARCHAR(3) DEFAULT 'PKR',
  theme VARCHAR(10) DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  ai_enabled BOOLEAN DEFAULT TRUE,
  typical_monthly_income DECIMAL(15, 2),
  income_type VARCHAR(50),
  financial_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- ============================================================
-- Transactions Table
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  income_source VARCHAR(50),
  date DATE NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);

-- ============================================================
-- Income Table
-- ============================================================
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  source VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'expected' CHECK (status IN ('confirmed', 'expected', 'possible')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for income
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_income_date ON income(date);

-- ============================================================
-- Expenses Table
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'planned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for expenses
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================================
-- Recurring Expenses Table
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_date DATE NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for recurring_expenses
CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);

-- ============================================================
-- Budgets Table
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  limit_amount DECIMAL(15, 2) NOT NULL,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, month)
);

-- Indexes for budgets
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- ============================================================
-- AI Conversations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ai_conversations
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);

-- ============================================================
-- AI Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ai_messages
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- User Preferences Policies
-- ============================================================
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Transactions Policies
-- ============================================================
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Income Policies
-- ============================================================
CREATE POLICY "Users can view their own income"
  ON income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income"
  ON income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income"
  ON income FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income"
  ON income FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Expenses Policies
-- ============================================================
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Recurring Expenses Policies
-- ============================================================
CREATE POLICY "Users can view their own recurring expenses"
  ON recurring_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses"
  ON recurring_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses"
  ON recurring_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
  ON recurring_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Budgets Policies
-- ============================================================
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- AI Conversations Policies
-- ============================================================
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AI Messages Policies
-- ============================================================
CREATE POLICY "Users can view their own messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- End of Schema Initialization
-- ============================================================