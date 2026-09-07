import { type ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  )
}
