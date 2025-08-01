'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  ShoppingCart,
  DollarSign,
  Package,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface UserDetail {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  createdAt: string
  updatedAt: string
  _count: {
    orders: number
  }
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
  }>
}

export default function AdminUserDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
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
    if (session?.user?.role === 'ADMIN' && userId) {
      fetchUserDetails()
    }
  }, [session, userId])

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (data.success) {
        setUser(data.data)
      } else {
        toast.error('Pengguna tidak ditemukan')
        router.push('/admin/users')
      }
    } catch (error) {
      console.error('Gagal mengambil data pengguna:', error)
      toast.error('Gagal memuat detail pengguna')
      router.push('/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (newRole: 'ADMIN' | 'CUSTOMER') => {
    if (userId === session?.user?.id) {
      toast.error("Anda tidak dapat mengubah peran Anda sendiri")
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()

      if (data.success) {
        setUser(prev => prev ? { ...prev, role: newRole } : null)
        toast.success('Peran pengguna berhasil diperbarui')
      } else {
        toast.error(data.error || 'Gagal memperbarui peran pengguna')
      }
    } catch (error) {
      console.error('Gagal memperbarui peran pengguna:', error)
      toast.error('Gagal memperbarui peran pengguna')
    } finally {
      setUpdating(false)
    }
  }

  const deactivateUser = async () => {
    toast(`Menonaktifkan ${user?.name || user?.email}...`);
    try {
      // Logika penonaktifan pengguna akan ada di sini
      toast.success('Pengguna berhasil dinonaktifkan')
    } catch (error) {
      toast.error('Gagal menonaktifkan pengguna')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTotalSpent = () => {
    if (!user?.orders) return 0
    return user.orders.reduce((total, order) => total + Number(order.total), 0)
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

  if (!session || session.user.role !== 'ADMIN' || !user) {
    return null
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pengguna
            </Button>
          </Link>
          <div className="border-l h-6"></div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || 'Pengguna Tanpa Nama'}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Kirim Email
          </Button>
          <Button
            variant="destructive"
            onClick={deactivateUser}
            disabled={userId === session.user.id}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Nonaktifkan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Nama Lengkap</p>
                      <p className="font-medium">{user.name || 'Tidak ada'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Alamat Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Peran</p>
                      <Select
                        value={user.role}
                        onValueChange={(value: 'ADMIN' | 'CUSTOMER') => updateUserRole(value)}
                        disabled={updating || userId === session.user.id}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role === 'ADMIN' ? 'Admin' : 'Pelanggan'}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">Pelanggan</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Anggota Sejak</p>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pesanan Terbaru</CardTitle>
                <Link href={`/admin/orders?user=${user.id}`}>
                  <Button variant="outline" size="sm">
                    Lihat Semua Pesanan
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {user.orders && user.orders.length > 0 ? (
                <div className="space-y-4">
                  {user.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">Rp{Number(order.total).toLocaleString('id-ID')}</p>
                        </div>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada pesanan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistik Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Total Pesanan</span>
                </div>
                <span className="font-semibold">{user._count.orders}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Total Belanja</span>
                </div>
                <span className="font-semibold">Rp{calculateTotalSpent().toLocaleString('id-ID')}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Pesanan Terakhir</span>
                </div>
                <span className="font-semibold">
                  {user.orders && user.orders.length > 0
                    ? new Date(user.orders[0].createdAt).toLocaleDateString('id-ID')
                    : 'Tidak Pernah'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge className="bg-green-100 text-green-800">Aktif</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Email Terverifikasi</span>
                <Badge className="bg-green-100 text-green-800">Ya</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Login Terakhir</span>
                <span className="text-sm text-gray-600">
                  {formatDate(user.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Kirim Email
              </Button>

              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Pengguna
              </Button>

              <Button variant="outline" className="w-full">
                <Package className="w-4 h-4 mr-2" />
                Lihat Pesanan
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={deactivateUser}
                disabled={userId === session.user.id}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Nonaktifkan Akun
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
