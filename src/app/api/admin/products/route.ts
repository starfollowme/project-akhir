import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/products - Mengambil semua produk untuk admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak - Diperlukan akses Admin' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { 
          category: true,
          _count: {
            select: {
              reviews: true,
              orderItems: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.product.count({ where })
    ])

    const stats = await prisma.product.groupBy({
      by: ['isActive'],
      _count: {
        isActive: true
      }
    })

    const activeCount = stats.find(s => s.isActive === true)?._count.isActive || 0
    const inactiveCount = stats.find(s => s.isActive === false)?._count.isActive || 0

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total: activeCount + inactiveCount,
          active: activeCount,
          inactive: inactiveCount
        }
      }
    })
  } catch (error) {
    console.error('Gagal mengambil produk admin:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengambil produk', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Membuat produk baru
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak - Diperlukan akses Admin' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, stock, categoryId, imageUrl } = body;

    if (!name || !price || !stock || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap. Nama, harga, stok, dan kategori wajib diisi.' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId,
        imageUrl,
        isActive: true, // Produk baru otomatis aktif
      },
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Gagal membuat produk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal membuat produk', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
