// src/types/index.ts
import { User, Product, Category, Cart, CartItem, Order, OrderItem } from '@prisma/client'

export type { User, Product, Category, Cart, CartItem, Order, OrderItem }

// Extended types with relations
export type ProductWithCategory = Product & {
  category: Category
}

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product
  })[]
}

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product
  })[]
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  stock: number
  categoryId: string
  imageUrl?: string
}

// NextAuth extended types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
    }
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
  }
}