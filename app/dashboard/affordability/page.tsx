'use client'

import { useState } from 'react'
import { useToast } from '@/components/providers/ToastProvider'
import { Container, Badge } from '@/components/ui'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { getUserTransactionsClient } from '@/lib/database-client'
import { calculateCurrentBalance } from '@/lib/calculations'

export default function AffordabilityPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState(0)
  const [result, setResult] = useState<{
    isAffordable: boolean
    projectedBalance: number
    recommendation: string
    safetyMargin: number
  } | null>(null)

  const { toast } = useToast()

  const handleCheck = async () => {
    if (purchaseAmount <= 0) {
      toast({ type: 'error', message: 'Please enter a valid amount' })
      return
    }

    setIsLoading(true)
    try {
      const txns = await getUserTransactionsClient()

      const balance = calculateCurrentBalance(txns)

      const projectedBalance = balance - purchaseAmount
      const requiredBuffer = 5000 // Safety buffer

      const isAffordable = projectedBalance >= requiredBuffer
      const safetyMargin = projectedBalance - requiredBuffer

      let recommendation = ''
      if (isAffordable) {
        if (safetyMargin > purchaseAmount) {
          recommendation = '✓ Great! You can comfortably afford this purchase.'
        } else {
          recommendation = '⚠️ You can afford it, but consider your safety buffer.'
        }
      } else {
        recommendation = `✗ Not recommended. You would fall below your safety buffer of ₹${requiredBuffer.toLocaleString('en-IN')}.`
      }

      setResult({
        isAffordable,
        projectedBalance,
        recommendation,
        safetyMargin,
      })
    } catch {
      toast({ type: 'error', message: 'Error checking affordability' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="pb-32 md:pb-8">
        <div className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
          <Container className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Can I Afford It?</h1>
                <p className="text-cyan-100">Check if you can afford a purchase</p>
              </div>
              <div className="text-6xl">❓</div>
            </div>
          </Container>
        </div>

        <Container className="py-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input */}
            <Card isGlass>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Check Affordability</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Purchase Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg
                      bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                      placeholder-slate-500 dark:placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    What are you buying?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., New laptop, Vacation, Phone"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg
                      bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                      placeholder-slate-500 dark:placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  onClick={handleCheck}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Checking...' : 'Check Affordability'}
                </button>
              </div>
            </Card>

            {/* Result */}
            {result && (
              <Card isGlass>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Results</h2>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="text-center p-6 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Badge variant={result.isAffordable ? 'success' : 'danger'} className="mb-3">
                      {result.isAffordable ? 'Affordable' : 'Not Affordable'}
                    </Badge>
                    <p className="text-slate-900 dark:text-white font-semibold text-lg mt-2">
                      {result.recommendation}
                    </p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                      <span className="text-slate-600 dark:text-slate-400">Purchase Amount</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        -₹{purchaseAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                      <span className="text-slate-600 dark:text-slate-400">Projected Balance</span>
                      <span
                        className={`font-bold ${
                          result.projectedBalance >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        ₹{result.projectedBalance.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-600 dark:text-slate-400">Safety Buffer</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">
                        ₹{result.safetyMargin.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {result.isAffordable
                        ? '💡 You can afford this! But remember to keep your safety buffer for emergencies.'
                        : '💡 Consider waiting for more income or reducing other expenses first.'}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card isGlass>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">💡 How it works</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We check your current balance and ensure you maintain a ₹5,000 safety buffer after the purchase.
              </p>
            </Card>

            <Card isGlass>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">🛡️ Safety Buffer</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Always keeping ₹5,000 aside protects you from unexpected expenses and emergencies.
              </p>
            </Card>

            <Card isGlass>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">📊 Smart Spending</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This tool helps you make confident spending decisions based on your actual finances.
              </p>
            </Card>
          </div>
        </Container>
      </div>
    </DashboardLayout>
  )
}
