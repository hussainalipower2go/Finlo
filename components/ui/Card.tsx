import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  isGlass?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, isGlass = true, padding = 'md', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          ${isGlass ? 'glass' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}
          rounded-2xl
          ${paddingClasses[padding]}
          transition-smooth
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
