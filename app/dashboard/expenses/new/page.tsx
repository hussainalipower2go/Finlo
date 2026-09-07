'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import { FormComponent } from '@/components/forms/FormComponent'
import { Container, GlassButton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { addExpenseClient } from '@/lib/database-client'
import { expenseSchema } from '@/lib/schemas'
import Link from 'next/link'

export default function AddExpensePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const expenseFields = [
    {
      name: 'description',
      label: 'Description',
      type: 'text' as const,
      placeholder: 'e.g., Groceries, Gas, Movie tickets',
      required: true,
    },
    {
      name: 'amount',
      label: 'Amount (₹)',
      type: 'number' as const,
      placeholder: '0.00',
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'food', label: '🍔 Food & Dining' },
        { value: 'transport', label: '🚗 Transport' },
        { value: 'utilities', label: '💡 Utilities' },
        { value: 'entertainment', label: '🎬 Entertainment' },
        { value: 'healthcare', label: '⚕️ Healthcare' },
        { value: 'shopping', label: '🛍️ Shopping' },
        { value: 'other', label: '📦 Other' },
      ],
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'cash', label: '💵 Cash' },
        { value: 'card', label: '💳 Card' },
        { value: 'upi', label: '📱 UPI' },
        { value: 'bank_transfer', label: '🏦 Bank Transfer' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes (Optional)',
      type: 'textarea' as const,
      placeholder: 'Add any additional details...',
    },
  ]

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const validatedData = expenseSchema.parse(data)

      await addExpenseClient({
        ...validatedData,
        status: 'completed',
      } as unknown as Parameters<typeof addExpenseClient>[0])

      toast({
        type: 'success',
        message: 'Expense added successfully! 💾',
      })

      router.push('/dashboard/transactions')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-red-600 to-pink-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Add Expense</h1>
                <p className="text-red-100">Track your spending to stay on budget</p>
              </div>
              <div className="text-6xl">💳</div>
            </div>
          </Container>
        </div>

        {/* Form */}
        <Container className="py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <FormComponent
                fields={expenseFields}
                onSubmit={handleSubmit}
                submitButtonText="Add Expense"
                isLoading={isLoading}
              />
            </div>

            {/* Tips Sidebar */}
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">💡 Expense Tips</h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                  <li>✓ Be specific with descriptions</li>
                  <li>✓ Select the correct category</li>
                  <li>✓ Use the date of purchase</li>
                  <li>✓ Add notes for big expenses</li>
                </ul>
              </div>

              <Link href="/dashboard/transactions">
                <GlassButton variant="secondary" className="w-full">
                  View All Expenses
                </GlassButton>
              </Link>

              <Link href="/dashboard">
                <GlassButton variant="ghost" className="w-full">
                  Back to Dashboard
                </GlassButton>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </DashboardLayout>
  )
}
