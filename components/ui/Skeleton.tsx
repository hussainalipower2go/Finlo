import React from 'react'

export const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { count?: number }
>(({ className = '', count = 1, ...props }, ref) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          ref={i === 0 ? ref : undefined}
          className={`
            bg-slate-200 dark:bg-slate-700
            rounded-lg
            animate-pulse
            ${className}
          `}
          {...props}
        />
      ))}
    </>
  )
})

Skeleton.displayName = 'Skeleton'
