import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Skema validasi untuk memperbarui produk
const updateProductSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive("Harga harus positif").optional(),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif").optional(),
  categoryId: z.string().min(1, "Kategori wajib diisi").optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional()
})

// GET /api/products/[id] - Mengambil detail satu produk
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // PERBAIKAN: Cara yang benar untuk mendapatkan 'id'
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.id // PERBAIKAN: Menggunakan params.id
      },
      include: {
        category: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Gagal mengambil produk:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil produk', details: errorMessage },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Memperbarui produk (Hanya Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } // PERBAIKAN: Cara yang benar untuk mendapatkan 'id'
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
    const validation = updateProductSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json({
            success: false,
            error: "Input tidak valid",
            details: validation.error.flatten().fieldErrors,
        }, { status: 400 });
    }
    
    const validatedData = validation.data

    if (Object.keys(validatedData).length === 0) {
        return NextResponse.json({
            success: false,
            error: "Tidak ada field untuk diperbarui",
        }, { status: 400 });
    }

    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Kategori tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id }, // PERBAIKAN: Menggunakan params.id
      data: validatedData,
      include: {
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Produk berhasil diperbarui'
    })
  } catch (error) {
    console.error('Gagal memperbarui produk:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kesalahan validasi',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui produk', details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Menghapus (mengarsipkan) produk (Hanya Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } // PERBAIKAN: Cara yang benar untuk mendapatkan 'id'
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak' },
        { status: 401 }
      )
    }

    const activeOrdersCount = await prisma.orderItem.count({
        where: {
            productId: params.id, // PERBAIKAN: Menggunakan params.id
            order: {
                status: {
                    in: ['PENDING', 'PROCESSING', 'SHIPPED']
                }
            }
        }
    });

    if (activeOrdersCount > 0) {
        return NextResponse.json({
            success: false,
            error: 'Tidak dapat menghapus produk',
            details: `Produk ini merupakan bagian dari ${activeOrdersCount} pesanan aktif. Harap selesaikan terlebih dahulu.`
        }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: params.id }, // PERBAIKAN: Menggunakan params.id
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil diarsipkan'
    })
  } catch (error) {
    console.error('Gagal menghapus produk:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json(
      { success: false, error: 'Gagal mengarsipkan produk', details: errorMessage },
      { status: 500 }
    )
  }
}
