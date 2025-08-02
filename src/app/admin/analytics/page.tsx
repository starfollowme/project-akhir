'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  Users,
  BarChart3
} from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

// ==============================
// Tipe Data
// ==============================
interface ProdukTeratas {
  id: string
  name: string
  sales: number
  revenue: number
}

interface PenjualanBulanan {
  month: string
  revenue: number
  orders: number
}

interface StatusPesanan {
  status: string
  count: number
}

interface DataAnalitik {
  totalPendapatan: number
  pertumbuhanPendapatan: number
  totalPesanan: number
  pertumbuhanPesanan: number
  totalProduk: number
  totalPelanggan: number
  rataRataNilaiPesanan: number
  produkTeratas: ProdukTeratas[]
  penjualanBulanan: PenjualanBulanan[]
  pesananBerdasarkanStatus: StatusPesanan[]
}

// ==============================
// Komponen Skeleton Loading
// ==============================
const SkeletonLoader = () => (
  <div className="p-6">
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
)

// ==============================
// Komponen Header
// ==============================
const HeaderSection = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold">{title}</h1>
    {subtitle && <p className="text-gray-600">{subtitle}</p>}
  </div>
)

// ==============================
// Komponen Utama
// ==============================
export default function HalamanAnalitikAdmin() {
  const { data: sesi, status } = useSession()
  const router = useRouter()

  const [analitik, setAnalitik] = useState<DataAnalitik | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rentangWaktu, setRentangWaktu] = useState('30d')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && sesi?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, sesi, router])

  useEffect(() => {
    if (sesi?.user?.role === 'ADMIN') ambilDataAnalitik()
  }, [sesi, rentangWaktu])

  const ambilDataAnalitik = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics?range=${rentangWaktu}`)
      if (!response.ok) throw new Error('Gagal memuat data analitik')

      const data = await response.json()
      if (data.success) {
        setAnalitik({
          totalPendapatan: data.data.totalRevenue || 0,
          pertumbuhanPendapatan: data.data.revenueGrowth || 0,
          totalPesanan: data.data.totalOrders || 0,
          pertumbuhanPesanan: data.data.ordersGrowth || 0,
          totalProduk: data.data.totalProducts || 0,
          totalPelanggan: data.data.totalCustomers || 0,
          rataRataNilaiPesanan: data.data.averageOrderValue || 0,
          produkTeratas: data.data.topProducts || [],
          penjualanBulanan: data.data.salesByMonth || [],
          pesananBerdasarkanStatus: data.data.ordersByStatus || []
        })
      } else throw new Error(data.message || 'Data tidak dapat dimuat')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatMataUang = (jumlah: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(jumlah)

  const formatPertumbuhan = (nilai: number): JSX.Element => {
    const positif = nilai >= 0
    return (
      <div className={`flex items-center ${positif ? 'text-green-600' : 'text-red-600'}`}>
        {positif ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        <span className="text-sm font-medium">{positif ? '+' : ''}{nilai.toFixed(1)}%</span>
      </div>
    )
  }

  const getWarnaStatus = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'PROCESSING': return 'bg-blue-500'
      case 'SHIPPED': return 'bg-purple-500'
      case 'DELIVERED': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (status === 'loading' || loading) return <SkeletonLoader />

  if (error) return (
    <div className="p-6 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={ambilDataAnalitik} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Coba Lagi
      </button>
    </div>
  )

  if (!sesi || sesi.user.role !== 'ADMIN') return null

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <HeaderSection title="Dashboard Analitik" subtitle="Pantau kinerja bisnis Anda" />
        <Select value={rentangWaktu} onValueChange={(val: string) => setRentangWaktu(val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih Rentang Waktu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Hari Terakhir</SelectItem>
            <SelectItem value="30d">30 Hari Terakhir</SelectItem>
            <SelectItem value="90d">90 Hari Terakhir</SelectItem>
            <SelectItem value="1y">1 Tahun Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMataUang(analitik?.totalPendapatan || 0)}</div>
            {formatPertumbuhan(analitik?.pertumbuhanPendapatan || 0)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analitik?.totalPesanan || 0).toLocaleString('en-US')}</div>
            {formatPertumbuhan(analitik?.pertumbuhanPesanan || 0)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nilai Pesanan</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMataUang(analitik?.rataRataNilaiPesanan || 0)}</div>
            <p className="text-xs text-muted-foreground">Rata-rata per pesanan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analitik?.totalPelanggan || 0).toLocaleString('en-US')}</div>
            <p className="text-xs text-muted-foreground">Pengguna terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Konten Analitik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Produk Teratas */}
        <Card>
          <CardHeader><CardTitle>Produk Teratas</CardTitle></CardHeader>
          <CardContent>
            {analitik?.produkTeratas.length ? analitik.produkTeratas.map((produk, index) => (
              <div key={produk.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{produk.name}</p>
                    <p className="text-sm text-gray-600">{produk.sales} sold</p>
                  </div>
                </div>
                <p className="font-medium">{formatMataUang(produk.revenue)}</p>
              </div>
            )) : <p className="text-gray-500 text-center py-4">No sales data</p>}
          </CardContent>
        </Card>

        {/* Pesanan Berdasarkan Status */}
        <Card>
          <CardHeader><CardTitle>Pesanan Berdasarkan Status</CardTitle></CardHeader>
          <CardContent>
            {analitik?.pesananBerdasarkanStatus.map((item) => {
              const persentase = analitik.totalPesanan > 0 ? (item.count / analitik.totalPesanan) * 100 : 0
              return (
                <div key={item.status} className="space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.status.toLowerCase()}</span>
                    <span className="text-sm text-gray-600">{item.count} ({persentase.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getWarnaStatus(item.status)}`} style={{ width: `${persentase}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Grafik Penjualan Bulanan */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Grafik Penjualan Bulanan</CardTitle></CardHeader>
          <CardContent>
            {analitik?.penjualanBulanan.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analitik.penjualanBulanan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatMataUang(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-500 text-center py-8">No monthly data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
