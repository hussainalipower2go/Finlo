/**
 * Financial calculations utilities
 * All calculations are transparent and grounded in actual data, not AI
 */

import { Transaction, Income, Expense, RecurringExpense } from './types'

/**
 * Calculate current balance from transactions
 */
export function calculateCurrentBalance(transactions: Transaction[]): number {
  return transactions.reduce((balance, txn) => {
    if (txn.type === 'income') {
      return balance + txn.amount
    } else {
      return balance - txn.amount
    }
  }, 0)
}

/**
 * Calculate monthly income (confirmed and expected only, exclude possible)
 */
export function calculateMonthlyIncome(
  incomeList: Income[],
  monthDate: Date = new Date()
): number {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  return incomeList
    .filter((income) => {
      const incomeDate = new Date(income.date)
      return (
        incomeDate.getFullYear() === year &&
        incomeDate.getMonth() === month &&
        (income.status === 'confirmed' || income.status === 'expected')
      )
    })
    .reduce((sum, income) => sum + income.amount, 0)
}

/**
 * Calculate monthly expenses (completed transactions only)
 */
export function calculateMonthlyExpenses(
  expenses: Expense[],
  monthDate: Date = new Date()
): number {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  return expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      return (
        expenseDate.getFullYear() === year &&
        expenseDate.getMonth() === month &&
        expense.status === 'completed'
      )
    })
    .reduce((sum, expense) => sum + expense.amount, 0)
}

/**
 * Calculate upcoming expenses for a date range
 * Includes planned expenses and recurring expenses
 */
export function calculateUpcomingExpenses(
  expenses: Expense[],
  recurringExpenses: RecurringExpense[],
  startDate: Date = new Date(),
  endDate?: Date
): number {
  const end = endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days default

  // Planned expenses in range
  const plannedTotal = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate && expenseDate <= end && expense.status === 'planned'
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Recurring expenses in range
  const recurringTotal = calculateRecurringExpensesInRange(
    recurringExpenses,
    startDate,
    end
  )

  return plannedTotal + recurringTotal
}

/**
 * Calculate recurring expenses that fall within a date range
 */
function calculateRecurringExpensesInRange(
  recurringExpenses: RecurringExpense[],
  startDate: Date,
  endDate: Date
): number {
  let total = 0

  for (const recurring of recurringExpenses) {
    let nextDue = new Date(recurring.next_due_date)
    const dayInMs = 24 * 60 * 60 * 1000

    // Calculate frequency in milliseconds
    let frequencyMs: number
    switch (recurring.frequency) {
      case 'weekly':
        frequencyMs = 7 * dayInMs
        break
      case 'monthly':
        frequencyMs = 30 * dayInMs // Approximate
        break
      case 'quarterly':
        frequencyMs = 90 * dayInMs // Approximate
        break
      case 'yearly':
        frequencyMs = 365 * dayInMs
        break
      default:
        frequencyMs = 30 * dayInMs // Approximate unknown frequency as monthly
    }

    // Count occurrences within range
    while (nextDue <= endDate) {
      if (nextDue >= startDate) {
        total += recurring.amount
      }
      nextDue = new Date(nextDue.getTime() + frequencyMs)
    }
  }

  return total
}

/**
 * Calculate average daily spending from historical data
 */
export function calculateAverageDailySpending(
  expenses: Expense[],
  daysBack: number = 30
): number {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  const totalSpent = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= cutoffDate && expense.status === 'completed'
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  return totalSpent / daysBack
}

/**
 * Calculate money runway: how many days until money runs out
 */
export function calculateMoneyRunway(
  currentBalance: number,
  averageDailySpending: number,
  upcomingExpenses: number
): number {
  if (averageDailySpending <= 0) {
    return -1 // Not enough data
  }

  // Runway = (balance - upcoming expenses) / daily spending
  const availableBalance = currentBalance - upcomingExpenses
  if (availableBalance <= 0) {
    return 0
  }

  return Math.floor(availableBalance / averageDailySpending)
}

/**
 * Calculate safe to spend
 * Formula: (Current Balance + Expected Income) - (Upcoming Expenses + Basic Spending Allowance)
 */
export function calculateSafeToSpend(
  currentBalance: number,
  nextIncomeAmount: number,
  upcomingExpenses: number,
  basicSpendingAllowance: number = 0
): number {
  const availableFunds = currentBalance + nextIncomeAmount
  const committedExpenses = upcomingExpenses + basicSpendingAllowance

  const safeAmount = availableFunds - committedExpenses

  // Can't spend negative money
  return Math.max(0, safeAmount)
}

/**
 * Calculate projected end-of-month balance
 */
export function calculateProjectedMonthEndBalance(
  currentBalance: number,
  expectedIncome: number,
  expectedExpenses: number,
  recurringExpenses: number
): number {
  return currentBalance + expectedIncome - expectedExpenses - recurringExpenses
}

/**
 * Check if a purchase is affordable
 * Returns: { isAffordable, projectedBalance, recommendation }
 */
export function checkAffordability(
  currentBalance: number,
  upcomingCommitments: number,
  purchaseAmount: number
): {
  isAffordable: boolean
  projectedBalance: number
  recommendation: string
} {
  const projectedBalance = currentBalance - purchaseAmount
  const bufferNeeded = upcomingCommitments

  const isAffordable = projectedBalance >= bufferNeeded

  let recommendation = ''
  if (isAffordable) {
    recommendation = 'This purchase looks affordable based on your upcoming commitments.'
  } else {
    const shortfall = bufferNeeded - projectedBalance
    recommendation = `This purchase may leave you short by Rs. ${shortfall.toFixed(0)} after your upcoming commitments.`
  }

  return {
    isAffordable,
    projectedBalance,
    recommendation,
  }
}

/**
 * Calculate budget usage for a category in a month
 */
export function calculateBudgetUsage(
  spent: number,
  budgetLimit: number
): {
  spent: number
  remaining: number
  percentUsed: number
  status: 'ok' | 'warning' | 'exceeded'
} {
  const percentUsed = (spent / budgetLimit) * 100
  const remaining = budgetLimit - spent

  let status: 'ok' | 'warning' | 'exceeded' = 'ok'
  if (percentUsed >= 100) {
    status = 'exceeded'
  } else if (percentUsed >= 80) {
    status = 'warning'
  }

  return {
    spent,
    remaining,
    percentUsed,
    status,
  }
}
