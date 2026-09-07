'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Container, GlassButton, Badge, Skeleton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { getUserTransactionsClient, deleteExpenseClient } from '@/lib/database-client'
import { useToast } from '@/components/providers/ToastProvider'
import { Transaction } from '@/lib/types'
import Link from 'next/link'

type FilterType = 'all' | 'income' | 'expense'
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuth, setHasAuth] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const applyFilters = useCallback(
    (
      txns: Transaction[],
      type: FilterType,
      sort: SortType,
      category: string
    ) => {
      let filtered = txns

      // Filter by type
      if (type !== 'all') {
        filtered = filtered.filter((t) => t.type === type)
      }

      // Filter by category
      if (category !== 'all' && category) {
        filtered = filtered.filter((t) => t.category === category)
      }

      // Sort
      switch (sort) {
        case 'oldest':
          filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          break
        case 'highest':
          filtered.sort((a, b) => b.amount - a.amount)
          break
        case 'lowest':
          filtered.sort((a, b) => a.amount - b.amount)
          break
        case 'newest':
        default:
          filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      setFilteredTransactions(filtered)
    },
    []
  )

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)

      try {
        const txns = await getUserTransactionsClient()
        setTransactions(txns)
        applyFilters(txns, filterType, sortType, selectedCategory)
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase.auth, router, applyFilters, filterType, sortType, selectedCategory])

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type)
    applyFilters(transactions, type, sortType, selectedCategory)
  }

  const handleSortChange = (sort: SortType) => {
    setSortType(sort)
    applyFilters(transactions, filterType, sort, selectedCategory)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    applyFilters(transactions, filterType, sortType, category)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await deleteExpenseClient(id)
      const updated = transactions.filter((t) => t.id !== id)
      setTransactions(updated)
      applyFilters(updated, filterType, sortType, selectedCategory)
      toast({
        type: 'success',
        message: 'Transaction deleted successfully',
      })
    } catch (error) {
      toast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete transaction',
      })
    }
  }

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: '🍔 Food' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'utilities', label: '💡 Utilities' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'healthcare', label: '⚕️ Healthcare' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'other', label: '📦 Other' },
  ]

  if (!hasAuth) return null

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Transactions</h1>
                <p className="text-blue-100">Showing {filteredTransactions.length} transactions</p>
              </div>
              <div className="text-6xl">📊</div>
            </div>
          </Container>
        </div>

        {/* Filters */}
        <Container className="py-6 md:py-8">
          <div className="space-y-4 md:space-y-6">
            {/* Type Filter */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm md:text-base">Type</h3>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'income', 'expense'] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type === 'all' ? '📊 All' : type === 'income' ? '📥 Income' : '📤 Expense'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Sort Filters - Stack on mobile, row on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm md:text-base">Category</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                    bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm md:text-base
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm md:text-base">Sort By</h3>
                <select
                  value={sortType}
                  onChange={(e) => handleSortChange(e.target.value as SortType)}
                  className="w-full px-3 md:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                    bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm md:text-base
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>
            </div>

            {/* Add buttons */}
            <div className="flex gap-3">
              <Link href="/dashboard/income/new" className="flex-1">
                <GlassButton className="w-full">💵 Add Income</GlassButton>
              </Link>
              <Link href="/dashboard/expenses/new" className="flex-1">
                <GlassButton variant="secondary" className="w-full">
                  💳 Add Expense
                </GlassButton>
              </Link>
            </div>
          </div>
        </Container>

        {/* Transactions List */}
        <Container className="py-6 md:py-8 pb-24 md:pb-8">
          {isLoading ? (
            <Skeleton count={5} className="h-20" />
          ) : filteredTransactions.length === 0 ? (
            <Card isGlass className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No transactions found</p>
              <Link href="/dashboard/expenses/new">
                <GlassButton>Add Your First Expense</GlassButton>
              </Link>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                          Date
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                          Description
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                          Category
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                          Amount
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                          Method
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((txn) => (
                        <tr
                          key={txn.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-700 dark:text-slate-300">
                            {new Date(txn.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-slate-900 dark:text-white">
                            {txn.description}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <Badge variant={txn.type === 'income' ? 'success' : 'warning'}>
                              {txn.category}
                            </Badge>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-right text-slate-900 dark:text-white">
                            Rs. {txn.amount.toLocaleString('en-PK')}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {txn.payment_method}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                            <button
                              onClick={() => handleDelete(txn.id)}
                              className="text-red-600 hover:text-red-700 dark:hover:text-red-400 font-medium text-xs md:text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredTransactions.map((txn) => (
                  <Card key={txn.id} isGlass className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {txn.description}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {new Date(txn.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === 'income' ? '+' : '-'}Rs. {txn.amount.toLocaleString('en-PK')}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="space-y-1 flex-1">
                          <Badge variant={txn.type === 'income' ? 'success' : 'warning'} className="text-xs">
                            {txn.category}
                          </Badge>
                          <p className="text-xs text-slate-600 dark:text-slate-400 ml-2">
                            {txn.payment_method}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="text-red-600 hover:text-red-700 dark:hover:text-red-400 font-medium text-xs px-3 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Container>
      </div>
    </DashboardLayout>
  )
}
