'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'

interface AuthInputProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  placeholder: string
  value: string
  error?: string
  onChange: (value: string) => void
}

export function AuthInput({ id, label, type = 'email', placeholder, value, error, onChange }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  const renderIcon = () => {
    if (isPassword) return <Lock className="h-4 w-4" />
    if (type === 'text') return <User className="h-4 w-4" />
    return <Mail className="h-4 w-4" />
  }

  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-[#0A193D]/85">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A193D]/50">
          {renderIcon()}
        </span>
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl border border-[rgba(10,25,61,0.22)] bg-[rgba(10,8,30,0.85)] py-3.5 pl-11 pr-14 text-sm text-[#E9EDFB]/90 placeholder:text-[#0A193D]/50 outline-none transition-colors duration-200 focus:border-[rgba(10,25,61,0.55)]"
          style={{ boxSizing: 'border-box' }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent p-1 text-[#0A193D]/50 transition-colors hover:text-[#0A193D]/80"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs font-medium text-red-400">{error}</p>
      )}
    </div>
  )
}
