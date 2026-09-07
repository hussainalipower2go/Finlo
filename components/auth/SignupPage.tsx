'use client'

import { useState, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'
import { AuthBrandPanel } from './AuthBrandPanel'
import { SignupForm } from './SignupForm'

export function SignupPage() {
  const [dark, setDark] = useState(true)
  const toggle = useCallback(() => setDark((v) => !v), [])

  return (
    <div
      className="flex min-h-screen w-full items-stretch justify-center"
      style={{ background: '#080b1a', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", position: 'relative' }}
    >
      <div
        className="relative z-[1] mx-auto flex w-full max-w-[1536px] rounded-[12px] lg:rounded-[20px] border"
        style={{ border: '1px solid rgba(109,40,217,0.2)' }}
      >
        <AuthBrandPanel />

        <section
          className="relative flex flex-1 min-w-0 lg:w-1/2 items-center justify-center px-6 py-10 lg:px-[60px]"
          style={{ background: '#080b1a' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(79,70,229,0.07) 0%, transparent 60%)' }}
          />

          <button
            type="button"
            onClick={toggle}
            className="absolute right-9 top-7 cursor-pointer rounded-[100px] border px-[18px] py-2.5 text-[13px] text-[#c4b5fd]/80 transition-colors duration-200 hover:text-[#c4b5fd]"
            style={{ background: 'rgba(20,16,50,0.85)', border: '1px solid rgba(109,40,217,0.22)', fontFamily: 'inherit' }}
          >
            <span className="flex items-center gap-[7px]">
              {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Dark mode
            </span>
          </button>

          <SignupForm />
        </section>
      </div>
    </div>
  )
}
