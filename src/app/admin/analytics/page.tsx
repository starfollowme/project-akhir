'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  ordersGrowth: number
  totalProducts: number
  totalCustomers: number
  averageOrderValue: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  salesByMonth: Array<{
    month: string
    revenue: number
    orders: number
  }>
  ordersByStatus: Array<{
    status: string
    count: number
  }>
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAnalytics()
    }
  }, [session, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Gagal mengambil data analitik:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN' || !analytics) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{growth.toFixed(1)}%
        </span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dasbor Analitik</h1>
          <p className="text-gray-600">Lacak performa bisnis Anda</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 hari terakhir</SelectItem>
            <SelectItem value="30d">30 hari terakhir</SelectItem>
            <SelectItem value="90d">90 hari terakhir</SelectItem>
            <SelectItem value="1y">1 tahun terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            {formatGrowth(analytics.revenueGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalOrders.toLocaleString('id-ID')}
            </div>
            {formatGrowth(analytics.ordersGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Pesanan Rata-rata</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Rata-rata per pesanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalCustomers.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              Pengguna terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.sales} terjual
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Tidak ada data penjualan</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Berdasarkan Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.ordersByStatus.map((item) => {
                const percentage = analytics.totalOrders > 0 
                  ? (item.count / analytics.totalOrders) * 100 
                  : 0
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'PENDING': return 'bg-yellow-500'
                    case 'PROCESSING': return 'bg-blue-500'
                    case 'SHIPPED': return 'bg-purple-500'
                    case 'DELIVERED': return 'bg-green-500'
                    case 'CANCELLED': return 'bg-red-500'
                    default: return 'bg-gray-500'
                  }
                }

                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {item.status.toLowerCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tinjauan Penjualan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.salesByMonth.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.salesByMonth.map((month) => (
                    <div key={month.month} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{month.month}</span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">
                          {formatCurrency(month.revenue)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {month.orders} pesanan
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Tidak ada data bulanan</p>
            )} 
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
