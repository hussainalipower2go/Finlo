-- ============================================================================
-- Admin Dashboard (2026-09-07)
-- Additive, idempotent migration. Existing tables/data unchanged.
-- Apply with: supabase db push  (or paste into Supabase SQL editor)
--
-- After applying, promote an admin:
--   UPDATE public.profiles SET role = 'ADMIN' WHERE id = '<auth_users_id>';
-- (find a user's id via  SELECT id, email FROM auth.users;  )
-- ============================================================================

-- ━━ 1. Profiles: system-of-record for identity/admin columns ━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  currency VARCHAR(3) DEFAULT 'PKR',
  monthly_income NUMERIC(15,2) DEFAULT 0,
  role VARCHAR(10) NOT NULL DEFAULT 'USER',
  account_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('USER','ADMIN'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check CHECK (account_status IN ('ACTIVE','SUSPENDED','DELETED'));

-- Backfill profiles for every existing auth user (keeps role checks reliable).
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Auto-create a profile when a new user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep profiles.email/full_name in sync when auth user metadata changes.
CREATE OR REPLACE FUNCTION public.sync_profile_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', public.profiles.full_name),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_user();

-- ━━ 2. is_admin() helper (safe against RLS recursion) ━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.account_status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = required_role
      AND p.account_status = 'ACTIVE'
  );
$$;

-- Users must never change their own role / account_status via the client.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, currency, monthly_income) ON public.profiles TO authenticated;
GRANT SELECT (id, email, full_name, avatar_url, currency, monthly_income, role, account_status, last_active_at, created_at, updated_at) ON public.profiles TO authenticated;

-- ━━ 3. Admin tables ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_code TEXT,
  service VARCHAR(50) NOT NULL DEFAULT 'unknown',
  level VARCHAR(10) NOT NULL DEFAULT 'error' CHECK (level IN ('critical','error','warning')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','ignored')),
  note TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_errors_status ON system_errors(status);
CREATE INDEX IF NOT EXISTS idx_system_errors_service ON system_errors(service);
CREATE INDEX IF NOT EXISTS idx_system_errors_created ON system_errors(created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug_report','feature_request','general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created ON user_activity_logs(created_at DESC);

-- ━━ 4. Seed feature flags ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('sms_import_enabled', TRUE, 'Allow SMS bank import (Settings → SMS Bank Import)'),
  ('receipt_scanning_enabled', TRUE, 'Allow receipt scanning (extract-receipt endpoint)'),
  ('ai_assistant_enabled', TRUE, 'Allow the AI assistant chat'),
  ('csv_import_enabled', TRUE, 'Allow CSV import'),
  ('maintenance_mode', FALSE, 'Show a maintenance screen to end users (admins are never locked out)')
ON CONFLICT (key) DO NOTHING;

-- ━━ 5. Row Level Security (no USING (true)) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- profiles: owners see/update their own row; admins see/update any row.
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- system_errors: admin-only management; users may insert rows flagged to them
-- (server instrumentation uses the service role, so this is a convenience).
DROP POLICY IF EXISTS "system_errors_admin_all" ON public.system_errors;
CREATE POLICY "system_errors_admin_all" ON public.system_errors FOR ALL
  USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "system_errors_own_insert" ON public.system_errors;
CREATE POLICY "system_errors_own_insert" ON public.system_errors FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin() OR user_id IS NULL);

-- user_feedback: owners manage their own submissions; admins manage everything.
DROP POLICY IF EXISTS "feedback_own_select" ON public.user_feedback;
CREATE POLICY "feedback_own_select" ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "feedback_own_insert" ON public.user_feedback;
CREATE POLICY "feedback_own_insert" ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_own_update" ON public.user_feedback;
CREATE POLICY "feedback_own_update" ON public.user_feedback FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- feature_flags: readable by any signed-in user (needed by the clients);
-- writes happen through the service role only, so admins get UPDATE here too
-- (server routes still verify is_admin before mutating).
DROP POLICY IF EXISTS "flags_read" ON public.feature_flags;
CREATE POLICY "flags_read" ON public.feature_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flags_admin_update" ON public.feature_flags;
CREATE POLICY "flags_admin_update" ON public.feature_flags FOR UPDATE
  USING (public.is_admin());

-- admin_audit_logs: admins only (written via service role).
DROP POLICY IF EXISTS "audit_admin_select" ON public.admin_audit_logs;
CREATE POLICY "audit_admin_select" ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

-- user_activity_logs: owners see their own; admins see everything.
DROP POLICY IF EXISTS "activity_own_select" ON public.user_activity_logs;
CREATE POLICY "activity_own_select" ON public.user_activity_logs FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "activity_own_insert" ON public.user_activity_logs;
CREATE POLICY "activity_own_insert" ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ━━ 6. Security-definer grants so is_admin() can read roles for all users ━━
GRANT SELECT ON public.profiles TO service_role;
GRANT ALL ON public.system_errors TO service_role;
GRANT ALL ON public.user_feedback TO service_role;
GRANT ALL ON public.feature_flags TO service_role;
GRANT ALL ON public.admin_audit_logs TO service_role;
GRANT ALL ON public.user_activity_logs TO service_role;

-- ━━ 7. Admin settings (app name, support email, ...) ━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.admin_settings (key, value) VALUES
  ('app_name', '"Finlo"'::jsonb),
  ('support_email', '"support@finlo.app"'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_read_for_authenticated" ON public.admin_settings;
CREATE POLICY "settings_read_for_authenticated" ON public.admin_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "settings_admin_all" ON public.admin_settings;
CREATE POLICY "settings_admin_all" ON public.admin_settings FOR ALL
  USING (public.is_admin());

GRANT ALL ON public.admin_settings TO service_role;
