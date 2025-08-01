import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Skema validasi untuk membuat produk baru menggunakan Zod
const createProductSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Harga harus bernilai positif'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  categoryId: z.string().min(1, 'Kategori wajib diisi'),
  imageUrl: z.string().url('URL gambar tidak valid').optional().nullable(),
})

// GET /api/products - Menangani permintaan untuk publik dan admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // Hanya digunakan oleh admin

    const skip = (page - 1) * limit
    const where: any = {}

    // Logika Kondisional:
    // Jika bukan admin, paksa hanya tampilkan produk yang aktif.
    // Jika admin, tampilkan semua kecuali ada filter status.
    if (!isAdmin) {
      where.isActive = true
    } else {
      if (status === 'active') {
        where.isActive = true
      } else if (status === 'inactive') {
        where.isActive = false
      }
    }

    // Filter umum untuk publik dan admin
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
          // Hanya sertakan data tambahan jika itu admin
          ...(isAdmin && {
            _count: {
              select: {
                reviews: true,
                orderItems: true
              }
            }
          })
        },
        skip,
        take: limit,
        // Urutan berbeda untuk admin
        orderBy: isAdmin
          ? [{ isActive: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }

    // Jika admin, sertakan statistik tambahan
    if (isAdmin) {
      const statsResult = await prisma.product.groupBy({
        by: ['isActive'],
        _count: { isActive: true }
      })
      const activeCount = statsResult.find(s => s.isActive === true)?._count.isActive || 0
      const inactiveCount = statsResult.find(s => s.isActive === false)?._count.isActive || 0
      
      return NextResponse.json({
        success: true,
        data: {
          products,
          pagination,
          stats: {
            total: activeCount + inactiveCount,
            active: activeCount,
            inactive: inactiveCount
          }
        }
      })
    }

    // Respon standar untuk publik
    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination
      }
    })

  } catch (error) {
    console.error('Gagal mengambil produk:', error)
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

// POST /api/products - Membuat produk baru (hanya admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kesalahan validasi',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }
    
    const validatedData = validation.data

    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Kategori tidak ditemukan' },
        { status: 404 }
      )
    }

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        imageUrl: validatedData.imageUrl || null,
        isActive: true, // Produk baru otomatis aktif
      },
      include: { category: true }
    })

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Produk berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Gagal membuat produk:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json(
      { success: false, error: 'Gagal membuat produk', details: errorMessage },
      { status: 500 }
    )
  }
}
