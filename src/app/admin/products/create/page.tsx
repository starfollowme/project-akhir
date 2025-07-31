
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
      } else if (data.success && Array.isArray(data.data)) {
        setCategories(data.data)
      } else {
        throw new Error('Invalid categories data')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
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

    if (!name.trim()) return toast.error('Product name is required')
    if (!price || parseFloat(price) <= 0) return toast.error('Valid price is required')
    if (!stock || parseInt(stock) < 0) return toast.error('Valid stock quantity is required')
    if (!categoryId) return toast.error('Category is required')

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
          throw new Error(uploadResult.error || 'Image upload failed');
        }
        imageUrl = uploadResult.url;
      }

      
      const response = await fetch('/api/products', {
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
        toast.success('Product created successfully!')
        router.push('/admin/products')
      } else {
        throw new Error(result.error || 'Failed to create product')
      }
    } catch (error: any) {
      console.error('Submit Error:', error)
      toast.error(error.message || 'Failed to create product')
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
            Back to Products
          </Button>
        </Link>
        <div className="border-l h-6"></div>
        <div>
          <h1 className="text-2xl font-bold">Create New Product</h1>
          <p className="text-gray-600">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter product name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Enter product description" className="w-full px-3 py-2 border border-input rounded-md resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => handleChange('stock', e.target.value)} placeholder="0" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No categories available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageFile">Upload Image</Label>
                <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                <p className="text-sm text-gray-600">Upload an image file for the product. Leave empty if no image is available.</p>
              </div>
              {previewUrl && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-2 border rounded-lg p-4">
                    <img
                      src={previewUrl}
                      alt="Product preview"
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
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
              <Link href="/admin/products" className="block">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
