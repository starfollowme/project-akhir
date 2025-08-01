'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RatingDisplay } from '@/components/ui/star-rating'
import { ProductReviews } from '@/components/products/ProductReviews'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Package,
  Star,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react'
import { ProductWithCategory } from '@/types'
import { toast } from 'sonner'

export default function ProductDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<ProductWithCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // PERBAIKAN: Mengubah format mata uang ke Dolar ($)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      const data = await response.json()

      if (data.success) {
        setProduct(data.data)
      } else {
        toast.error('Produk tidak ditemukan')
        router.push('/products')
      }
    } catch (error) {
      console.error('Gagal mengambil data produk:', error)
      toast.error('Gagal memuat produk')
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!product || quantity <= 0) return

    setAddingToCart(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          productId: product.id, 
          quantity 
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Produk berhasil ditambahkan ke keranjang!')
      } else {
        toast.error(data.error || 'Gagal menambahkan ke keranjang')
      }
    } catch (error) {
      console.error('Gagal menambahkan ke keranjang:', error)
      toast.error('Gagal menambahkan ke keranjang')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock <= 5 && product.stock > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/products" className="hover:text-primary">Produk</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
            
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Stok Habis
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Link href={`/products?category=${product.category.slug}`}>
              <Badge variant="secondary" className="hover:bg-secondary/80">
                {product.category.name}
              </Badge>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-primary">
                {formatCurrency(Number(product.price))}
              </span>
            </div>
          </div>

          <div>
            <RatingDisplay rating={4.5} count={23} size="md" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span className="text-sm">
                {isOutOfStock ? 'Stok Habis' : 
                  isLowStock ? `Stok menipis` : 
                  'Tersedia'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {product.stock} unit tersedia
            </span>
          </div>

          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Deskripsi</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {!isOutOfStock && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Jumlah</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        if (value >= 1 && value <= product.stock) {
                          setQuantity(value)
                        }
                      }}
                      className="w-16 text-center border-0 focus-visible:ring-0"
                      min="1"
                      max={product.stock}
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <span className="text-sm text-gray-600">
                    Total: {formatCurrency(Number(product.price) * quantity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || !session}
                  className="flex-1 h-12"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                </Button>
                
                {!session && (
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="outline" className="h-12 w-full" size="lg">
                      Masuk untuk Membeli
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Gratis Ongkir</p>
                    <p className="text-xs text-gray-600">Untuk pesanan tertentu</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pembayaran Aman</p>
                    <p className="text-xs text-gray-600">100% checkout aman</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pengembalian Mudah</p>
                    <p className="text-xs text-gray-600">Kebijakan 30 hari</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-b mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'description', label: 'Deskripsi' },
            { id: 'reviews', label: 'Ulasan' },
            { id: 'specifications', label: 'Spesifikasi' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-12">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'Tidak ada deskripsi detail untuk produk ini.'}
            </p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <ProductReviews productId={productId} />
        )}

        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Detail Produk</h4>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">SKU</dt>
                  <dd>{product.id.slice(-8).toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Kategori</dt>
                  <dd>{product.category.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Stok</dt>
                  <dd>{product.stock} unit</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status</dt>
                  <dd>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>
}
