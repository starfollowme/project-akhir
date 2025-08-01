'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { ProductWithCategory } from '@/types'
import { toast } from 'sonner'

interface ProductFormData {
  name: string
  description: string
  price: string
  stock: string
  categoryId: string
  isActive: boolean
}

export default function EditProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<ProductWithCategory | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    isActive: true
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' && productId) {
      fetchProduct()
      fetchCategories()
    }
  }, [session, productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      const data = await response.json()

      if (data.success) {
        const productData = data.data
        setProduct(productData)
        setFormData({
          name: productData.name,
          description: productData.description || '',
          price: productData.price.toString(),
          stock: productData.stock.toString(),
          categoryId: productData.categoryId,
          isActive: productData.isActive
        })
        if (productData.imageUrl) {
            setPreviewUrl(productData.imageUrl)
        }
      } else {
        toast.error('Produk tidak ditemukan')
        router.push('/admin/products')
      }
    } catch (error) {
      console.error('Gagal mengambil data produk:', error)
      toast.error('Gagal memuat produk')
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Gagal mengambil kategori:', error)
    }
  }

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.price || !formData.stock || !formData.categoryId) {
      toast.error('Harap isi semua bidang yang wajib diisi');
      return;
    }

    setSaving(true)
    
    try {
      let imageUrl = product?.imageUrl;

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
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          categoryId: formData.categoryId,
          imageUrl: imageUrl,
          isActive: formData.isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Produk berhasil diperbarui!')
        router.push('/admin/products')
      } else {
        toast.error(data.details || data.error || 'Gagal memperbarui produk')
      }
    } catch (error: any) {
      console.error('Gagal memperbarui produk:', error)
      toast.error(`Pembaruan gagal: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    toast(`Apakah Anda yakin ingin mengarsipkan "${product?.name}"?`, {
        action: {
            label: 'Arsipkan',
            onClick: async () => {
                try {
                    const response = await fetch(`/api/products/${productId}`, {
                        method: 'DELETE'
                    })
                    const data = await response.json()
                    if (data.success) {
                        toast.success('Produk berhasil diarsipkan!')
                        router.push('/admin/products')
                    } else {
                        throw new Error(data.details || data.error || 'Gagal mengarsipkan produk')
                    }
                } catch (error: any) {
                    console.error('Gagal menghapus produk:', error)
                    toast.error(`Pengarsipan gagal: ${error.message}`)
                }
            }
        },
        cancel: {
            label: 'Batal',
            onClick: () => {} // PERBAIKAN: Menambahkan onClick kosong
        }
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN' || !product) {
    return null
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Produk
            </Button>
          </Link>
          <div className="border-l h-6"></div>
          <div>
            <h1 className="text-2xl font-bold">Ubah Produk</h1>
            <p className="text-gray-600 truncate max-w-sm">Mengubah: {product.name}</p>
          </div>
        </div>
        
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          className="ml-auto"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Arsipkan Produk
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk *</Label>
                  <Input id="name" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <textarea id="description" rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-3 py-2 border border-input rounded-md resize-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga ($) *</Label>
                    <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Jumlah Stok *</Label>
                    <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => handleChange('stock', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select value={formData.isActive.toString()} onValueChange={(value) => handleChange('isActive', value === 'true')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Tidak Aktif</SelectItem>
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
                  <Label htmlFor="imageFile">Unggah Gambar Baru</Label>
                  <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                  <p className="text-sm text-gray-600">Pilih gambar baru untuk menggantikan yang sekarang. Biarkan kosong untuk mempertahankan gambar yang ada.</p>
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <Label>Pratinjau Gambar</Label>
                    <div className="mt-2 border rounded-lg p-4">
                      <img src={previewUrl} alt="Pratinjau produk" className="max-w-full h-48 object-cover rounded-lg mx-auto" />
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
              <CardContent>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Perbarui Produk'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
