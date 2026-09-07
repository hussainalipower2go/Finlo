/**
 * Database query helpers for financial data
 * These functions handle data retrieval with proper error handling
 */

import { createClient } from './supabase-server'
import { Transaction, Income, Expense, RecurringExpense, Budget } from './types'

/**
 * Get all transactions for the current user
 */
export async function getUserTransactions(
  limit?: number
): Promise<Transaction[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

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
    console.error('Error fetching transactions:', error)
    return []
  }

  return data || []
}

/**
 * Get all income records for the current user
 */
export async function getUserIncome(): Promise<Income[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching income:', error)
    return []
  }

  return data || []
}

/**
 * Get all expenses for the current user
 */
export async function getUserExpenses(): Promise<Expense[]> {
  const supabase = await createClient()
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
    console.error('Error fetching expenses:', error)
    return []
  }

  return data || []
}

/**
 * Get all recurring expenses for the current user
 */
export async function getUserRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recurring expenses:', error)
    return []
  }

  return data || []
}

/**
 * Get current user's preferences
 */
export async function getUserPreferences() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching preferences:', error)
  }

  return data || null
}

/**
 * Add a new income record
 */
export async function addIncome(income: Omit<Income, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('income')
    .insert([income])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add income: ${error.message}`)
  }

  return data
}

/**
 * Add a new expense record
 */
export async function addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add expense: ${error.message}`)
  }

  return data
}

/**
 * Update an expense record
 */
export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>
) {
  const supabase = await createClient()

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
export async function deleteExpense(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`)
  }
}

/**
 * Get budgets for a specific month
 */
export async function getBudgetsForMonth(month: string): Promise<Budget[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', month)
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching budgets:', error)
    return []
  }

  return data || []
}

/**
 * Upsert a budget record
 */
export async function upsertBudget(budget: Omit<Budget, 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('budgets')
    .upsert([
      {
        ...budget,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save budget: ${error.message}`)
  }

  return data
}
