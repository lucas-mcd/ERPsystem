import { useState, useCallback, useEffect, useRef } from 'react'
import { getApiClient, type ApiResponse } from '@/utils/apiClient'

interface UseApiOptions {
  skip?: boolean
  immediate?: boolean
  onSuccess?: (data: unknown) => void
  onError?: (error: Error) => void
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook para fazer requisições HTTP
 * Gerencia estado de loading, error e data
 */
export function useApi<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: unknown,
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options.skip)
  const [error, setError] = useState<Error | null>(null)
  const apiClient = useRef(getApiClient()).current

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let response: ApiResponse<T>

      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(endpoint)
          break
        case 'POST':
          response = await apiClient.post<T>(endpoint, body)
          break
        case 'PUT':
          response = await apiClient.put<T>(endpoint, body)
          break
        case 'DELETE':
          response = await apiClient.delete<T>(endpoint)
          break
        case 'PATCH':
          response = await apiClient.patch<T>(endpoint, body)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      setData(response.data)
      options.onSuccess?.(response.data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [endpoint, method, body, apiClient, options])

  useEffect(() => {
    if (!options.skip && options.immediate !== false) {
      refetch()
    }
  }, [endpoint, refetch, options.skip, options.immediate])

  return { data, loading, error, refetch }
}

/**
 * Hook para fazer requisições manualmente
 */
export function useLazyApi<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const apiClient = useRef(getApiClient()).current

  const execute = useCallback(
    async (
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
      body?: unknown
    ) => {
      setLoading(true)
      setError(null)

      try {
        let response: ApiResponse<T>

        switch (method) {
          case 'GET':
            response = await apiClient.get<T>(endpoint)
            break
          case 'POST':
            response = await apiClient.post<T>(endpoint, body)
            break
          case 'PUT':
            response = await apiClient.put<T>(endpoint, body)
            break
          case 'DELETE':
            response = await apiClient.delete<T>(endpoint)
            break
          case 'PATCH':
            response = await apiClient.patch<T>(endpoint, body)
            break
          default:
            throw new Error(`Unsupported method: ${method}`)
        }

        setData(response.data)
        return response.data
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [apiClient]
  )

  return { data, loading, error, execute }
}

/**
 * Hook para fazer upload de arquivo
 */
export function useFileUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const apiClient = useRef(getApiClient()).current

  const upload = useCallback(
    async <T,>(endpoint: string, file: File) => {
      setLoading(true)
      setError(null)
      setProgress(0)

      try {
        // Simular progresso
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + Math.random() * 30, 90))
        }, 500)

        const response = await apiClient.upload<T>(endpoint, file)

        clearInterval(progressInterval)
        setProgress(100)

        return response.data
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [apiClient]
  )

  return { loading, error, progress, upload }
}

/**
 * Hook para download de arquivo
 */
export function useFileDownload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const apiClient = useRef(getApiClient()).current

  const download = useCallback(
    async (endpoint: string, filename: string) => {
      setLoading(true)
      setError(null)

      try {
        const blob = await apiClient.download(endpoint)

        // Criar URL e download
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [apiClient]
  )

  return { loading, error, download }
}
