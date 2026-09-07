/**
 * Client-side database query helpers
 * These functions are safe to use in 'use client' components
 */

import { createClient } from './supabase'
import {
  Transaction,
  Income,
  Expense,
  RecurringExpense,
  Budget,
} from './types'

const supabase = createClient()

type CategoryJoin = { name: string }

type IncomeDbRow = {
  id: string
  user_id: string
  amount: number
  title?: string | null
  description?: string | null
  date?: string | null
  income_date?: string | null
  created_at?: string | null
}

type ExpenseDbRow = {
  id: string
  user_id: string
  amount: number
  title?: string | null
  description?: string | null
  category?: string | null
  date?: string | null
  expense_date?: string | null
  payment_method?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type RecurringDbRow = {
  id: string
  user_id: string
  title?: string | null
  amount: number
  category_id?: string | null
  frequency?: string | null
  next_due_date?: string | null
  payment_method?: string | null
  notes?: string | null
  created_at?: string | null
  categories?: CategoryJoin | null
}

type BudgetDbRow = {
  id: string
  user_id: string
  amount: number
  category_id?: string | null
  month: number
  year: number
  created_at?: string | null
  categories?: CategoryJoin | null
}

/**
 * Get all transactions for the current user
 */
export async function getUserTransactionsClient(
  limit?: number
): Promise<Transaction[]> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error while fetching transactions:', JSON.stringify({
        message: authError.message,
        status: authError.status,
      }))
      return []
    }

    if (!user) {
      console.warn('No authenticated user found.')
      return []
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }))
      return []
    }

    return (data as Transaction[]) || []
  } catch (error) {
    console.error('Unexpected error fetching transactions:', error)
    return []
  }
}

/**
 * Get all income records for the current user
 */
export async function getUserIncomeClient(): Promise<Income[]> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error while fetching income:', JSON.stringify({
        message: authError.message,
        status: authError.status,
      }))
      return []
    }

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching income:', JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }))
      return []
    }

    return (data || []).map((row: IncomeDbRow) => ({
      id: row.id,
      user_id: row.user_id,
      amount: Number(row.amount) || 0,
      source: 'other',
      date: row.date || row.income_date || '',
      status: 'confirmed',
      notes: row.title || row.description || 'Income',
      created_at: row.created_at || '',
      updated_at: '',
    }))
  } catch (error) {
    console.error('Unexpected error fetching income:', error)
    return []
  }
}

/**
 * Get all expenses for the current user
 */
export async function getUserExpensesClient(): Promise<Expense[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error.message || error)
      return []
    }

    return (data || []).map((row: ExpenseDbRow) => ({
      id: row.id,
      user_id: row.user_id,
      amount: Number(row.amount) || 0,
      description: row.title || row.description || '',
      category: (row.category || 'other') as Expense['category'],
      date: row.date || row.expense_date || '',
      payment_method: (row.payment_method || undefined) as Expense['payment_method'],
      status: 'completed',
      created_at: row.created_at || '',
      updated_at: row.updated_at || '',
    }))
  } catch (error) {
    console.error('Unexpected error fetching expenses:', error)
    return []
  }
}

/**
 * Get all recurring expenses for the current user
 */
export async function getUserRecurringExpensesClient(): Promise<RecurringExpense[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*, categories(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recurring expenses:', error.message || error)
    return []
  }

  return (data || []).map((row: RecurringDbRow) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.title || 'Recurring',
    amount: Number(row.amount) || 0,
    category: (row.categories?.name || 'Other') as RecurringExpense['category'],
    frequency: row.frequency || 'monthly',
    next_due_date: row.next_due_date || '',
    payment_method: (row.payment_method || undefined) as RecurringExpense['payment_method'],
    notes: row.notes || undefined,
    created_at: row.created_at || '',
    updated_at: '',
  }))
}

/**
 * Add a new income record
 */
export async function addIncomeClient(
  income: Omit<Income, 'id' | 'created_at' | 'updated_at'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const incomeRecord = {
    user_id: user.id,
    amount: income.amount,
    title: income.notes || 'Income',
    date: income.date,
  }

  const results = await Promise.all([
    supabase.from('income').insert([incomeRecord]).select().single(),
  ])

  const error = results.find((r) => r.error)?.error

  if (error) {
    throw new Error(`Failed to add income: ${error.message}`)
  }

  return results[0].data
}

/**
 * Add a new expense record
 */
export async function addExpenseClient(
  expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const expenseRecord = {
    user_id: user.id,
    amount: expense.amount,
    title: expense.description || 'Expense',
    category: expense.category,
    date: expense.date,
    payment_method: expense.payment_method || 'other',
  }

  const results = await Promise.all([
    supabase.from('expenses').insert([expenseRecord]).select().single(),
  ])

  const error = results.find((r) => r.error)?.error

  if (error) {
    throw new Error(`Failed to add expense: ${error.message}`)
  }

  return results[0].data
}

/**
 * Update an expense record
 */
export async function updateExpenseClient(
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`)
  }

  return data
}

/**
 * Delete an expense record
 */
export async function deleteExpenseClient(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`)
  }
}

/**
 * Get budgets for a specific month
 */
export async function getBudgetsForMonthClient(
  month: string
): Promise<Budget[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)

  const { data, error } = await supabase
    .from('budgets')
    .select('*, categories(name)')
    .eq('user_id', user.id)
    .eq('month', monthNum)
    .eq('year', year)

  if (error) {
    console.error('Error fetching budgets:', error.message || error);
    return [];
  }

  return (data || []).map((row: BudgetDbRow) => ({
    id: row.id,
    user_id: row.user_id,
    category: row.categories?.name || 'Other',
    limit_amount: Number(row.amount) || 0,
    month: `${yearStr}-${String(monthNum).padStart(2, '0')}`,
    created_at: row.created_at || '',
    updated_at: '',
  }))
}

/**
 * Upsert a budget record
 */
export async function upsertBudgetClient(
  budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const [yearStr, monthStr] = budget.month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)

  const { data: catRows } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', budget.category)
    .limit(1)

  const category_id = catRows?.[0]?.id || null

  const { data, error } = await supabase
    .from('budgets')
    .upsert([
      {
        user_id: user.id,
        amount: budget.limit_amount,
        category_id,
        month: monthNum,
        year,
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save budget: ${error.message}`)
  }

  return data
}