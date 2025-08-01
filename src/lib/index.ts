// src/types/index.ts
import { User, Product, Category, Cart, CartItem, Order, OrderItem } from '@prisma/client'

export type { User, Product, Category, Cart, CartItem, Order, OrderItem }

// Extended types with relations
export type ProductWithCategory = Product & {
  category: Category
}

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: ProductWithCategory
  })[]
}

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product
  })[]
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export type CategoryWithCount = Category & {
  _count: {
    products: number
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
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
  isActive?: boolean
}

export interface CategoryFormData {
  name: string
  slug: string
}

export interface UserProfileData {
  name: string
  email: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Cart types
export interface CartItemData {
  productId: string
  quantity: number
}

export interface CartSummary {
  subtotal: number
  shipping: number
  tax: number
  total: number
  itemCount: number
}

// Order types
export interface OrderSummary {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export interface OrderItemData {
  productId: string
  quantity: number
  price: number
}

// Dashboard types
export interface DashboardStats {
  totalProducts: number
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  monthlyRevenue: number[]
  topProducts: ProductWithCategory[]
  recentOrders: OrderWithItems[]
  lowStockProducts: ProductWithCategory[]
}

// Search and filter types
export interface ProductFilters {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock'
  sortOrder?: 'asc' | 'desc'
}

export interface OrderFilters {
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
  userId?: string
}

// Enum types
export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// UI Component types
export interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  onSort?: (key: string, order: 'asc' | 'desc') => void
  sortKey?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

// Notification types
export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// Analytics types
export interface SalesData {
  date: string
  revenue: number
  orders: number
  customers: number
}

export interface ProductAnalytics {
  productId: string
  name: string
  views: number
  purchases: number
  revenue: number
  conversionRate: number
}

// File upload types
export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
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

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]

// Error types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  code: string
  message: string
  details?: ValidationError[]
}

// Database query types
export interface QueryOptions {
  include?: Record<string, boolean | QueryOptions>
  select?: Record<string, boolean>
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
}

// Event types for analytics
export interface TrackingEvent {
  event: string
  properties: Record<string, any>
  userId?: string
  timestamp: Date
}

// Configuration types
export interface AppConfig {
  siteName: string
  siteUrl: string
  supportEmail: string
  currency: string
  locale: string
  timezone: string
  features: {
    reviews: boolean
    wishlist: boolean
    multiCurrency: boolean
    inventory: boolean
  }
}