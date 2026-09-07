'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Container, GlassButton, Badge, Skeleton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { getUserRecurringExpensesClient } from '@/lib/database-client'
import { useToast } from '@/components/providers/ToastProvider'
import { RecurringExpense } from '@/lib/types'
import Link from 'next/link'

export default function RecurringExpensesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuth, setHasAuth] = useState(false)
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)

      try {
        const recurring = await getUserRecurringExpensesClient()
        setRecurringExpenses(recurring)
      } catch (error) {
        console.error('Error loading recurring expenses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase.auth, router])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring expense?')) return

    try {
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
      if (error) throw error

      const updated = recurringExpenses.filter((r) => r.id !== id)
      setRecurringExpenses(updated)
      toast({
        type: 'success',
        message: 'Recurring expense deleted',
      })
    } catch (error) {
      toast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete',
      })
    }
  }

  const getNextOccurrences = (nextDueDate: string, frequency: string) => {
    const dates = [nextDueDate]
    const date = new Date(nextDueDate)

    for (let i = 0; i < 2; i++) {
      switch (frequency) {
        case 'daily':
          date.setDate(date.getDate() + 1)
          break
        case 'weekly':
          date.setDate(date.getDate() + 7)
          break
        case 'bi-weekly':
          date.setDate(date.getDate() + 14)
          break
        case 'monthly':
          date.setMonth(date.getMonth() + 1)
          break
        case 'quarterly':
          date.setMonth(date.getMonth() + 3)
          break
        case 'yearly':
          date.setFullYear(date.getFullYear() + 1)
          break
      }
      dates.push(date.toISOString().split('T')[0])
    }

    return dates
  }

  if (!hasAuth) return null

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Recurring Expenses</h1>
                <p className="text-purple-100">Manage your regular payments</p>
              </div>
              <div className="text-6xl">🔄</div>
            </div>
          </Container>
        </div>

        <Container className="py-8 space-y-8">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card isGlass>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {recurringExpenses.length}
                </div>
                <p className="text-slate-600 dark:text-slate-400">Active Recurring</p>
              </div>
            </Card>

            <Card isGlass>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  ₹{recurringExpenses
                    .reduce((sum, r) => sum + r.amount, 0)
                    .toLocaleString('en-IN')}
                </div>
                <p className="text-slate-600 dark:text-slate-400">Monthly Total</p>
              </div>
            </Card>

            <Link href="/dashboard/recurring/new" className="w-full">
              <Card isGlass className="cursor-pointer hover:shadow-lg transition-all h-full flex items-center justify-center">
                <button className="w-full text-center">
                  <div className="text-3xl mb-2">➕</div>
                  <p className="font-medium text-slate-900 dark:text-white">Add Recurring</p>
                </button>
              </Card>
            </Link>
          </div>

          {/* List */}
          {isLoading ? (
            <Skeleton count={3} className="h-32" />
          ) : recurringExpenses.length === 0 ? (
            <Card isGlass className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No recurring expenses yet</p>
              <Link href="/dashboard/recurring/new">
                <GlassButton>Add Recurring Expense</GlassButton>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {recurringExpenses.map((recurring) => (
                <Card key={recurring.id} isGlass>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">🔄</div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{recurring.name}</h3>
                          <Badge variant="info" className="mt-1">
                            {recurring.frequency}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Amount</p>
                          <p className="font-bold text-red-600 dark:text-red-400">
                            ₹{recurring.amount.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Category</p>
                          <p className="font-medium text-slate-900 dark:text-white capitalize">
                            {recurring.category}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Next Due</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {new Date(recurring.next_due_date).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Next 3 Due Dates</p>
                          <div className="space-y-1">
                            {getNextOccurrences(recurring.next_due_date, recurring.frequency).map((date, i) => (
                              <p key={i} className="text-xs text-slate-500 dark:text-slate-500">
                                {new Date(date).toLocaleDateString()}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(recurring.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </div>
    </DashboardLayout>
  )
}
