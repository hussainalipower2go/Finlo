'use client'

import React, { createContext, useContext, useCallback, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
  toast: (options: { type?: ToastType; message: string; duration?: number }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = Date.now().toString()
      const newToast: Toast = { id, type, message, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const toast = useCallback(
    (options: { type?: ToastType; message: string; duration?: number }) => {
      addToast(options.message, options.type, options.duration)
    },
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            glass-sm rounded-lg p-4 max-w-sm pointer-events-auto
            animate-in fade-in slide-in-from-right-4 duration-300
            ${
              toast.type === 'success'
                ? 'bg-green-100/50 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300'
                : toast.type === 'error'
                ? 'bg-red-100/50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                : toast.type === 'warning'
                ? 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-blue-100/50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
            }
            flex items-center justify-between gap-3
          `}
          role="alert"
        >
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
