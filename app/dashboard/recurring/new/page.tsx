'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import { FormComponent } from '@/components/forms/FormComponent'
import { Container, GlassButton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { recurringExpenseSchema } from '@/lib/schemas'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function AddRecurringPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const fields = [
    {
      name: 'name',
      label: 'Expense Name',
      type: 'text' as const,
      placeholder: 'e.g., Netflix subscription, Gym membership',
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
        { value: 'food', label: '🍔 Food' },
        { value: 'transport', label: '🚗 Transport' },
        { value: 'utilities', label: '💡 Utilities' },
        { value: 'entertainment', label: '🎬 Entertainment' },
        { value: 'healthcare', label: '⚕️ Healthcare' },
        { value: 'shopping', label: '🛍️ Shopping' },
        { value: 'other', label: '📦 Other' },
      ],
    },
    {
      name: 'frequency',
      label: 'Frequency',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'bi-weekly', label: 'Bi-weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'yearly', label: 'Yearly' },
      ],
    },
    {
      name: 'next_due_date',
      label: 'Next Due Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'notes',
      label: 'Notes (Optional)',
      type: 'textarea' as const,
      placeholder: 'Add notes...',
    },
  ]

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const validatedData = recurringExpenseSchema.parse(data)

      const { error } = await supabase.from('recurring_expenses').insert([validatedData])
      if (error) throw error

      toast({
        type: 'success',
        message: 'Recurring expense added! 🔄',
      })

      router.push('/dashboard/recurring')
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
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Add Recurring Expense</h1>
                <p className="text-purple-100">Set up automated expense tracking</p>
              </div>
              <div className="text-6xl">🔄</div>
            </div>
          </Container>
        </div>

        <Container className="py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <FormComponent
                fields={fields}
                onSubmit={handleSubmit}
                submitButtonText="Add Recurring Expense"
                isLoading={isLoading}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">💡 Examples</h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                  <li>• Netflix - Monthly</li>
                  <li>• Gym - Monthly</li>
                  <li>• Rent - Monthly</li>
                  <li>• Insurance - Quarterly</li>
                  <li>• Car maintenance - Quarterly</li>
                </ul>
              </div>

              <Link href="/dashboard/recurring">
                <GlassButton variant="secondary" className="w-full">
                  View All
                </GlassButton>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </DashboardLayout>
  )
}
