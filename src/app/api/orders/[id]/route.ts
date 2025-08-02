import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validasi status
const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

// 🔍 Utility untuk ubah Decimal ke number
function sanitizeOrder(order: any) {
  if (!order) return null;
  return {
    ...order,
    total: Number(order.total),
    items: order.items.map((item: any) => ({
      ...item,
      price: Number(item.price),
    })),
  };
}

// ✅ GET /api/orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id }),
      },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
        user:
          session.user.role === 'ADMIN'
            ? { select: { id: true, name: true, email: true } }
            : undefined,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: sanitizeOrder(order),
    });
  } catch (error) {
    console.error('Gagal mengambil pesanan:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil detail pesanan' }, { status: 500 });
  }
}

// ✅ PUT /api/orders/[id] (Admin Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = updateOrderSchema.parse(body);

    const existingOrder = await prisma.order.findUnique({ where: { id: params.id } });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: sanitizeOrder(updatedOrder),
      message: 'Status pesanan berhasil diperbarui',
    });
  } catch (error) {
    console.error('Gagal memperbarui pesanan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Kesalahan validasi', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Gagal memperbarui pesanan' }, { status: 500 });
  }
}

// ✅ DELETE /api/orders/[id] - Membatalkan pesanan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id }),
      },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Pesanan ini tidak dapat dibatalkan lagi' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan',
    });
  } catch (error) {
    console.error('Gagal membatalkan pesanan:', error);
    return NextResponse.json({ success: false, error: 'Gagal membatalkan pesanan' }, { status: 500 });
  }
}
