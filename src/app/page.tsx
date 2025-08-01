'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductCard } from '@/components/products/ProductCard'
import { 
  ShoppingBag, 
  Truck, 
  Shield, 
  Headphones,
  ArrowRight,
  Star
} from 'lucide-react'
import { ProductWithCategory } from '@/types'
import { toast } from 'sonner'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=8')
      const data = await response.json()

      if (data.success) {
        setFeaturedProducts(data.data.products)
      }
    } catch (error) {
      console.error('Gagal mengambil produk unggulan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
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
    }
  }

  return (
    <div className="min-h-screen">
      {/* Bagian Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Selamat Datang di Ravello
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Temukan produk luar biasa dengan harga tak terkalahkan. Belanja dengan percaya diri dan nikmati pengiriman yang cepat dan aman.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Belanja Sekarang
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Buat Akun
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Fitur */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Mengapa Memilih Ravello?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Kami berkomitmen untuk memberikan Anda pengalaman berbelanja terbaik.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Gratis Ongkir</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gratis ongkir untuk pesanan di atas Rp500.000. Pengiriman cepat dan andal sampai ke depan pintu Anda.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Pembayaran Aman</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Informasi pembayaran Anda dilindungi dengan enkripsi keamanan setingkat bank.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Dukungan 24/7</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tim dukungan pelanggan kami tersedia sepanjang waktu untuk membantu Anda.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg">Produk Berkualitas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Kami memilih produk kami dengan cermat untuk memastikan standar kualitas tertinggi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Produk Unggulan */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Produk Unggulan</h2>
              <p className="text-gray-600">
                Lihat barang-barang paling populer kami
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline">
                Lihat Semua Produk
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-t-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    <div className="bg-gray-200 h-6 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada produk yang tersedia saat ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* Bagian Newsletter */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Tetap Terkini</h2>
            <p className="text-xl mb-8 text-gray-300">
              Berlangganan buletin kami dan jadilah yang pertama tahu tentang produk baru dan penawaran eksklusif.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Masukkan email Anda"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                Berlangganan
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Kami menghargai privasi Anda. Berhenti berlangganan kapan saja.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
