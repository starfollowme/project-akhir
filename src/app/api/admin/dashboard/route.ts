// src/app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/dashboard
 * Fetches aggregated statistics for the admin dashboard.
 * Requires ADMIN role.
 */
export async function GET() {
  try {
    // 1. Authenticate and Authorize the user
    const session = await getServerSession(authOptions);

    // Ensure the user is logged in and has the 'ADMIN' role
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Fetch all dashboard statistics in parallel for efficiency
    const [
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenueResult, // Renamed to avoid conflict and clarify it's an aggregate result
      recentOrders,
      topProducts
    ] = await Promise.all([
      // Query for the total number of active products
      prisma.product.count({
        where: { isActive: true }
      }),

      // Query for the total number of users with the 'CUSTOMER' role
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),

      // Query for the total number of orders
      prisma.order.count(),

      // Aggregate the total revenue from all orders
      prisma.order.aggregate({
        _sum: {
          total: true
        }
      }),

      // Fetch the 10 most recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: { // Include related user and product details for display
          user: {
            select: {
              name: true,
              email: true
            }
          },
        }
      }),

      // Fetch the top 10 best-selling products
      prisma.product.findMany({
        take: 10,
        where: { isActive: true },
        include: {
          _count: { // Count how many times each product appears in order items
            select: {
              orderItems: true
            }
          }
        },
        orderBy: {
          orderItems: { // Sort products by the number of sales
            _count: 'desc'
          }
        }
      })
    ]);

    // 3. Shape the data for the response payload
    const dashboardData = {
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenueResult._sum.total || 0, // Extract the sum, defaulting to 0
      recentOrders,
      topProducts
    };

    // 4. Return the successful response
    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    // 5. Handle any errors that occur during the process
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
