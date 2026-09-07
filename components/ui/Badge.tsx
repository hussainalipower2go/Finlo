import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

const variantClasses = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
  success: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  warning: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300',
  danger: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1
          px-2.5 py-0.5
          rounded-full
          text-xs font-medium
          ${variantClasses[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
