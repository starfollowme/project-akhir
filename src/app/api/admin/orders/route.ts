// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
})

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
        // Regular users can only see their own orders
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id })
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        user: session.user.role === 'ADMIN' ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : false
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order', details: errorMessage },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateOrderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { status } = validation.data

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (existingOrder.status === 'DELIVERED' || existingOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: `Cannot update a ${existingOrder.status.toLowerCase()} order.` },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Error updating order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    // ✨ FIXED: Menambahkan detail error untuk debugging
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update order status',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
      },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { success: false, error: 'You are not authorized to cancel this order' },
            { status: 403 }
        );
    }

    const canBeCancelled = order.status === 'PENDING' || order.status === 'PROCESSING';
    if (!canBeCancelled) {
      return NextResponse.json(
        { success: false, error: `This order cannot be cancelled as it is already ${order.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' }
      })

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    
    // ✨ FIXED: Menambahkan detail error untuk debugging
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cancel order',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
