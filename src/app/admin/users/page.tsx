'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Mail,
  User,
  Shield,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  createdAt: Date
  updatedAt: Date
  _count?: {
    orders: number
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchUsers = useCallback(async (page: number, search: string, role: string) => {
    if (session?.user?.role !== 'ADMIN') return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(role && role !== 'ALL' && { role })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) })))
        setPagination(data.data.pagination)
      } else {
        toast.error(data.error || 'Gagal memuat pengguna');
      }
    } catch (error) {
      console.error('Gagal mengambil data pengguna:', error)
      toast.error('Gagal memuat pengguna')
    } finally {
      setLoading(false)
    }
  }, [session, pagination.limit])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers(currentPage, searchTerm, roleFilter)
    }
  }, [status, session, currentPage, searchTerm, roleFilter, fetchUsers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handleRoleChange = (role: string) => {
    setRoleFilter(role)
    setCurrentPage(1)
  }

  const updateUserRole = async (userId: string, newRole: 'ADMIN' | 'CUSTOMER') => {
    if (userId === session?.user?.id) {
      toast.error("Anda tidak dapat mengubah peran Anda sendiri.")
      return
    }

    const originalUsers = [...users]
    setUsers(currentUsers =>
      currentUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Gagal memperbarui peran');
      }
      toast.success('Peran pengguna berhasil diperbarui.')
    } catch (error: any) {
      console.error('Gagal memperbarui peran pengguna:', error)
      toast.error(`Pembaruan gagal: ${error.message}`)
      setUsers(originalUsers);
    }
  }

  const deleteUser = async (userToDelete: User) => {
    if (userToDelete.id === session?.user?.id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri.")
      return
    }

    const originalUsers = [...users]
    setUsers(currentUsers => currentUsers.filter(u => u.id !== userToDelete.id))

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal menghapus pengguna')
      }

      toast.success(`Pengguna ${userToDelete.name || userToDelete.email} telah dihapus.`)
      fetchUsers(currentPage, searchTerm, roleFilter)
    } catch (error: any) {
      console.error('Gagal menghapus pengguna:', error)
      toast.error(`Penghapusan gagal: ${error.message}`)
      setUsers(originalUsers)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPagination = () => {
    const pages = []
    const totalPages = pagination.totalPages
    const page = currentPage

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 4) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) pages.push(i)
      }
      if (page < totalPages - 3) pages.push('...')
      pages.push(totalPages)
    }

    return pages.map((p, index) =>
      typeof p === 'number' ? (
        <Button key={index} variant={currentPage === p ? 'default' : 'outline'} size="icon" onClick={() => handlePageChange(p)}>
          {p}
        </Button>
      ) : (
        <span key={index} className="flex items-center justify-center w-9 h-9">
          {p}
        </span>
      )
    )
  }

  if (status === 'loading' || (loading && users.length === 0)) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'authenticated' && session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h1>
          <p className="text-gray-600">Lihat, kelola, dan cari pengguna sistem.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Cari</Button>
            </form>

            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={roleFilter} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Semua Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Peran</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CUSTOMER">Pelanggan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Pengguna ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-gray-600">Pengguna</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Peran</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Pesanan</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Bergabung</th>
                      <th className="text-right p-3 font-semibold text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name || 'Tanpa Nama'}</p>
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3 h-3 mr-1.5" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Select
                            value={user.role}
                            onValueChange={(newRole: 'ADMIN' | 'CUSTOMER') => updateUserRole(user.id, newRole)}
                            disabled={user.id === session?.user?.id}
                          >
                            <SelectTrigger className="w-36 border-none focus:ring-0 bg-transparent p-0">
                              <Badge className={`${getRoleColor(user.role)} font-medium`}>
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center"><Shield className="w-4 h-4 mr-2" /> Admin</div>
                              </SelectItem>
                              <SelectItem value="CUSTOMER">
                                <div className="flex items-center"><User className="w-4 h-4 mr-2" /> Pelanggan</div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-700">{user._count?.orders || 0} pesanan</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/${user.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteUser(user)} disabled={user.id === session?.user?.id} className="text-red-500 hover:text-red-600 hover:bg-red-100">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Sebelumnya
                  </Button>
                  {renderPagination()}
                  <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages}>
                    Berikutnya
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-700">Tidak Ada Pengguna yang Ditemukan</h3>
              <p className="text-gray-500">
                {searchTerm || (roleFilter && roleFilter !== 'ALL')
                  ? 'Coba sesuaikan kriteria pencarian atau filter Anda.'
                  : 'Belum ada pengguna di sistem.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
