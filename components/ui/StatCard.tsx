import React from 'react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  currency?: boolean
  subtext?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  isLoading?: boolean
}

export const StatCard = ({
  label,
  value,
  currency = false,
  subtext,
  icon,
  trend,
  isLoading = false,
}: StatCardProps) => {
  if (isLoading) {
    return (
      <Card isGlass padding="md" className="space-y-3">
        <div className="h-3 md:h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2 animate-pulse" />
        <div className="h-7 md:h-8 bg-slate-300 dark:bg-slate-600 rounded w-2/3 animate-pulse" />
      </Card>
    )
  }

  return (
    <Card isGlass padding="md" className="space-y-2 min-h-[132px]">
      <div className="flex items-start justify-between gap-2">
          <p className="text-xs md:text-sm font-semibold text-[#66718a]">
          {label}
        </p>
        {icon && <div className="text-xl md:text-2xl opacity-80 flex-shrink-0">{icon}</div>}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-2xl md:text-3xl font-bold text-[#18233b] break-all">
            {currency && '₹ '}
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {trend && (
            <span
              className={`text-xs font-medium flex-shrink-0 ${
                trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {subtext && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  )
}

export default StatCard
