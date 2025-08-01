'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, X } from 'lucide-react'
import { ProductWithCategory } from '@/types'
import { toast } from 'sonner'

interface ProductFormProps {
  product?: ProductWithCategory
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  stock: number
  categoryId: string
  imageUrl?: string
  isActive?: boolean
}

// PERBAIKAN: Tipe data error yang benar
interface ProductFormErrors {
    name?: string
    description?: string
    price?: string
    stock?: string
    categoryId?: string
    imageUrl?: string
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product ? Number(product.price) : 0,
    stock: product?.stock || 0,
    categoryId: product?.categoryId || '',
    imageUrl: product?.imageUrl || '',
    isActive: product?.isActive ?? true
  })
  const [errors, setErrors] = useState<ProductFormErrors>({}) // PERBAIKAN: Menggunakan tipe error yang baru

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        throw new Error('Format data kategori tidak valid')
      }
    } catch (error) {
      console.error('Gagal mengambil kategori:', error)
      toast.error('Gagal memuat kategori')
    }
  }

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama produk wajib diisi'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Harga harus lebih besar dari 0'
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stok tidak boleh negatif'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori wajib diisi'
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Harap masukkan URL gambar yang valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Kesalahan pengiriman formulir:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {product ? 'Ubah Produk' : 'Buat Produk Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Masukkan nama produk"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Masukkan deskripsi produk"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock">Jumlah Stok *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock || ''}
                onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock && (
                <p className="text-sm text-red-600">{errors.stock}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => handleChange('categoryId', value)}
            >
              <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">Tidak ada kategori</div>
                )}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-600">{errors.categoryId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL Gambar</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://contoh.com/gambar.jpg"
              className={errors.imageUrl ? 'border-red-500' : ''}
            />
            {errors.imageUrl && (
              <p className="text-sm text-red-600">{errors.imageUrl}</p>
            )}
            <p className="text-sm text-gray-600">
              Masukkan URL langsung ke gambar produk. Kosongkan jika tidak ada gambar.
            </p>
          </div>

          {formData.imageUrl && !errors.imageUrl && (
            <div className="space-y-2">
              <Label>Pratinjau Gambar</Label>
              <div className="border rounded-lg p-4">
                <img
                  src={formData.imageUrl}
                  alt="Pratinjau produk"
                  className="max-w-full h-48 object-cover rounded-lg mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    setErrors(prev => ({
                      ...prev,
                      imageUrl: 'URL gambar tidak valid'
                    }))
                  }}
                />
              </div>
            </div>
          )}

          {product && (
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select 
                value={formData.isActive?.toString()} 
                onValueChange={(value) => handleChange('isActive', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {product ? 'Memperbarui...' : 'Membuat...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {product ? 'Perbarui Produk' : 'Buat Produk'}
            </>
          )}
        </Button>
        
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Batal
        </Button>
      </div>
    </form>
  )
}
