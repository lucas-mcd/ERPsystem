interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function Loading({ size = 'md', message = 'Carregando...' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  )
}

interface ErrorProps {
  message: string
  onRetry?: () => void
}

export function Error({ message, onRetry }: ErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      )}
    </div>
  )
}

interface SuccessProps {
  message: string
}

export function Success({ message }: SuccessProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <p className="text-green-700 font-medium">{message}</p>
    </div>
  )
}

export function EmptyState({ title = 'Sem dados', description = 'Nenhum item encontrado' }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-900 font-medium text-lg">{title}</p>
      <p className="text-gray-500">{description}</p>
    </div>
  )
}
