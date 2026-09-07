'use client'

import { ShieldCheck } from 'lucide-react'

export function HeroIllustration() {
  return (
    <div className="hero-illustration">
      <div className="absolute inset-0 rotate-[-3deg] rounded-3xl border bg-navy-secondary/80 backdrop-blur-xl shadow-2xl shadow-navy/20 overflow-hidden transform-gpu">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-secondary via-navy to-navy-secondary"></div>
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[80%] opacity-60">Total balance</span>
            <span className="text-[2xl] font-bold text-[250]">Rs. 64,500</span>
          </div>
          <p className="text-[10px] opacity-50 mt-1">Net worth this month</p>
        </div>
        <div className="absolute bottom-4 left-4 right-4 h-24">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-4 w-0.5 bg-[var(--primary)] rounded-t"></div>
          <div className="absolute left-1/4 transform -translate-x-1/4 h-8 w-0.5 bg-[#6B7DF2] rounded-t mt-4" />
          <div className="absolute left-3/4 transform -translate-x-1/4 h-12 w-0.5 bg-[#5A6FE8] rounded-t mt-4" />
          <div className="absolute right-1/4 transform translate-x-1/4 h-6 w-0.5 bg-[#4A5DD6] rounded-t mt-4" />
          <div className="absolute right-1/2 transform translate-x-1/2 h-2 w-0.5 bg-[#3A4CC6] rounded-t mt-4" />
        </div>
        <div className="absolute top-3 left-3 rounded-xl border bg-[rgba(255,255,255,0.4)]/50 backdrop-blur-sm shadow-sm p-2 bg-[var(--primary)]">
          <div className="h-4 w-4 rounded-bg" />
        </div>
        <div className="absolute top-3 right-3 rounded-xl border bg-[rgba(255,255,255,0.4)]/50 backdrop-blur-sm shadow-sm shadow-navy/20 p-2 bg-[var(--primary-light)]">
          <div className="h-4 w-4 rounded-bg" />
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl border bg-[rgba(255,255,255,0.4)]/50 backdrop-blur-sm shadow-sm shadow-navy/20 p-2 bg-[var(--primary)]">
          <div className="h-4 w-4 rounded-bg" />
        </div>
        <div className="absolute bottom-3 right-3 rounded-xl border bg-[rgba(255,255,255,0.4)]/50 backdrop-blur-sm shadow-sm shadow-navy/20 p-2 bg-[var(--primary)]">
          <div className="h-4 w-4 rounded-bg" />
        </div>
      </div>
      <div className="absolute right-2 bottom-2 rounded-lg border bg-[rgba(88,107,243,0.15)]/50 backdrop-blur-sm shadow-navy/20 p-1.5">
        <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
      </div>
    </div>
  )
}