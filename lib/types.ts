export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          month: number
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          category_id: string | null
          created_at: string | null
          date: string | null
          description: string | null
          expense_date: string | null
          id: string
          is_recurring: boolean | null
          payment_method: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          id: string
          target_amount: number
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          target_amount: number
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          target_amount?: number
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          income_date: string | null
          is_recurring: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          income_date?: string | null
          is_recurring?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          income_date?: string | null
          is_recurring?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          full_name: string | null
          id: string
          monthly_income: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          monthly_income?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          monthly_income?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_import_settings: {
        Row: {
          user_id: string
          enabled: boolean
          import_mode: string
          auto_add_confidence: number
          notify_on_detect: boolean
          excluded_senders: Json | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          enabled?: boolean
          import_mode?: string
          auto_add_confidence?: number
          notify_on_detect?: boolean
          excluded_senders?: Json | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          enabled?: boolean
          import_mode?: string
          auto_add_confidence?: number
          notify_on_detect?: boolean
          excluded_senders?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_transactions: {
        Row: {
          id: string
          user_id: string
          sender: string | null
          raw_sms_preview: string | null
          amount: number | null
          currency: string | null
          transaction_type: string | null
          bank_name: string | null
          account_last4: string | null
          merchant: string | null
          transaction_date: string | null
          transaction_time: string | null
          reference_number: string | null
          transaction_channel: string | null
          parsing_confidence: number
          suggested_category: string | null
          duplicate_of: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          sender?: string | null
          raw_sms_preview?: string | null
          amount?: number | null
          currency?: string | null
          transaction_type?: string | null
          bank_name?: string | null
          account_last4?: string | null
          merchant?: string | null
          transaction_date?: string | null
          transaction_time?: string | null
          reference_number?: string | null
          transaction_channel?: string | null
          parsing_confidence?: number
          suggested_category?: string | null
          duplicate_of?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          sender?: string | null
          raw_sms_preview?: string | null
          amount?: number | null
          currency?: string | null
          transaction_type?: string | null
          bank_name?: string | null
          account_last4?: string | null
          merchant?: string | null
          transaction_date?: string | null
          transaction_time?: string | null
          reference_number?: string | null
          transaction_channel?: string | null
          parsing_confidence?: number
          suggested_category?: string | null
          duplicate_of?: string | null
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      import_history: {
        Row: {
          id: string
          user_id: string
          provider: string
          message_count: number
          created_count: number
          duplicate_count: number
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          message_count?: number
          created_count?: number
          duplicate_count?: number
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          message_count?: number
          created_count?: number
          duplicate_count?: number
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          next_due_date: string
          reminder_days: number | null
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          next_due_date: string
          reminder_days?: number | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          next_due_date?: string
          reminder_days?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          account_last4: string | null
          bank_name: string | null
          category: string | null
          created_at: string | null
          date: string
          description: string
          external_transaction_id: string | null
          id: string
          import_metadata: Json | null
          income_source: string | null
          merchant: string | null
          notes: string | null
          parsing_confidence: number | null
          payment_method: string | null
          reference_number: string | null
          source: string
          transaction_channel: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          account_last4?: string | null
          bank_name?: string | null
          category?: string | null
          created_at?: string | null
          date: string
          description: string
          external_transaction_id?: string | null
          id?: string
          import_metadata?: Json | null
          income_source?: string | null
          merchant?: string | null
          notes?: string | null
          parsing_confidence?: number | null
          payment_method?: string | null
          reference_number?: string | null
          source?: string
          transaction_channel?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          account_last4?: string | null
          bank_name?: string | null
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string
          external_transaction_id?: string | null
          id?: string
          import_metadata?: Json | null
          income_source?: string | null
          merchant?: string | null
          notes?: string | null
          parsing_confidence?: number | null
          payment_method?: string | null
          reference_number?: string | null
          source?: string
          transaction_channel?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// ── Expense Type ───────────────────────────────────────────────────────────────
export type Expense = {
  id: string
  user_id: string
  amount: number
  description: string
  category: ExpenseCategory
  date: string
  payment_method?: PaymentMethod
  status: ExpenseStatus
  notes?: string
  created_at: string
  updated_at: string
}

// ── Enums ────────────────────────────────────────────────────────────────────────

// ── Transaction Types ─────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense'

export type IncomeStatus = 'confirmed' | 'expected' | 'possible'

export type ExpenseStatus = 'completed' | 'planned'

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'rent'
  | 'utilities'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'subscriptions'
  | 'family'
  | 'travel'
  | 'other'

export type IncomeSource =
  | 'salary'
  | 'freelance'
  | 'business'
  | 'client_payment'
  | 'other'

export type PaymentMethod =
  | 'cash'
  | 'bank'
  | 'debit_card'
  | 'credit_card'
  | 'easypaisa'
  | 'jazzcash'
  | 'other'

export type Transaction = {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string
  category?: ExpenseCategory
  income_source?: IncomeSource
  date: string
  payment_method?: PaymentMethod
  notes?: string
  source?: ImportSource
  bank_name?: string | null
  account_last4?: string | null
  merchant?: string | null
  reference_number?: string | null
  transaction_channel?: string | null
  external_transaction_id?: string | null
  parsing_confidence?: number | null
  import_metadata?: Json | null
  created_at: string
  updated_at: string
}

// ── Import Provenance (transaction source) ──────────────────────────────────
export type ImportSource =
  | 'MANUAL'
  | 'AI_TEXT'
  | 'RECEIPT'
  | 'SMS'
  | 'CSV'
  | 'BANK_API'

export type Income = {
  id: string
  user_id: string
  amount: number
  source: IncomeSource
  date: string
  status: IncomeStatus
  notes?: string
  created_at: string
  updated_at: string
}

export type RecurringExpense = {
  id: string
  user_id: string
  name: string
  amount: number
  category: ExpenseCategory
  frequency: string
  next_due_date: string
  payment_method?: PaymentMethod
  notes?: string
  created_at: string
  updated_at: string
}

export type Budget = {
  id: string
  user_id: string
  category: string
  limit_amount: number
  month: string // YYYY-MM format
  created_at: string
  updated_at: string
}

// ── Installments ───────────────────────────────────────────────────────────────
export type InstallmentStatus = 'active' | 'completed' | 'cancelled'

export type Installment = {
  id: string
  user_id: string
  item_name: string
  total_price: number
  down_payment: number
  monthly_installment: number
  total_months: number
  total_interest: number
  paid_count: number
  next_due_date?: string | null
  frequency: string
  status: InstallmentStatus
  notes?: string | null
  created_at?: string
  updated_at?: string
}

// ── Enums ────────────────────────────────────────────────────────────────────────
export enum FinancialGoalStatus {
  Active = 'active',
  Completed = 'completed',
  Paused = 'paused',
}

// ── User Preferences ─────────────────────────────────────────────────────────────
export type UserPreferences = {
  id: string
  user_id: string
  currency: string
  theme: 'light' | 'dark' | 'system'
  notifications_enabled: boolean
  ai_enabled: boolean
  typical_monthly_income?: number
  income_type?: 'salary' | 'freelance' | 'business' | 'mixed'
  financial_goal?: string
  created_at: string
  updated_at: string
}

// ── Recurring Expense Frequency ────────────────────────────────────────────────
export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
