import { z } from 'zod'

// User Validation
export const userSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['admin', 'user', 'viewer']),
  is_active: z.boolean().default(true),
})

export type UserFormData = z.infer<typeof userSchema>

// Client Validation
export const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\d{10,}$/, 'Telefone inválido'),
  company: z.string().min(2, 'Empresa deve ter no mínimo 2 caracteres').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

// Product Validation
export const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  sku: z.string().min(2, 'SKU inválido'),
  category: z.string().min(2, 'Categoria inválida'),
  price: z.number().positive('Preço deve ser maior que 0'),
  cost: z.number().positive('Custo deve ser maior que 0'),
  stock: z.number().int('Estoque deve ser um número inteiro').min(0),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type ProductFormData = z.infer<typeof productSchema>

// Order Validation
export const orderSchema = z.object({
  client_id: z.number().int('Cliente inválido'),
  total_amount: z.number().positive('Total deve ser maior que 0'),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
  items: z.array(
    z.object({
      product_id: z.number().int(),
      quantity: z.number().int().positive(),
      unit_price: z.number().positive(),
    })
  ),
  notes: z.string().optional(),
})

export type OrderFormData = z.infer<typeof orderSchema>

// Login Validation
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha inválida'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Password Reset
export const passwordResetSchema = z.object({
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Senhas não conferem',
  path: ['confirm_password'],
})

export type PasswordResetData = z.infer<typeof passwordResetSchema>
