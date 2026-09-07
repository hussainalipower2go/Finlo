import React from 'react'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-6xl',
  full: 'w-full',
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = 'lg', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          mx-auto px-4 sm:px-6 lg:px-8
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'
