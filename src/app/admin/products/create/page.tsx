'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface ProductFormData {
  name: string
  description: string
  price: string
  stock: string
  categoryId: string
}

export default function CreateProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        throw new Error('Data kategori tidak valid')
      }
    } catch (error) {
      console.error('Gagal mengambil kategori:', error)
      toast.error('Gagal memuat kategori')
    }
  }

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { name, price, stock, categoryId, description } = formData

    if (!name.trim()) return toast.error('Nama produk wajib diisi')
    if (!price || parseFloat(price) <= 0) return toast.error('Harga yang valid wajib diisi')
    if (!stock || parseInt(stock) < 0) return toast.error('Jumlah stok yang valid wajib diisi')
    if (!categoryId) return toast.error('Kategori wajib diisi')

    setLoading(true)

    try {
      let imageUrl: string | undefined = undefined;

      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Gagal mengunggah gambar');
        }
        imageUrl = uploadResult.url;
      }

      // Menggunakan API admin yang benar
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price),
          stock: parseInt(stock),
          categoryId,
          imageUrl: imageUrl
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Produk berhasil dibuat!')
        router.push('/admin/products')
      } else {
        // Menampilkan detail error dari validasi Zod jika ada
        const errorDetails = result.details ? Object.values(result.details).join(', ') : result.error;
        throw new Error(errorDetails || 'Gagal membuat produk')
      }
    } catch (error: any) {
      console.error('Kesalahan pengiriman:', error)
      toast.error(error.message || 'Gagal membuat produk')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') return null

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Produk
          </Button>
        </Link>
        <div className="border-l h-6"></div>
        <div>
          <h1 className="text-2xl font-bold">Buat Produk Baru</h1>
          <p className="text-gray-600">Tambahkan produk baru ke katalog Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input id="name" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Masukkan nama produk" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea id="description" rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Masukkan deskripsi produk" className="w-full px-3 py-2 border border-input rounded-md resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga ($) *</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Jumlah Stok *</Label>
                  <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => handleChange('stock', e.target.value)} placeholder="0" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">Tidak ada kategori</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gambar Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Unggah Gambar</Label>
                <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                <p className="text-sm text-gray-600">Unggah file gambar untuk produk. Kosongkan jika tidak ada.</p>
              </div>
              {previewUrl && (
                <div className="mt-4">
                  <Label>Pratinjau</Label>
                  <div className="mt-2 border rounded-lg p-4">
                    <img
                      src={previewUrl}
                      alt="Pratinjau produk"
                      className="max-w-full h-48 object-cover rounded-lg mx-auto"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Membuat...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Buat Produk
                  </>
                )}
              </Button>
              <Link href="/admin/products" className="block">
                <Button type="button" variant="outline" className="w-full">
                  Batal
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
