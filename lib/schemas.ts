import { z } from 'zod'

// Expense schema for adding/editing expenses
export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(100),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.enum(['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer']),
  notes: z.string().optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>

// Income schema for adding/editing income
export const incomeSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  source: z.enum(['salary', 'freelance', 'investments', 'bonus', 'other']),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  status: z.enum(['confirmed', 'expected', 'possible']),
  notes: z.string().optional(),
})

export type IncomeInput = z.infer<typeof incomeSchema>

// Recurring expense schema
export const recurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.enum(['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']),
  frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly']),
  next_due_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  notes: z.string().optional(),
})

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>

// Budget schema
export const budgetSchema = z.object({
  category: z.enum(['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']),
  limit_amount: z.number().positive('Budget limit must be greater than 0'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
})

export type BudgetInput = z.infer<typeof budgetSchema>

// User preferences schema
export const preferencesSchema = z.object({
  currency: z.string().default('INR'),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications_enabled: z.boolean().optional(),
  income_type: z.enum(['salary', 'freelance', 'both', 'other']).optional(),
  financial_goal: z.string().optional(),
})

export type PreferencesInput = z.infer<typeof preferencesSchema>

// Affordability check schema
export const affordabilitySchema = z.object({
  purchase_amount: z.number().positive('Purchase amount must be greater than 0'),
  purchase_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  description: z.string().optional(),
})

export type AffordabilityInput = z.infer<typeof affordabilitySchema>
