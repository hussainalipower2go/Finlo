/**
 * Shared admin data types.
 * Keep in sync with the table shapes defined in
 * supabase/migrations/20260907000000_admin_dashboard.sql
 */

export type UserRole = 'USER' | 'ADMIN'
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'
export type ErrorStatus = 'open' | 'resolved' | 'ignored'
export type ErrorLevel = 'critical' | 'error' | 'warning'
export type FeedbackType = 'bug_report' | 'feature_request' | 'general'
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  currency: string | null
  monthly_income: number | null
  role: UserRole
  account_status: AccountStatus
  last_active_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  account_status: AccountStatus
  created_at: string
  last_sign_in_at: string | null
  currency: string | null
  avatar_url: string | null
  monthly_income: number | null
  transaction_count: number
  has_data: boolean
}

export interface AuditLogRow {
  id: string
  admin_user_id: string
  admin_email?: string | null
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface ErrorLogRow {
  id: string
  user_id: string | null
  error_code: string | null
  service: string
  level: ErrorLevel
  message: string
  stack_trace: string | null
  metadata: Record<string, unknown>
  status: ErrorStatus
  note: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface FeedbackRow {
  id: string
  user_id: string
  user_email?: string | null
  type: FeedbackType
  title: string
  message: string
  status: FeedbackStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface FlagRow {
  key: string
  enabled: boolean
  description: string
  updated_at: string
}

export type AdminAction =
  | 'suspend'
  | 'reactivate'
  | 'promote'
  | 'demote'
  | 'deactivate'