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

    // Menentukan kondisi filter berdasarkan peran pengguna
    const where: Prisma.OrderWhereInput =
      session.user.role === 'ADMIN' ? {} : { userId: session.user.id };

    // Menggunakan transaksi untuk mengambil data pesanan dan total hitungan secara konsisten
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          // Secara kondisional menyertakan detail pengguna untuk admin
          user: session.user.role === 'ADMIN' ? {
            select: { id: true, name: true, email: true }
          } : undefined,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
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

    // Ambil keranjang pengguna beserta item dan detail produk
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

    // Gunakan transaksi untuk memastikan atomisitas: pembuatan pesanan, pembaruan stok, dan pembersihan keranjang.
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Cek ketersediaan stok untuk semua item sebelum melanjutkan
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          // Dengan melempar error, transaksi akan otomatis dibatalkan (rollback).
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }
      }

      // 2. Hitung total harga
      const total = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

      // 3. Buat nomor pesanan yang lebih kuat
      const orderNumber = `ORD-${Date.now()}-${userId.substring(0, 4)}`;

      // 4. Buat pesanan baru
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          total,
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

      // 5. Perbarui stok produk untuk setiap item dalam pesanan
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
      
      // 6. Bersihkan keranjang pengguna
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Ambil data pesanan lengkap dengan semua relasi untuk dikembalikan ke klien
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

    return NextResponse.json(
      {
        success: true,
        data: completeOrder,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    // Cek apakah error berasal dari Prisma atau error stok kustom kita
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create order';
    const statusCode = errorMessage.startsWith('Insufficient stock') ? 400 : 500;

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}
