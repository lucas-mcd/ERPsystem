import React, { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary para capturar erros em componentes filhos
 * Mostra UI alternativa em caso de erro
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log erro para serviço externo
    console.error('Error caught by boundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Callback opcional
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

/**
 * Fallback UI padrão para errors
 */
interface ErrorFallbackProps {
  error: Error | null
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 dark:bg-red-900 rounded-full p-3">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
          Algo deu errado
        </h1>

        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Desculpe, ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <summary className="cursor-pointer font-mono text-sm text-red-700 dark:text-red-300 font-semibold">
              Detalhes do Erro (Development)
            </summary>
            <pre className="mt-3 overflow-auto max-h-48 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words font-mono">
              {error.toString()}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>

          <a
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente para erros em seções específicas
 */
interface SectionErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function SectionError({
  title = 'Erro ao carregar',
  message = 'Ocorreu um erro ao carregar este conteúdo.',
  onRetry,
}: SectionErrorProps) {
  return (
    <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">{title}</h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para usar Error Boundary funcional
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}
