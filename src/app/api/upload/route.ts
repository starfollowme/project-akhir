import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak - Diperlukan akses Admin' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diberikan' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Jenis file tidak valid. Hanya JPEG, PNG, WebP, dan GIF yang diizinkan.' },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File terlalu besar. Ukuran maksimal adalah 5MB.' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `produk-${timestamp}-${randomString}.${fileExtension}`

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, fileName)
    
    await writeFile(filePath, buffer)

    // URL yang akan digunakan di frontend, relatif terhadap folder public
    const imageUrl = `/uploads/products/${fileName}`

    // PERBAIKAN: Mengembalikan URL langsung di level atas agar mudah diakses
    return NextResponse.json({
      success: true,
      url: imageUrl, // <-- Diubah dari data.url menjadi url
      message: 'Gambar berhasil diunggah'
    })
  } catch (error) {
    console.error('Gagal mengunggah gambar:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengunggah gambar', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/upload - Menghapus gambar (opsional)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak - Diperlukan akses Admin' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl || !imageUrl.startsWith('/uploads/products/')) {
      return NextResponse.json(
        { success: false, error: 'URL gambar tidak valid' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Permintaan penghapusan gambar diterima'
    })
  } catch (error) {
    console.error('Gagal menghapus gambar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus gambar' },
      { status: 500 }
    )
  }
}
