// src/app/admin/orders/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Package, 
  Calendar,
  User,
  Mail,
  Edit,
  Eye,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminOrderDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' && orderId) {
      fetchOrderDetails()
    }
  }, [session, orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
      } else {
        toast.error('Pesanan tidak ditemukan')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Gagal memuat detail pesanan:', error)
      toast.error('Gagal memuat detail pesanan')
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (statusBaru: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusBaru })
      })

      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
        toast.success('Status pesanan berhasil diperbarui')
      } else {
        toast.error(data.error || 'Gagal memperbarui status pesanan')
      }
    } catch (error) {
      console.error('Gagal memperbarui status pesanan:', error)
      toast.error('Gagal memperbarui status pesanan')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTanggal = (tanggalInput: string | Date | undefined) => {
    if (!tanggalInput) return '-'
    const tanggal = typeof tanggalInput === 'string' ? new Date(tanggalInput) : tanggalInput
    return tanggal.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const cetakPesanan = () => {
    window.print()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN' || !order) {
    return null
  }

  const subtotal = order.items.reduce((sum: number, item: any) => {
    return sum + (Number(item.price) * item.quantity)
  }, 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Pesanan
            </Button>
          </Link>
          <div className="border-l h-6"></div>
          <div>
            <h1 className="text-2xl font-bold">Pesanan #{order.orderNumber}</h1>
            <p className="text-gray-600">
              Dibuat pada {formatTanggal(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={cetakPesanan}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Pesanan */}
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium">Status Pesanan</label>
                  <Select
                    value={order.status}
                    onValueChange={updateOrderStatus}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-48">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Menunggu</SelectItem>
                      <SelectItem value="PROCESSING">Diproses</SelectItem>
                      <SelectItem value="SHIPPED">Dikirim</SelectItem>
                      <SelectItem value="DELIVERED">Selesai</SelectItem>
                      <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-600">
                  Terakhir diperbarui: {formatTanggal(order.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informasi Pelanggan */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{order.user?.name || 'Tanpa Nama'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{order.user?.email}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Pelanggan sejak: {formatTanggal(order.user?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Pesanan */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Produk ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/admin/products/${item.product.id}/edit`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Kode: {item.product.id.slice(-8).toUpperCase()}</p>
                        <p>Harga: ${Number(item.price).toLocaleString('en-US')}</p>
                        <p>Qty: {item.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        ${ (Number(item.price) * item.quantity).toLocaleString('en-US') }
                      </p>
                      <Link href={`/admin/products/${item.product.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Produk
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ringkasan Pesanan */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${ subtotal.toLocaleString('en-US') }</span>
              </div>
              
              <div className="flex justify-between">
                <span>Ongkir</span>
                <span>${ (Number(order.total) - subtotal > 0 ? Number(order.total) - subtotal : 0).toLocaleString('en-US') }</span>
              </div>
              
              <hr />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${ Number(order.total).toLocaleString('en-US') }</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Pesanan */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pesanan Dibuat</p>
                    <p className="text-sm text-gray-600">
                      {formatTanggal(order.createdAt)}
                    </p>
                  </div>
                </div>
                
                {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Status Diperbarui</p>
                      <p className="text-sm text-gray-600">
                        {formatTanggal(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aksi Cepat */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/admin/users/${order.user?.id}`)}
              >
                <User className="w-4 h-4 mr-2" />
                Lihat Pelanggan
              </Button>
              
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Kirim Email
              </Button>
              
              <Button variant="outline" className="w-full" onClick={cetakPesanan}>
                <Printer className="w-4 h-4 mr-2" />
                Cetak Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
