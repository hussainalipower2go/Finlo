'use client'

import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { FinloLogo } from '@/components/auth/FinloLogo'
import { HeroIllustration } from '@/components/auth/HeroIllustration'
import { LoginForm } from '@/components/auth/LoginForm'
import { ParentBrand } from '@/components/parent-brand'

export function MobileLogin() {
  return (
    <main className="min-h-screen relative overflow-x-hidden bg-[var(--hero)]">
      {/* Subtle background pattern */}
      <div className="hero-pattern" />

      {/* Status bar */}
      <header className="status-bar">
        <div>
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-2">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <BatteryFull className="h-3 w-3" />
          </div>
        </div>
        <div>
          {/* Battery percentage would go here */}
        </div>
      </header>

      {/* Finlo logo - ~70px below top */}
      <div className="relative z-10 pt-[70px] text-center">
        <FinloLogo />
      </div>

      {/* Hero illustration - centered, ~44dvh height */}
      <section className="login-hero pt-[20px] pb-[40px]">
        <HeroIllustration />
      </section>

      {/* Login sheet - overlaps hero bottom */}
      <section className="login-sheet">
        {/* Sheet handle */}
        <div className="sheet-handle" />

        {/* Login form content */}
        <div className="pt-[16px]">
          <LoginForm />
        </div>

        <ParentBrand companyName="ELVA" logo="/branding/elva-logo.svg" />
      </section>
    </main>
  )
}