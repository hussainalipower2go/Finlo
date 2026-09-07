import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
  options: Array<{ value: string; label: string }>
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, options, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-4 py-2
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            rounded-lg
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            transition-smooth
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
