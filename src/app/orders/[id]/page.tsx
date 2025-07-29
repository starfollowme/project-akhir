
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Package, 
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  Eye,
  Printer
} from 'lucide-react'
import { OrderWithItems } from '@/types'
import { toast } from 'sonner'

export default function AdminOrderDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<(OrderWithItems & { user: any }) | null>(null)
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
        toast.error('Order not found')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
        toast.success('Order status updated successfully')
      } else {
        toast.error(data.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const printOrder = () => {
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

  const subtotal = order.items.reduce((sum, item) => {
    return sum + (Number(item.price) * item.quantity)
  }, 0)

  return (
    <div className="p-6">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div className="border-l h-6"></div>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={printOrder}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
         
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium">Order Status</label>
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-600">
                  Last updated: {formatDate(order.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

         
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{order.user?.name || 'No Name'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{order.user?.email}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Customer since: {formatDate(order.user?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
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
                        <p>SKU: {item.product.id.slice(-8).toUpperCase()}</p>
                        <p>Price at purchase: ${Number(item.price).toFixed(2)}</p>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                      <Link href={`/admin/products/${item.product.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Product
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

       
        <div className="space-y-6">
         
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${(Number(order.total) - subtotal > 0 ? Number(order.total) - subtotal : 0).toFixed(2)}</span>
              </div>
              
              <hr />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                
                {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Status Updated</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/admin/users/${order.user?.id}`)}
              >
                <User className="w-4 h-4 mr-2" />
                View Customer
              </Button>
              
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              
              <Button variant="outline" className="w-full" onClick={printOrder}>
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}