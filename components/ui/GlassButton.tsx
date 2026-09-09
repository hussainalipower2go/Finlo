import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: React.ReactNode
}

const baseClasses = `
  font-semibold rounded-lg transition-smooth
  focus-visible:outline-2 focus-visible:outline-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  flex items-center justify-center gap-2
`

const variantClasses = {
  primary: `
    bg-[#0A193D] border-[#0A193D] text-white shadow-sm
    hover:bg-[#0A193D] hover:border-[#0A193D]
    focus-visible:outline-[#0A193D]
  `,
  secondary: `
    bg-white border-[#e2e7f0] text-[#536079] shadow-sm
    hover:bg-[#f5f7fb] hover:border-[#cbd3e2]
    focus-visible:outline-[#0A193D]
  `,
  ghost: `
    bg-transparent
    border-transparent
    text-slate-600 dark:text-slate-400
    hover:bg-slate-100 dark:hover:bg-slate-800
    focus-visible:outline-slate-600 dark:focus-visible:outline-slate-400
  `,
  danger: `
    bg-[#fff0f1] border-[#ffd7db] text-[#e14d5d]
    hover:bg-[#ffe4e7] hover:border-[#ffbfc7]
    focus-visible:outline-[#e14d5d]
  `,
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

GlassButton.displayName = 'GlassButton'
