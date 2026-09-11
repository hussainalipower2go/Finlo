'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Container, Skeleton, Badge } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { getUserExpensesClient, getUserRecurringExpensesClient } from '@/lib/database-client'
import { Expense, RecurringExpense } from '@/lib/types'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UpcomingBill {
  id: string
  name: string
  amount: number
  dueDate: string
  category: string
  type: 'expense' | 'recurring'
  isOverdue: boolean
  isPaid: boolean
}

export default function UpcomingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAuth, setHasAuth] = useState(false)
  const [bills, setBills] = useState<UpcomingBill[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddRecurring, setShowAddRecurring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', frequency: 'monthly', category: 'other', next_due_date: '', error: '' })

  const router = useRouter()
  const supabase = createClient()

  const categoryNames: Record<string, string> = { food: 'Food', transport: 'Transport', utilities: 'Utilities', entertainment: 'Entertainment', shopping: 'Shopping', health: 'Health', subscriptions: 'Subscriptions', rent: 'Rent', family: 'Family', travel: 'Travel', education: 'Education', other: 'Other' }

  const addRecurringExpense = async () => {
    const amt = Number(form.amount.replace(/,/g, ''))
    if (!form.title.trim()) { setForm((f) => ({ ...f, error: 'Enter an expense name' })); return }
    if (!amt || amt <= 0) { setForm((f) => ({ ...f, error: 'Enter a valid amount' })); return }
    const due = form.frequency === 'daily' ? new Date().toISOString().slice(0, 10) : form.next_due_date
    if (!due) { setForm((f) => ({ ...f, error: 'Choose a due date' })); return }
    setSaving(true)
    setForm((f) => ({ ...f, error: '' }))
    try {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) throw new Error('Not authenticated')
      const { data: catRows } = await supabase.from('categories').select('id').ilike('name', categoryNames[form.category] || 'Other').limit(1)
      const { error } = await supabase.from('recurring_expenses').insert([{
        user_id: uid,
        title: form.title.trim(),
        amount: amt,
        frequency: form.frequency,
        category_id: catRows?.[0]?.id || null,
        next_due_date: due,
      }])
      if (error) throw new Error(error.message)
      setShowAddRecurring(false)
      setForm({ title: '', amount: '', frequency: 'monthly', category: 'other', next_due_date: '', error: '' })
    } catch (error) {
      setForm((f) => ({ ...f, error: error instanceof Error ? error.message : 'Could not add' }))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (bill: UpcomingBill) => {
    if (!confirm(`Delete "${bill.name}"?`)) return
    setDeletingId(bill.id)
    try {
      const table = bill.type === 'recurring' ? 'recurring_expenses' : 'expenses'
      await supabase.from(table).delete().eq('id', bill.id).throwOnError()
      setBills((prev) => prev.filter((b) => b.id !== bill.id))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not delete')
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkPaid = async (bill: UpcomingBill) => {
    if (!confirm(`Mark "${bill.name}" as paid?`)) return
    setDeletingId(bill.id)
    try {
      if (bill.type === 'recurring') {
        const { data } = await supabase
          .from('recurring_expenses')
          .select('frequency, next_due_date')
          .eq('id', bill.id)
          .single()
        const freqDays: Record<string, number> = { daily: 1, weekly: 7, 'bi-weekly': 14, monthly: 30, quarterly: 90, yearly: 365 }
        const days = freqDays[data?.frequency || 'monthly'] || 30
        const base = data?.next_due_date ? new Date(data.next_due_date) : new Date()
        const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        await supabase.from('recurring_expenses').update({ next_due_date: next }).eq('id', bill.id).throwOnError()
      } else {
        await supabase.from('expenses').update({ status: 'completed' }).eq('id', bill.id).throwOnError()
      }
      setBills((prev) => prev.filter((b) => b.id !== bill.id))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not mark as paid')
    } finally {
      setDeletingId(null)
    }
  }

  const load = useCallback(async () => {
    try {
      const [expenses, recurring] = await Promise.all([
        getUserExpensesClient(),
        getUserRecurringExpensesClient(),
      ])

      const upcomingBills: UpcomingBill[] = []
      const today = new Date()
      const curMonth = today.toISOString().slice(0, 7)

      const isPaidBill = (name: string, amount: number) => {
        const lowName = name.toLowerCase()
        if (lowName.length < 3) return false
        return expenses.some((e: Expense) => {
          if ((e.date || "").slice(0, 7) !== curMonth) return false
          const eName = (e.description || "").toLowerCase()
          if (!(eName.includes(lowName) || lowName.includes(eName))) return false
          if (Math.abs(e.amount - amount) > 5) return false
          return true
        })
      }

      expenses
        .filter((e: Expense) => e.status === 'planned')
        .forEach((e: Expense) => {
          const dueDate = new Date(e.date)
          upcomingBills.push({
            id: e.id,
            name: e.description,
            amount: e.amount,
            dueDate: e.date,
            category: e.category,
            type: 'expense',
            isOverdue: dueDate < today,
            isPaid: isPaidBill(e.description, e.amount),
          })
        })

      recurring.forEach((r: RecurringExpense) => {
        const nextDate = new Date(r.next_due_date)
        if (nextDate >= today || nextDate.getTime() < today.getTime() + 30 * 24 * 60 * 60 * 1000) {
          upcomingBills.push({
            id: r.id,
            name: r.name,
            amount: r.amount,
            dueDate: r.next_due_date,
            category: r.category,
            type: 'recurring',
            isOverdue: nextDate < today,
            isPaid: isPaidBill(r.name, r.amount),
          })
        }
      })

      upcomingBills.sort((a, b) => {
        if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      setBills(upcomingBills)
    } catch (error) {
      console.error('Error loading upcoming:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/auth/login')
        return
      }
      setHasAuth(true)
      load()
    }

    checkAuth()
  }, [supabase.auth, router, load])

  useEffect(() => {
    if (!hasAuth) return
    let channel: RealtimeChannel | null = null

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      const c = supabase.channel("upcoming-realtime")
      c.on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${uid}` }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "recurring_expenses", filter: `user_id=eq.${uid}` }, () => load())
        .subscribe()
      channel = c
    })

    const poll = setInterval(() => {
      load()
    }, 3000)

    return () => {
      clearInterval(poll)
      if (channel) supabase.removeChannel(channel)
    }
  }, [hasAuth, supabase, load])

  const totalUpcoming = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0)
  const overdueBills = bills.filter((b) => !b.isPaid && b.isOverdue)
  const upcomingBills = bills.filter((b) => !b.isPaid && !b.isOverdue)
  const paidBills = bills.filter((b) => b.isPaid)

  if (!hasAuth) return null

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Upcoming Bills</h1>
                <p className="text-orange-100">Never miss a payment again</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-6xl">📅</div>
                <button
                  onClick={() => setShowAddRecurring(true)}
                  className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-colors"
                >
                  + Add Recurring
                </button>
              </div>
            </div>
          </Container>
        </div>

        <Container className="py-8 space-y-8">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card isGlass>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Upcoming</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  Rs. {totalUpcoming.toLocaleString('en-PK')}
                </p>
              </div>
            </Card>

            <Card isGlass>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {upcomingBills.length}
                </p>
              </div>
            </Card>

            <Card isGlass>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Paid</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{paidBills.length}</p>
              </div>
            </Card>
          </div>

          {/* Bills List */}
          {isLoading ? (
            <Skeleton count={5} className="h-24" />
          ) : bills.length === 0 ? (
            <Card isGlass className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No upcoming bills</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {overdueBills.length > 0 && (
                <div>
                  <h3 className="font-bold text-red-600 dark:text-red-400 mb-3">⚠️ Overdue</h3>
                  {overdueBills.map((bill) => (
                    <Card key={bill.id} isGlass className="mb-3 border-l-4 border-red-500 bg-red-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{bill.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 dark:text-red-400">
                            Rs. {bill.amount.toLocaleString('en-PK')}
                          </p>
                          <Badge variant="danger">Overdue</Badge>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => handleMarkPaid(bill)}
                            disabled={deletingId === bill.id}
                            className="rounded-lg bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/20 dark:text-green-400"
                          >
                            {deletingId === bill.id ? '…' : 'Paid'}
                          </button>
                          <button
                            onClick={() => handleDelete(bill)}
                            disabled={deletingId === bill.id}
                            className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                          >
                            {deletingId === bill.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {upcomingBills.length > 0 && (
                <div>
                  <h3 className="font-bold text-yellow-600 dark:text-yellow-400 mb-3">⏳ Upcoming</h3>
                  {upcomingBills.map((bill) => {
                    const daysUntil = Math.round((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return (
                      <Card key={bill.id} isGlass className="mb-3 border-l-4 border-yellow-500 bg-yellow-500/5">
<div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{bill.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Due: {new Date(bill.dueDate).toLocaleDateString()}
                              {daysUntil >= 0 && ` · ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-600 dark:text-yellow-400">
                            Rs. {bill.amount.toLocaleString('en-PK')}
                            </p>
                            <Badge variant="warning">{daysUntil <= 3 ? 'Due soon' : 'Upcoming'}</Badge>
                          </div>
                          <div className="ml-3 flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => handleMarkPaid(bill)}
                              disabled={deletingId === bill.id}
                              className="rounded-lg bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/20 dark:text-green-400"
                            >
                              {deletingId === bill.id ? '…' : 'Paid'}
                            </button>
                            <button
                              onClick={() => handleDelete(bill)}
                              disabled={deletingId === bill.id}
                              className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                            >
                              {deletingId === bill.id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {paidBills.length > 0 && (
                <div>
                  <h3 className="font-bold text-green-600 dark:text-green-400 mb-3">✓ Paid</h3>
                  {paidBills.map((bill) => (
                    <Card key={bill.id} isGlass className="mb-3 border-l-4 border-green-500 bg-green-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-green-700 dark:text-green-300">{bill.name}</h4>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Paid ✓
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            Rs. {bill.amount.toLocaleString('en-PK')}
                          </p>
                          <Badge variant="success">Cleared</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </Container>
      </div>

      {showAddRecurring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddRecurring(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Recurring Expense</h2>
              <button onClick={() => setShowAddRecurring(false)} className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Expense Name</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Netflix, Rent, Gym"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Amount (Rs.)</label>
                  <input
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {Object.entries(categoryNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                {form.frequency !== 'daily' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Next Due Date</label>
                    <input
                      type="date"
                      value={form.next_due_date}
                      onChange={(e) => setForm((f) => ({ ...f, next_due_date: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}
              </div>
              {form.error && <p className="text-sm text-red-600">{form.error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={addRecurringExpense}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Add Recurring'}
                </button>
                <button onClick={() => setShowAddRecurring(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
