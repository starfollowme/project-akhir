'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Eye, Calendar, DollarSign, Package, User } from 'lucide-react';
import { OrderWithItems } from '@/types';
import { toast } from 'sonner';

export default function HalamanPesananAdmin() {
  const { data: sesi, status } = useSession();
  const router = useRouter();
  const [pesanan, setPesanan] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [halamanSaatIni, setHalamanSaatIni] = useState(1);
  const [paginasi, setPaginasi] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && sesi?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, sesi, router]);

  useEffect(() => {
    if (sesi?.user?.role === 'ADMIN') {
      ambilPesanan();
    }
  }, [sesi, halamanSaatIni]);

  const ambilPesanan = async (
    page = halamanSaatIni,
    search = kataKunci,
    statusF = filterStatus
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: paginasi.limit.toString(),
        ...(search && { search }),
        ...(statusF !== 'ALL' && { status: statusF }),
      });

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setPesanan(data.data.orders);
        setPaginasi(data.data.pagination);
      }
    } catch (error) {
      console.error('Gagal mengambil data pesanan:', error);
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const cariPesanan = (e: React.FormEvent) => {
    e.preventDefault();
    setHalamanSaatIni(1);
    ambilPesanan(1, kataKunci, filterStatus);
  };

  const ubahFilterStatus = (status: string) => {
    setFilterStatus(status);
    setHalamanSaatIni(1);
    ambilPesanan(1, kataKunci, status);
  };

  const ubahStatusPesanan = async (orderId: string, statusBaru: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: statusBaru }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Status pesanan berhasil diperbarui');
        ambilPesanan();
      } else {
        toast.error(data.error || 'Gagal memperbarui status pesanan');
      }
    } catch (error) {
      console.error('Gagal memperbarui status pesanan:', error);
      toast.error('Gagal memperbarui status pesanan');
    }
  };

  const getWarnaStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTanggal = (tanggal: string | Date) => {
    const date = typeof tanggal === 'string' ? new Date(tanggal) : tanggal;
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ✅ Perbaikan: Mendukung number, string, atau Decimal (pakai any untuk aman)
  const formatDollar = (jumlah: any) => {
    let nilai = 0;
    if (jumlah && typeof jumlah.toNumber === 'function') {
      nilai = jumlah.toNumber();
    } else if (typeof jumlah === 'string') {
      nilai = parseFloat(jumlah);
    } else if (typeof jumlah === 'number') {
      nilai = jumlah;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(nilai || 0);
  };

  const ubahHalaman = (page: number) => {
    setHalamanSaatIni(page);
    ambilPesanan(page, kataKunci, filterStatus);
  };

  if (status === 'loading' || loading) {
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
    );
  }

  if (!sesi || sesi.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Pesanan</h1>
          <p className="text-gray-600">Lihat dan kelola semua pesanan pelanggan</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={cariPesanan} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan nomor pesanan atau pelanggan..."
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Cari</Button>
            </form>

            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterStatus} onValueChange={ubahFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="PROCESSING">Diproses</SelectItem>
                  <SelectItem value="SHIPPED">Dikirim</SelectItem>
                  <SelectItem value="DELIVERED">Terkirim</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pesanan ({paginasi.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {pesanan.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Detail Pesanan</th>
                      <th className="text-left p-3">Pelanggan</th>
                      <th className="text-left p-3">Jumlah Item</th>
                      <th className="text-left p-3">Total</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesanan.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">#{p.orderNumber}</p>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatTanggal(p.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{(p as any).user?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-600">{(p as any).user?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>{p.items.length} item</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">
                              {formatDollar(p.total)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Select
                            value={p.status}
                            onValueChange={(statusBaru) => ubahStatusPesanan(p.id, statusBaru)}
                          >
                            <SelectTrigger className="w-32">
                              <Badge className={getWarnaStatus(p.status)}>{p.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Menunggu</SelectItem>
                              <SelectItem value="PROCESSING">Diproses</SelectItem>
                              <SelectItem value="SHIPPED">Dikirim</SelectItem>
                              <SelectItem value="DELIVERED">Terkirim</SelectItem>
                              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/orders/${p.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paginasi.totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => ubahHalaman(halamanSaatIni - 1)}
                    disabled={halamanSaatIni === 1}
                  >
                    Sebelumnya
                  </Button>
                  {[...Array(paginasi.totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={halamanSaatIni === page ? 'default' : 'outline'}
                        onClick={() => ubahHalaman(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => ubahHalaman(halamanSaatIni + 1)}
                    disabled={halamanSaatIni === paginasi.totalPages}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada pesanan</h3>
              <p className="text-gray-600">
                {kataKunci || filterStatus !== 'ALL'
                  ? 'Coba ubah kata kunci atau filter status'
                  : 'Belum ada pesanan yang masuk'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
