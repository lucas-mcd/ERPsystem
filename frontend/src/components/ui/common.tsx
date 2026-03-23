import React from 'react'
import clsx from 'clsx'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: LucideIcon
  children: React.ReactNode
}

const buttonVariants = {
  primary:
    'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white',
  secondary:
    'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white',
  danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white',
  ghost:
    'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-600',
}

const buttonSizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon: Icon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200',
          buttonVariants[variant],
          buttonSizes[size],
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processando...
          </>
        ) : (
          <>
            {Icon && <Icon className="w-4 h-4" />}
            {children}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  variant?: 'blue' | 'green' | 'amber' | 'red'
}

const statCardColors = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'blue',
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${statCardColors[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}

interface BadgeProps {
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  children: React.ReactNode
}

const badgeColors = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  gray: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300',
}

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
        badgeColors[variant]
      )}
    >
      {children}
    </span>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
      ))}
    </div>
  )
}
