import React from 'react'
import { FieldError } from 'react-hook-form'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
  helperText?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className || ''}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: FieldError
  options: Array<{ value: string | number; label: string }>
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          {...props}
        >
          <option value="">Selecione uma opção</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
}

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-4 h-4 rounded border border-gray-300 dark:border-slate-600
              bg-white dark:bg-slate-800 text-blue-600
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              transition-all duration-200
              ${error ? 'border-red-500' : ''}
            `}
            {...props}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </span>
        </label>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        )}
      </div>
    )
  }
)

FormCheckbox.displayName = 'FormCheckbox'

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: FieldError
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            transition-all duration-200 resize-vertical min-h-32
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
