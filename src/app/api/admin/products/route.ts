// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// ✅ GET: Ambil semua produk untuk admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (category) where.category = { slug: category };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ✅ POST: Tambah produk baru
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, stock, categoryId, imageUrl } = body;

    // ✅ Validasi input
    if (!name || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json({ success: false, error: 'Name, price, stock, and categoryId are required.' }, { status: 400 });
    }

    if (isNaN(price) || isNaN(stock)) {
      return NextResponse.json({ success: false, error: 'Price and stock must be numeric.' }, { status: 400 });
    }

    // ✅ Simpan ke database
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: new Prisma.Decimal(price),
        stock: Number(stock),
        categoryId,
        imageUrl: imageUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create product', details: errorMessage },
      { status: 500 }
    );
  }
}
