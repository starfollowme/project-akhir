import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// ✅ POST: Upload gambar ke Supabase Storage
export async function POST(request: NextRequest) {
  try {
    // ✅ Cek session & role admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak - Diperlukan akses Admin' },
        { status: 401 }
      )
    }

    // ✅ Ambil file dari formData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diberikan' },
        { status: 400 }
      )
    }

    // ✅ Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Jenis file tidak valid. Hanya JPEG, PNG, WebP, dan GIF yang diizinkan.' },
        { status: 400 }
      )
    }

    // ✅ Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File terlalu besar. Ukuran maksimal adalah 5MB.' },
        { status: 400 }
      )
    }

    // ✅ Buat nama file unik
    const fileExt = file.name.split('.').pop()
    const fileName = `produk-${uuidv4()}.${fileExt}`

    // ✅ Konversi file ke buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ✅ Upload ke Supabase Storage (bucket: products)
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false // hindari overwrite
      })

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError.message)
      return NextResponse.json(
        { success: false, error: 'Gagal upload ke Supabase', details: uploadError.message },
        { status: 500 }
      )
    }

    // ✅ Ambil public URL file
    const { data: publicUrl } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)

    if (!publicUrl) {
      return NextResponse.json(
        { success: false, error: 'Gagal mendapatkan URL publik' },
        { status: 500 }
      )
    }

    // ✅ Respon sukses
    return NextResponse.json({
      success: true,
      url: publicUrl.publicUrl,
      fileName: fileName,
      message: 'Gambar berhasil diunggah ke Supabase'
    })
  } catch (error) {
    console.error('Gagal mengunggah gambar:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ✅ DELETE: Hapus gambar dari Supabase Storage
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak - Diperlukan akses Admin' },
        { status: 401 }
      )
    }

    // ✅ Ambil query param "file"
    const { searchParams } = new URL(request.url)
    const imageName = searchParams.get('file')

    if (!imageName) {
      return NextResponse.json(
        { success: false, error: 'Nama file tidak ditemukan di query parameter' },
        { status: 400 }
      )
    }

    // ✅ Hapus file dari Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('products')
      .remove([imageName])

    if (deleteError) {
      console.error('Supabase Delete Error:', deleteError.message)
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus file', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `File ${imageName} berhasil dihapus dari Supabase`
    })
  } catch (error) {
    console.error('Gagal menghapus gambar:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
