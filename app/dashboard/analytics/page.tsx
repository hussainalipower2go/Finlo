'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Container, Skeleton, Badge } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { getUserExpensesClient } from '@/lib/database-client'
import { Expense } from '@/lib/types'

interface CategorySpending {
  category: string
  amount: number
  percentage: number
  icon: string
}

const categoryIcons: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  utilities: '💡',
  entertainment: '🎬',
  healthcare: '⚕️',
  shopping: '🛍️',
  other: '📦',
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuth, setHasAuth] = useState(false)
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([])
  const [month, setMonth] = useState(
    new Date().toISOString().split('T')[0].substring(0, 7)
  )

  const router = useRouter()
  const supabase = createClient()

  const loadAnalytics = useCallback(async () => {
    try {
      const expenses = await getUserExpensesClient()

      const monthDate = new Date(month)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

      const byCategory: Record<string, number> = {}

      expenses.forEach((e: Expense) => {
        if (
          e.status === 'completed' &&
          new Date(e.date) >= monthStart &&
          new Date(e.date) <= monthEnd
        ) {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
        }
      })

      const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0)

      const data: CategorySpending[] = Object.entries(byCategory)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          icon: categoryIcons[category] || '📦',
        }))
        .sort((a, b) => b.amount - a.amount)

      setCategoryData(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
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
      setHasAuth(true)
      loadAnalytics()
    }

    checkAuth()
  }, [supabase.auth, router, month, loadAnalytics])

  if (!hasAuth) return null

  const totalSpent = categoryData.reduce((sum, c) => sum + c.amount, 0)

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white">
          <Container className="py-6 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Analytics</h1>
                <p className="text-fuchsia-100 text-sm md:text-base">Understand your spending patterns</p>
              </div>
              <div className="text-4xl md:text-6xl">📈</div>
            </div>
          </Container>
        </div>

        <Container className="py-6 md:py-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
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

          {/* Summary */}
          <Card isGlass>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-2">Total Spent</p>
                <p className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white break-all">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-2">Categories</p>
                <p className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">
                  {categoryData.length}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-2">Avg per Category</p>
                <p className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white break-all">
                  ₹{categoryData.length > 0 ? Math.round(totalSpent / categoryData.length) : 0}
                </p>
              </div>
            </div>
          </Card>

          {/* Category Breakdown */}
          {isLoading ? (
            <Skeleton count={5} className="h-24" />
          ) : categoryData.length === 0 ? (
            <Card isGlass className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">No spending data for this month</p>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Spending by Category</h2>
              {categoryData.map((category) => (
                <Card key={category.category} isGlass>
                  <div className="space-y-2 md:space-y-3">
                    {/* Header */}
                    <div className="flex items-start md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <span className="text-xl md:text-2xl flex-shrink-0">{category.icon}</span>
                        <h3 className="font-bold text-slate-900 dark:text-white capitalize text-sm md:text-base truncate">
                          {category.category}
                        </h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">
                          ₹{category.amount.toLocaleString('en-IN')}
                        </p>
                        <Badge variant="info" className="text-xs md:text-sm">{Math.round(category.percentage)}%</Badge>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 md:h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Insights */}
          {categoryData.length > 0 && (
            <Card isGlass>
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">💡 Insights</h2>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  ✓ Your top spending is on{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {categoryData[0].category}
                  </span>{' '}
                  at {Math.round(categoryData[0].percentage)}% of total
                </p>
                {categoryData.length > 1 && (
                  <p>
                    ✓ {categoryData[1].category} is your second largest category at{' '}
                    {Math.round(categoryData[1].percentage)}%
                  </p>
                )}
                <p>
                  ✓ Your daily average spending is ₹
                  {Math.round(totalSpent / new Date(month + '-01').getDate()).toLocaleString('en-IN')}
                </p>
              </div>
            </Card>
          )}
        </Container>
      </div>
    </DashboardLayout>
  )
}
