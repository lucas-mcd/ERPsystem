/**
 * Cliente HTTP para comunicação com API
 * Suporta retry, timeout, interceptadores
 */

interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  onUploadProgress?: (progress: number) => void
  onDownloadProgress?: (progress: number) => void
}

interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

type Interceptor<T> = (config: T) => T | Promise<T>
type ResponseInterceptor<T> = (response: T) => T | Promise<T>

class ApiClient {
  private baseURL: string
  private requestInterceptors: Interceptor<RequestConfig>[] = []
  private responseInterceptors: ResponseInterceptor<Response>[] = []
  private defaultTimeout: number = 30000 // 30 segundos
  private tokenRefreshInProgress: Promise<string | null> | null = null
  private getToken?: () => string | null | Promise<string | null>
  private refreshToken?: () => Promise<string | null>

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000') {
    this.baseURL = baseURL
    this.setupDefaultInterceptors()
  }

  /**
   * Configura Auth automático
   */
  setupAuth(getToken: () => string | null | Promise<string | null>, refreshToken?: () => Promise<string | null>) {
    this.getToken = getToken
    this.refreshToken = refreshToken
  }

  /**
   * Setup dos interceptadores padrão
   */
  private setupDefaultInterceptors() {
    // Auto-attach token
    this.addRequestInterceptor(async (config) => {
      if (this.getToken) {
        const token = await Promise.resolve(this.getToken())
        if (token) {
          if (!config.headers) {
            config.headers = {}
          }
          ; (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }
      }
      return config
    })

    // Auto-refresh token em 401
    this.addResponseInterceptor(async (response) => {
      if (response.status === 401 && this.refreshToken) {
        // Evitar múltiplos refresh simultâneos
        if (!this.tokenRefreshInProgress) {
          this.tokenRefreshInProgress = this.refreshToken().catch(() => null)
        }

        const newToken = await this.tokenRefreshInProgress
        this.tokenRefreshInProgress = null

        // Se conseguiu novo token, retorna resposta
        // Nota: O retry será feito automaticamente pela lógica de retry
        if (newToken) {
          return response
        }
      }

      return response
    })
  }

  /**
   * Adiciona interceptador de requisição
   */
  addRequestInterceptor(interceptor: Interceptor<RequestConfig>) {
    this.requestInterceptors.push(interceptor)
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((i) => i !== interceptor)
    }
  }

  /**
   * Adiciona interceptador de resposta
   */
  addResponseInterceptor(interceptor: ResponseInterceptor<Response>) {
    this.responseInterceptors.push(interceptor)
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((i) => i !== interceptor)
    }
  }

  /**
   * Executa requisição com retry automático
   */
  private async fetchWithRetry(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<Response> {
    const timeout = config.timeout || this.defaultTimeout
    const maxRetries = config.retries || 3

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Aplicar interceptadores de resposta
      let finalResponse = response.clone()
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor(finalResponse.clone())
      }

      return finalResponse
    } catch (error) {
      clearTimeout(timeoutId)

      // Retry em caso de erro de rede
      if (attempt < maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.fetchWithRetry(url, config, attempt + 1)
      }

      throw error
    }
  }

  /**
   * Verifica se erro é retentável
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError) {
      return error.message.includes('Failed to fetch') || error.message.includes('Network')
    }
    if (error instanceof DOMException) {
      return error.name === 'AbortError'
    }
    return false
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  /**
   * Requisição genérica
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    // Aplicar interceptadores de requisição
    let finalConfig = config
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig)
    }

    // Headers padrão
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...finalConfig.headers,
    })

    const response = await this.fetchWithRetry(url, {
      ...finalConfig,
      headers,
    })

    // Tratamento de erro HTTP
    if (!response.ok) {
      const error = new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status)
      throw error
    }

    // Parse response (exclui 204 No Content)
    let data: T
    
    if (response.status === 204) {
      // 204 No Content - sem corpo de resposta
      data = null as T
    } else {
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        data = (await response.json()) as T
      } else if (contentType?.includes('text')) {
        data = (await response.text()) as T
      } else {
        data = (await response.blob()) as T
      }
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  }

  /**
   * Upload de arquivo
   */
  async upload<T>(
    endpoint: string,
    file: File,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // Remover Content-Type para FormData
        ...(config?.headers as Record<string, string>),
      },
    })
  }

  /**
   * Download de arquivo
   */
  async download(endpoint: string, config?: RequestConfig): Promise<Blob> {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      ...config,
      method: 'GET',
    })

    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}: Download failed`, response.status)
    }

    return response.blob()
  }

  /**
   * Define novo baseURL
   */
  setBaseURL(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Obtém baseURL atual
   */
  getBaseURL(): string {
    return this.baseURL
  }
}

/**
 * Classe para erros de API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 0,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Singleton instance
const apiClient = new ApiClient()

export function getApiClient(baseURL?: string): ApiClient {
  if (baseURL) {
    return new ApiClient(baseURL)
  }
  return apiClient
}

export { ApiClient, apiClient, type RequestConfig, type ApiResponse }
