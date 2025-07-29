
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, DollarSign, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { OrderWithItems } from '@/types';


type OrderItemWithProduct = OrderWithItems['items'][number];

export default function OrdersPage() {
  const { data: session ,status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/orders');
    }
  }, [status, router]);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?page=${page}&limit=${pagination.limit}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.error || 'Gagal memuat pesanan.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Terjadi kesalahan saat memuat pesanan.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]); 

  
  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, fetchOrders]);

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { // Menggunakan format lokal Indonesia
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
       
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pesanan Saya</h1>
          <p className="text-gray-600">Lacak dan kelola riwayat pesanan Anda</p>
        </div>

        {orders.length > 0 ? (
          <>
           
            <div className="space-y-6">
              {orders.map((order: OrderWithItems) => (
                <Card
                  key={order.id}
                  className="overflow-hidden"
                >
                  <CardHeader className="bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Pesanan #{order.orderNumber}</CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <div className="text-right">
                          <div className="flex items-center text-lg font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {Number(order.total).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    
                    <div className="space-y-3">
                      {order.items.slice(0, 3).map((item: OrderItemWithProduct) => (
                        <div
                          key={item.id} 
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">
                              Jml: {item.quantity} × ${Number(item.price).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}

                      {order.items.length > 3 && (
                        <div className="text-sm text-gray-600 pt-2 border-t">
                          dan {order.items.length - 3} item lainnya...
                        </div>
                      )}
                    </div>

                    
                    <div className="flex justify-between items-center pt-4 mt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>
                          {order.status === 'DELIVERED' ? 'Terkirim' : order.status === 'SHIPPED' ? 'Dalam Perjalanan' : order.status === 'PROCESSING' ? 'Sedang Disiapkan' : order.status === 'PENDING' ? 'Pesanan Diterima' : 'Status Tidak Diketahui'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </Button>

                        {order.status === 'DELIVERED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}/review`)}
                          >
                            Tulis Ulasan
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

           
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fetchOrders(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Sebelumnya
                </Button>

                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? 'default' : 'outline'}
                      onClick={() => fetchOrders(page)}
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  onClick={() => fetchOrders(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </>
        ) : (
          
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Belum ada pesanan</h2>
            <p className="text-gray-600 mb-6">Saat Anda membuat pesanan pertama, pesanan akan muncul di sini.</p>
            <Button
              size="lg"
              onClick={() => router.push('/products')}
            >
              Mulai Belanja
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
