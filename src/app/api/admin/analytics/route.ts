// src/app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Calculate previous period for growth comparison
    const periodLength = now.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime())

    // Get current period data
    const [
      currentOrders,
      previousOrders,
      totalProducts,
      totalCustomers,
      topProducts,
      ordersByStatus
    ] = await Promise.all([
      // Current period orders
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        select: {
          total: true,
          createdAt: true
        }
      }),

      // Previous period orders
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: previousEndDate
          }
        },
        select: {
          total: true
        }
      }),

      // Total active products
      prisma.product.count({
        where: { isActive: true }
      }),

      // Total customers
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),

      // Top products by sales
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
          price: true
        },
        _count: {
          productId: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: now
          }
        }
      })
    ])

    // Calculate metrics
    const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0)
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0)
    
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const ordersGrowth = previousOrders.length > 0 
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 
      : 0

    const averageOrderValue = currentOrders.length > 0 
      ? currentRevenue / currentOrders.length 
      : 0

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        })
        return {
          id: item.productId,
          name: product?.name || 'Unknown Product',
          sales: item._sum.quantity || 0,
          revenue: Number(item._sum.price || 0) * (item._sum.quantity || 0)
        }
      })
    )

    // Generate monthly sales data
    const salesByMonth = []
    const monthsToShow = range === '1y' ? 12 : range === '90d' ? 3 : 1
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        select: {
          total: true
        }
      })

      const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total), 0)
      
      salesByMonth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrders.length
      })
    }

    const analyticsData = {
      totalRevenue: currentRevenue,
      revenueGrowth,
      totalOrders: currentOrders.length,
      ordersGrowth,
      totalProducts,
      totalCustomers,
      averageOrderValue,
      topProducts: topProductsWithDetails,
      salesByMonth,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      }))
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}