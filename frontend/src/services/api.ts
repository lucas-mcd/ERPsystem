/**
 * Serviço de API
 * 
 * Centraliza todas as requisições HTTP para a API
 */

import { User, Client, Product } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiOptions {
  headers?: Record<string, string>
  body?: any
  method?: string
}

/**
 * Função auxiliar para fazer requisições à API
 */
async function fetchAPI<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_URL}${endpoint}`
  
  console.log(`[API] ${options.method || 'GET'} ${url}`, {
    hasToken: !!token,
    tokenLength: token?.length || 0,
  })
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  console.log(`[API] Response: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const error = await response.json()
    console.error(`[API] Error response:`, error)
    
    // Trata erros de validação (422)
    if (response.status === 422 && error.detail) {
      const details = error.detail
        .map((err: any) => `${err.loc?.[1] || 'campo'}: ${err.msg}`)
        .join('; ')
      throw new Error(`Validação: ${details}`)
    }
    
    throw new Error(error.error?.message || error.message || `API Error: ${response.statusText}`)
  }

  // Se status 204 (No Content), retornar null
  if (response.status === 204) {
    return null as any
  }

  return response.json()
}

/**
 * Serviço de API
 */
export const apiService = {
  // ========================================================================
  // AUTENTICAÇÃO
  // ========================================================================
  
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
      }),

    getCurrentUser: () =>
      fetchAPI<User>('/api/v1/auth/me'),

    logout: () =>
      fetchAPI('/api/v1/auth/logout', { method: 'POST' }),
  },

  // ========================================================================
  // USUÁRIOS
  // ========================================================================
  
  users: {
    create: (data: any) =>
      fetchAPI<User>('/api/v1/users', {
        method: 'POST',
        body: data,
      }),

    list: (skip = 0, limit = 100) =>
      fetchAPI(`/api/v1/users?skip=${skip}&limit=${limit}`),

    get: (id: number) =>
      fetchAPI<User>(`/api/v1/users/${id}`),

    update: (id: number, data: any) =>
      fetchAPI<User>(`/api/v1/users/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: number) =>
      fetchAPI(`/api/v1/users/${id}`, { method: 'DELETE' }),
  },

  // ========================================================================
  // CLIENTES
  // ========================================================================
  
  clients: {
    create: (data: any) =>
      fetchAPI<Client>('/api/v1/clients', {
        method: 'POST',
        body: data,
      }),

    list: (skip = 0, limit = 100, search?: string, city?: string) => {
      let url = `/api/v1/clients?skip=${skip}&limit=${limit}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (city) url += `&city=${encodeURIComponent(city)}`
      return fetchAPI(url)
    },

    get: (id: number) =>
      fetchAPI<Client>(`/api/v1/clients/${id}`),

    update: (id: number, data: any) =>
      fetchAPI<Client>(`/api/v1/clients/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: number) =>
      fetchAPI(`/api/v1/clients/${id}`, { method: 'DELETE' }),

    exportCSV: () => `${API_URL}/api/v1/reports/clients/csv`,
  },

  // ========================================================================
  // PRODUTOS
  // ========================================================================
  
  products: {
    create: (data: any) =>
      fetchAPI<Product>('/api/v1/products', {
        method: 'POST',
        body: data,
      }),

    list: (skip = 0, limit = 100, search?: string, category?: string, lowStock = false) => {
      let url = `/api/v1/products?skip=${skip}&limit=${limit}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (category) url += `&category=${encodeURIComponent(category)}`
      if (lowStock) url += '&low_stock=true'
      return fetchAPI(url)
    },

    get: (id: number) =>
      fetchAPI<Product>(`/api/v1/products/${id}`),

    update: (id: number, data: any) =>
      fetchAPI<Product>(`/api/v1/products/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: number) =>
      fetchAPI(`/api/v1/products/${id}`, { method: 'DELETE' }),

    adjustStock: (id: number, quantityChange: number, reason = 'Manual adjustment') =>
      fetchAPI<Product>(`/api/v1/products/${id}/adjust-stock`, {
        method: 'POST',
        body: { quantity_change: quantityChange, reason },
      }),

    exportCSV: () => `${API_URL}/api/v1/reports/products/csv`,
    exportPDF: () => `${API_URL}/api/v1/reports/products/pdf`,
  },

  // ========================================================================
  // AUDIT LOGS
  // ========================================================================
  
  auditLogs: {
    list: (skip = 0, limit = 100, entity?: string, action?: string, userId?: number) => {
      let url = `/api/v1/audit-logs?skip=${skip}&limit=${limit}`
      if (entity) url += `&entity=${encodeURIComponent(entity)}`
      if (action) url += `&action=${encodeURIComponent(action)}`
      if (userId) url += `&user_id=${userId}`
      return fetchAPI(url)
    },

    getEntityHistory: (entity: string, entityId: number, skip = 0, limit = 100) =>
      fetchAPI(`/api/v1/audit-logs/entity/${entity}/${entityId}?skip=${skip}&limit=${limit}`),
  },

  // ========================================================================
  // RELATÓRIOS
  // ========================================================================
  
  reports: {
    importClientsCSV: async (file: File) => {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/v1/imports/clients/csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to import file')
      }

      return response.json()
    },

    importProductsCSV: async (file: File) => {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/v1/imports/products/csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to import file')
      }

      return response.json()
    },
  },

  // Top-level shortcuts for convenience
  getClients: () => apiService.clients.list(),
  createClient: (data: any) => apiService.clients.create(data),
  deleteClient: (id: number) => apiService.clients.delete(id),
  
  getProducts: () => apiService.products.list(),
  createProduct: (data: any) => apiService.products.create(data),
  deleteProduct: (id: number) => apiService.products.delete(id),
  
  getUsers: () => apiService.users.list(),
  createUser: (data: any) => apiService.users.create(data),
  deleteUser: (id: number) => apiService.users.delete(id),
}
