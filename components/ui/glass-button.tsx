'use client'

import { ArrowRight, LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  showArrow?: boolean
}

export function GlassButton({
  children,
  loading = false,
  showArrow = false,
  className = '',
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[9px] bg-gradient-to-r from-[#142453] to-[#0A193D] px-5 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(88,107,243,0.25)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(88,107,243,0.35)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A193D]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:h-[46px] sm:text-[13px] ${className}`}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span>{children}</span>
      {!loading && showArrow && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
