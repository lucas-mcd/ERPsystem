/**
 * Tipos TypeScript para o Frontend
 * 
 * Responsabilidade: Definir tipos e interfaces da aplicação
 */

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  requires_2fa?: boolean;
  temp_token?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  two_fa_enabled?: boolean;
  two_fa_backup_codes_remaining?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  requiresTwoFA?: boolean;
  twoFAUserId?: string;
}

// ============================================================================
// CLIENTES
// ============================================================================

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  tax_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

export interface ClientListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Client[];
}

// ============================================================================
// PRODUTOS
// ============================================================================

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  quantity: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  quantity?: number;
  category?: string;
  is_active?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ProductListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Product[];
}

// ============================================================================
// USUARIOS
// ============================================================================

export interface CreateUserRequest {
  email: string;
  full_name: string;
  password: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserRequest {
  full_name?: string;
  password?: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface UserListResponse {
  total: number;
  page: number;
  page_size: number;
  items: User[];
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export interface AuditLog {
  id: number;
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  entity: string;
  entity_id?: number;
  old_values?: string;
  new_values?: string;
  timestamp: string;
}

export interface AuditLogListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AuditLog[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface PaginationParams {
  skip: number;
  limit: number;
}
