// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Handler untuk GET /api/orders
 * Mengambil daftar pesanan pengguna dengan paginasi.
 * Admin dapat melihat semua pesanan.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Filter berdasarkan role
    const where: Prisma.OrderWhereInput =
      session.user.role === 'ADMIN' ? {} : { userId: session.user.id };

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user:
            session.user.role === 'ADMIN'
              ? { select: { id: true, name: true, email: true, createdAt: true } }
              : undefined,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    // ✅ Ubah Decimal ke number
    const sanitizedOrders = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: sanitizedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * Handler untuk POST /api/orders
 * Membuat pesanan baru dari keranjang belanja pengguna.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Ambil keranjang user
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Your cart is empty' },
        { status: 400 }
      );
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Cek stok
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }
      }

      // Hitung total
      const total = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

      // Nomor pesanan unik
      const orderNumber = `ORD-${Date.now()}-${userId.substring(0, 4)}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          total, // sudah number
          status: 'PENDING',
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      // Update stok
      await Promise.all(
        cart.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        )
      );

      // Hapus keranjang
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Ambil data lengkap
    const completeOrder = await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    // ✅ Ubah Decimal ke number
    const sanitizedOrder = completeOrder
      ? {
          ...completeOrder,
          total: Number(completeOrder.total),
          items: completeOrder.items.map((item) => ({
            ...item,
            price: Number(item.price),
          })),
        }
      : null;

    return NextResponse.json(
      {
        success: true,
        data: sanitizedOrder,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create order';
    const statusCode = errorMessage.startsWith('Insufficient stock') ? 400 : 500;

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}
