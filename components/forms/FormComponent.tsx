'use client'

import { useState } from 'react'
import { Input, Select } from '@/components/ui'
import { Card } from '@/components/ui/Card'

interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

interface FormProps {
  fields: FormField[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  submitButtonText?: string
  isLoading?: boolean
  title?: string
}

export function FormComponent({
  fields,
  onSubmit,
  submitButtonText = 'Submit',
  isLoading = false,
  title,
}: FormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'number' ? parseFloat(value) : value
    setFormData((prev) => ({ ...prev, [name]: parsedValue }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setErrors({ form: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card isGlass>
      {title && <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">{title}</h2>}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        {errors.form && (
          <div className="p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-xs md:text-sm">{errors.form}</p>
          </div>
        )}

        {fields.map((field) => (
          <div key={field.name}>
            {field.type === 'select' ? (
              <Select
                label={field.label}
                name={field.name}
                value={(formData[field.name] as string) || ''}
                onChange={handleChange}
                options={field.options || []}
                error={errors[field.name]}
                required={field.required}
              />
            ) : field.type === 'textarea' ? (
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  name={field.name}
                  value={(formData[field.name] as string) || ''}
                  onChange={(e) => handleChange(e)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                    bg-white dark:bg-slate-800
                    text-slate-900 dark:text-white
                    placeholder-slate-500 dark:placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                    focus:border-transparent transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                )}
              </div>
            ) : (
              <Input
                label={field.label}
                name={field.name}
                type={field.type}
                value={(formData[field.name] as string) || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                error={errors[field.name]}
                required={field.required}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
              transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {isSubmitting || isLoading ? 'Saving...' : submitButtonText}
          </button>
        </div>
      </form>
    </Card>
  )
}
