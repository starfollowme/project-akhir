'use client'

// ============================
// Konfigurasi Render Dinamis
// ============================
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react'

// ============================
// Tipe Data untuk Dashboard
// ============================

interface Pesanan {
  id: string
  orderNumber: string
  createdAt: string
  total: number | string
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | string
}

interface Produk {
  id: string
  name: string
  price: number | string
  stock: number
  _count?: {
    orderItems?: number
  }
}

interface StatistikDashboard {
  totalProduk: number
  totalPengguna: number
  totalPesanan: number
  totalPendapatan: number | string
  pesananTerbaru: Pesanan[]
  produkTeratas: Produk[]
}

// ============================
// Komponen Utama Dashboard
// ============================

export default function DashboardAdmin() {
  const { data: sesi, status } = useSession()
  const router = useRouter()

  // State
  const [statistik, setStatistik] = useState<StatistikDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============================
  // Cek Autentikasi dan Role
  // ============================
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && sesi?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, sesi, router])

  // ============================
  // Ambil Data Dashboard
  // ============================
  useEffect(() => {
    if (status === 'authenticated' && sesi?.user?.role === 'ADMIN') {
      ambilStatistikDashboard()
    }
  }, [status, sesi])

  const ambilStatistikDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/dashboard')

      if (!response.ok) {
        throw new Error('Gagal mengambil data dashboard')
      }

      const data = await response.json()

      if (data.success) {
        setStatistik({
          totalProduk: data.data.totalProducts || 0,
          totalPengguna: data.data.totalUsers || 0,
          totalPesanan: data.data.totalOrders || 0,
          totalPendapatan: data.data.totalRevenue || 0,
          pesananTerbaru: data.data.recentOrders || [],
          produkTeratas: data.data.topProducts || []
        })
      } else {
        throw new Error(data.message || 'Terjadi kesalahan saat memuat data')
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Terjadi kesalahan tak terduga')
    } finally {
      setLoading(false)
    }
  }

  // ============================
  // Fungsi Bantu
  // ============================

  // Kurs konversi: 1 USD = Rp 15.000
  const RATE_USD = 15000

  // Format angka ke USD
  const formatMataUang = (jumlah: number | string): string => {
    const nilaiRupiah = typeof jumlah === 'string' ? parseFloat(jumlah) : jumlah
    const nilaiUSD = nilaiRupiah / RATE_USD
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(nilaiUSD || 0)
  }

  // Warna badge status pesanan
  const getKelasStatus = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format tanggal ke bahasa Indonesia
  const formatTanggal = (tanggal: string): string => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // ============================
  // State Loading
  // ============================
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================
  // Tampilkan Error Jika Ada
  // ============================
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={ambilStatistikDashboard}>Coba Lagi</Button>
      </div>
    )
  }

  if (!sesi || sesi.user.role !== 'ADMIN') {
    return null
  }

  // ============================
  // Konten Dashboard
  // ============================
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-gray-600">Selamat datang, {sesi.user.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Produk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik?.totalProduk || 0}</div>
            <p className="text-xs text-muted-foreground">Produk aktif di katalog</p>
          </CardContent>
        </Card>

        {/* Total Pengguna */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik?.totalPengguna || 0}</div>
            <p className="text-xs text-muted-foreground">Pelanggan terdaftar</p>
          </CardContent>
        </Card>

        {/* Total Pesanan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistik?.totalPesanan || 0}</div>
            <p className="text-xs text-muted-foreground">Pesanan yang dibuat</p>
          </CardContent>
        </Card>

        {/* Total Pendapatan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMataUang(statistik?.totalPendapatan || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pendapatan keseluruhan</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigasi Cepat */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="outline" className="w-full h-20 flex-col">
            <Package className="w-6 h-6 mb-2" />
            Kelola Produk
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full h-20 flex-col">
            <ShoppingCart className="w-6 h-6 mb-2" />
            Lihat Pesanan
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline" className="w-full h-20 flex-col">
            <Users className="w-6 h-6 mb-2" />
            Kelola Pengguna
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button variant="outline" className="w-full h-20 flex-col">
            <BarChart3 className="w-6 h-6 mb-2" />
            Analitik
          </Button>
        </Link>
      </div>

      {/* Pesanan Terbaru & Produk Teratas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pesanan Terbaru */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pesanan Terbaru</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {statistik?.pesananTerbaru && statistik.pesananTerbaru.length > 0 ? (
              <div className="space-y-4">
                {statistik.pesananTerbaru.slice(0, 5).map((pesanan) => (
                  <div key={pesanan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">#{pesanan.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {formatTanggal(pesanan.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMataUang(pesanan.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getKelasStatus(pesanan.status)}`}>
                        {pesanan.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada pesanan terbaru</p>
            )}
          </CardContent>
        </Card>

        {/* Produk Teratas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produk Teratas</CardTitle>
              <Link href="/admin/products">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {statistik?.produkTeratas && statistik.produkTeratas.length > 0 ? (
              <div className="space-y-4">
                {statistik.produkTeratas.slice(0, 5).map((produk, index) => (
                  <div key={produk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{produk.name}</p>
                        <p className="text-sm text-gray-600">Stok: {produk.stock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMataUang(produk.price)}</p>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {produk._count?.orderItems || 0} terjual
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada data produk</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
