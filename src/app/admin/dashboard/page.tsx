
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, Eye, Plus, BarChart3 } from 'lucide-react';


interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number | string; 
  recentOrders: any[];
  topProducts: any[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

 
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchDashboardStats();
    }
  }, [status, session]);

  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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

  
  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
     
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Active products in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Orders placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
           
            <div className="text-2xl font-bold">${stats?.totalRevenue ? Number(stats.totalRevenue).toFixed(2) : '0.00'}</div>
            <p className="text-xs text-muted-foreground">Total sales revenue</p>
          </CardContent>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="outline" className="w-full h-20 flex-col">
            <Package className="w-6 h-6 mb-2" />
            Manage Products
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full h-20 flex-col">
            <ShoppingCart className="w-6 h-6 mb-2" />
            View Orders
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline" className="w-full h-20 flex-col">
            <Users className="w-6 h-6 mb-2" />
            Manage Users
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button variant="outline" className="w-full h-20 flex-col">
            <BarChart3 className="w-6 h-6 mb-2" />
            Analytics
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800'
                        : order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800'
                        : order.status === 'DELIVERED' ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>

        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Products</CardTitle>
              <Link href="/admin/products">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">{index + 1}</div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(product.price).toFixed(2)}</p>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {product._count?.orderItems || 0} sold
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No product data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
