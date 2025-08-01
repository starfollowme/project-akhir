
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/ui/star-rating'
import { 
  ArrowLeft, 
  Package, 
  Send,
  CheckCircle
} from 'lucide-react'
import { OrderWithItems } from '@/types'
import { toast } from 'sonner'

interface ReviewForm {
  [productId: string]: {
    rating: number
    comment: string
    submitted: boolean
  }
}

export default function OrderReviewPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [reviewForms, setReviewForms] = useState<ReviewForm>({})
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
    }
  }, [status, router])

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) {
            throw new Error('Failed to fetch order details')
        }
        const data = await response.json()

        if (data.success) {
          const orderData = data.data
          setOrder(orderData)

          if (orderData.status !== 'DELIVERED') {
            toast.error('Anda hanya dapat mengulas pesanan yang sudah diantar')
            router.push(`/orders/${orderId}`)
            return
          }
          
          // Saran: Untuk performa lebih baik, idealnya informasi "canReview"
          // sudah disertakan dalam respons API /api/orders/${orderId}
          // untuk menghindari panggilan N+1.
          const forms: ReviewForm = {}
          const existing = new Set<string>()

          for (const item of orderData.items) {
            // Asumsi: Ada endpoint untuk mengecek status ulasan
            const canReviewResponse = await fetch(`/api/products/${item.product.id}/can-review`)
            const canReviewData = await canReviewResponse.json()
            
            const alreadyReviewed = canReviewData.reason === 'Already reviewed'
            if (alreadyReviewed) {
              existing.add(item.product.id)
            }

            forms[item.product.id] = {
              rating: 0,
              comment: '',
              submitted: alreadyReviewed
            }
          }

          setReviewForms(forms)
          setExistingReviews(existing)
        } else {
          toast.error(data.error || 'Pesanan tidak ditemukan')
          router.push('/orders')
        }
      } catch (error) {
        console.error('Gagal mengambil detail pesanan:', error)
        toast.error('Gagal memuat detail pesanan.')
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }
  
    if (session && orderId) {
      fetchOrderDetails()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, orderId, router])

  const handleReviewChange = (productId: string, field: 'rating' | 'comment', value: number | string) => {
    setReviewForms(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }))
  }

  const submitReview = async (productId: string) => {
    const review = reviewForms[productId]
    
    if (review.rating === 0) {
      toast.error('Silakan pilih peringkat bintang terlebih dahulu.')
      return
    }

    setSubmitting(productId)
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: review.rating,
          comment: review.comment.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ulasan berhasil dikirim!')
        setReviewForms(prev => ({
          ...prev,
          [productId]: { ...prev[productId], submitted: true }
        }))
        // Perbaikan: Pastikan untuk memperbarui Set secara immutable
        setExistingReviews(prev => new Set(prev).add(productId))
      } else {
        toast.error(data.error || 'Gagal mengirim ulasan.')
      }
    } catch (error) {
      console.error('Gagal mengirim ulasan:', error)
      toast.error('Terjadi kesalahan saat mengirim ulasan.')
    } finally {
      setSubmitting(null)
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatCurrency = (amount: number | string) => {
      return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
      }).format(Number(amount))
  }

  const allReviewsSubmitted = order?.items.every(item => 
    reviewForms[item.product.id]?.submitted || existingReviews.has(item.product.id)
  ) ?? false

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !order) {
    return null // Atau tampilkan pesan error jika order tidak ditemukan
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${orderId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Pesanan
          </Button>
          <div className="border-l border-gray-300 h-6"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ulas Pembelian Anda</h1>
            <p className="text-gray-600 text-sm">
              Pesanan #{order.orderNumber} • Diantar pada {formatDate(order.updatedAt)}
            </p>
          </div>
        </div>

        {allReviewsSubmitted && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Semua Ulasan Terkirim!</h3>
                  <p className="text-sm text-green-800">
                    Terima kasih telah meluangkan waktu untuk mengulas pembelian Anda. Umpan balik Anda sangat berarti.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {order.items.map((item) => {
            const review = reviewForms[item.product.id];
            // Tambahkan pengecekan jika review belum terinisialisasi
            if (!review) return null;

            const isSubmitted = review.submitted;
            const isSubmittingThis = submitting === item.product.id;

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center border">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{item.product.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>Kuantitas: {item.quantity}</span>
                        <span>Harga: {formatCurrency(item.price)}</span>
                      </div>
                    </div>

                    {isSubmitted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 self-start sm:self-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Telah Diulas
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {isSubmitted ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center border">
                      <p className="font-medium text-gray-800">
                        Terima kasih telah mengulas produk ini!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label className="font-semibold">Peringkat Anda *</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <StarRating
                            rating={review.rating}
                            onRatingChange={(rating) => handleReviewChange(item.product.id, 'rating', rating)}
                            size="lg"
                          />
                          {review.rating > 0 && (
                            <span className="text-sm font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                              {review.rating} bintang
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`comment-${item.product.id}`} className="font-semibold">
                          Ulasan Anda (Opsional)
                        </Label>
                        <textarea
                          id={`comment-${item.product.id}`}
                          rows={4}
                          value={review.comment}
                          onChange={(e) => handleReviewChange(item.product.id, 'comment', e.target.value)}
                          placeholder="Bagikan pengalaman Anda dengan produk ini..."
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                          disabled={isSubmittingThis}
                        />
                      </div>

                      <Button
                        onClick={() => submitReview(item.product.id)}
                        disabled={isSubmittingThis || review.rating === 0}
                        className="w-full sm:w-auto"
                      >
                        {isSubmittingThis ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Kirim Ulasan
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push(`/orders/${orderId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Detail Pesanan
          </Button>

          {allReviewsSubmitted && (
            <Link href="/orders">
              <Button>
                Lihat Semua Pesanan
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
