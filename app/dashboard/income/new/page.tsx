'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import { FormComponent } from '@/components/forms/FormComponent'
import { Container, GlassButton } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { addIncomeClient } from '@/lib/database-client'
import { incomeSchema } from '@/lib/schemas'
import Link from 'next/link'

export default function AddIncomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const incomeFields = [
    {
      name: 'amount',
      label: 'Amount (₹)',
      type: 'number' as const,
      placeholder: '0.00',
      required: true,
    },
    {
      name: 'source',
      label: 'Income Source',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'salary', label: '💼 Salary' },
        { value: 'freelance', label: '💻 Freelance' },
        { value: 'investments', label: '📈 Investments' },
        { value: 'bonus', label: '🎁 Bonus' },
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
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'confirmed', label: '✓ Confirmed' },
        { value: 'expected', label: '⏳ Expected' },
        { value: 'possible', label: '❓ Possible' },
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
      const validatedData = incomeSchema.parse(data)

      await addIncomeClient(validatedData as unknown as Parameters<typeof addIncomeClient>[0])

      toast({
        type: 'success',
        message: 'Income added successfully! 💰',
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
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Add Income</h1>
                <p className="text-green-100">Record your incoming money</p>
              </div>
              <div className="text-6xl">💵</div>
            </div>
          </Container>
        </div>

        {/* Form */}
        <Container className="py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <FormComponent
                fields={incomeFields}
                onSubmit={handleSubmit}
                submitButtonText="Add Income"
                isLoading={isLoading}
              />
            </div>

            {/* Tips Sidebar */}
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">💡 Income Tips</h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
                  <li>✓ Mark salary as confirmed</li>
                  <li>✓ Expected for bonus/freelance</li>
                  <li>✓ Use possible for uncertain income</li>
                  <li>✓ Set the correct date</li>
                </ul>
              </div>

              <Link href="/dashboard/transactions">
                <GlassButton variant="secondary" className="w-full">
                  View All Transactions
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
