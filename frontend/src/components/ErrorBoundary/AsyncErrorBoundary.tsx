import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error | null, retry: () => void) => ReactNode
}

export class AsyncErrorBoundary extends React.Component<
  AsyncErrorBoundaryProps,
  { error: Error | null }
> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection)
  }

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    this.setState({ error: new Error(event.reason) })
  }

  retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) || (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-200">Erro assíncrono</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{this.state.error.message}</p>
              <button
                onClick={this.retry}
                className="mt-2 px-3 py-1 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 rounded"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
