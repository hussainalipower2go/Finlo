'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Container, Badge, Skeleton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { getBudgetsForMonthClient, getUserExpensesClient, upsertBudgetClient } from '@/lib/database-client'
import { Expense, ExpenseCategory } from '@/lib/types'
import { useToast } from '@/components/providers/ToastProvider'


interface BudgetWithSpending {
  id: string
  category: string
  limit_amount: number
  month: string
  spent: number
  percentUsed: number
  user_id?: string
  created_at?: string
  updated_at?: string
}

export default function BudgetsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([])
  const [month, setMonth] = useState(
    new Date().toISOString().split('T')[0].substring(0, 7)
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState(0)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const loadBudgets = useCallback(async () => {
    try {
      const [budgetData, expenses] = await Promise.all([
        getBudgetsForMonthClient(month),
        getUserExpensesClient(),
      ])

      const categories = ['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']
      const monthDate = new Date(month)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

      const budgetsWithSpending: BudgetWithSpending[] = categories.map((category) => {
        const budget = budgetData.find((b) => b.category === category)
        const spent = expenses
          .filter(
            (e: Expense) =>
              e.category === category &&
              e.status === 'completed' &&
              new Date(e.date) >= monthStart &&
              new Date(e.date) <= monthEnd
          )
          .reduce((sum, e) => sum + e.amount, 0)

        const limitAmount = budget?.limit_amount || 0
        const percentUsed = limitAmount > 0 ? (spent / limitAmount) * 100 : 0

        return {
          id: budget?.id || '',
          category,
          limit_amount: limitAmount,
          month,
          spent,
          percentUsed: Math.min(percentUsed, 100),
          created_at: budget?.created_at || new Date().toISOString(),
          updated_at: budget?.updated_at || new Date().toISOString(),
        }
      })

      setBudgets(budgetsWithSpending)
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }, [month])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      loadBudgets()
    }

    checkAuth()
  }, [supabase.auth, router, month, loadBudgets])

  const handleSaveBudget = async (category: string, amount: number) => {
    try {
      if (amount < 0) {
        toast({ type: 'error', message: 'Budget must be positive' })
        return
      }

      await upsertBudgetClient({
        category: category as ExpenseCategory,
        limit_amount: amount,
        month,
      })

      toast({
        type: 'success',
        message: `Budget for ${category} updated!`,
      })

      setEditingId(null)
      loadBudgets()
    } catch (error) {
      toast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save budget',
      })
    }
  }

  const getStatusColor = (percentUsed: number) => {
    if (percentUsed >= 100) return 'danger'
    if (percentUsed >= 80) return 'warning'
    return 'success'
  }

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
          <Container className="py-6 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Budgets</h1>
                <p className="text-indigo-100 text-sm md:text-base">Set and track spending limits</p>
              </div>
              <div className="text-4xl md:text-6xl">💰</div>
            </div>
          </Container>
        </div>

        <Container className="py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Month Selector */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <label className="font-semibold text-slate-900 dark:text-white text-sm md:text-base">Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 md:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm md:text-base w-full md:w-auto"
            />
          </div>

          {/* Budgets Grid */}
          {isLoading ? (
            <Skeleton count={3} className="h-32" />
          ) : (
            <div className="space-y-3 md:space-y-4">
              {budgets.map((budget) => (
                <Card key={budget.category} isGlass>
                  <div className="space-y-3 md:space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white capitalize text-sm md:text-lg">
                        {budget.category}
                      </h3>
                      <Badge variant={getStatusColor(budget.percentUsed)} className="text-xs md:text-sm">
                        {Math.round(budget.percentUsed)}%
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          budget.percentUsed >= 100
                            ? 'bg-red-500'
                            : budget.percentUsed >= 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Spent</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                          ₹{budget.spent.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Budget</p>
                        {editingId === budget.category ? (
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(parseFloat(e.target.value))}
                            className="w-full px-2 py-1 text-center text-sm md:text-base border border-slate-300 dark:border-slate-600 rounded"
                            autoFocus
                          />
                        ) : (
                          <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                            ₹{budget.limit_amount.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Remaining</p>
                        <p
                          className={`font-bold text-sm md:text-base ${
                            budget.spent > budget.limit_amount
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          ₹{Math.max(0, budget.limit_amount - budget.spent).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 flex-col md:flex-row">
                      {editingId === budget.category ? (
                        <>
                          <button
                            onClick={() => handleSaveBudget(budget.category, editAmount)}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs md:text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-3 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors text-xs md:text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(budget.category)
                            setEditAmount(budget.limit_amount)
                          }}
                          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Edit Budget
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          <Card isGlass>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Summary</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Budget</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  ₹{budgets.reduce((sum, b) => sum + b.limit_amount, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  ₹{budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </Card>
        </Container>
      </div>
    </DashboardLayout>
  )
}
