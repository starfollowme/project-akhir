import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Skema validasi untuk pembaruan status pesanan
const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
})

// GET /api/orders/[id] - Mengambil detail satu pesanan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // PERBAIKAN: Cara yang benar untuk mendapatkan 'id'
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id, // PERBAIKAN: Menggunakan params.id setelah didefinisikan dengan benar
        // Pengguna biasa hanya bisa melihat pesanannya sendiri
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
        // Hanya sertakan info user jika yang meminta adalah admin
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
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Gagal mengambil pesanan:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail pesanan' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Memperbarui status pesanan (Hanya Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status } = updateOrderSchema.parse(body)

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
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
      message: 'Status pesanan berhasil diperbarui'
    })
  } catch (error) {
    console.error('Gagal memperbarui pesanan:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kesalahan validasi',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui pesanan' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Membatalkan pesanan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id })
      },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Pesanan ini tidak dapat dibatalkan lagi' },
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
      message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan'
    })
  } catch (error) {
    console.error('Gagal membatalkan pesanan:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membatalkan pesanan' },
      { status: 500 }
    )
  }
}
