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
  Star,
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
    if (session && orderId) {
      fetchOrderDetails()
    }
  }, [session, orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (data.success) {
        const orderData = data.data
        setOrder(orderData)

        if (orderData.status !== 'DELIVERED') {
          toast.error('Anda hanya dapat mengulas pesanan yang sudah diantar')
          router.push(`/orders/${orderId}`)
          return
        }

        const forms: ReviewForm = {}
        const existing = new Set<string>()

        for (const item of orderData.items) {
          const canReviewResponse = await fetch(`/api/products/${item.product.id}/can-review`)
          const canReviewData = await canReviewResponse.json()
          
          if (canReviewData.reason === 'Already reviewed') {
            existing.add(item.product.id)
          }

          forms[item.product.id] = {
            rating: 0,
            comment: '',
            submitted: canReviewData.reason === 'Already reviewed'
          }
        }

        setReviewForms(forms)
        setExistingReviews(existing)
      } else {
        toast.error('Pesanan tidak ditemukan')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Gagal mengambil detail pesanan:', error)
      toast.error('Gagal memuat detail pesanan')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

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
      toast.error('Silakan pilih peringkat')
      return
    }

    setSubmitting(productId)
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
          [productId]: {
            ...prev[productId],
            submitted: true
          }
        }))
        setExistingReviews(prev => {
          const newSet = new Set(prev)
          newSet.add(productId)
          return newSet
        })
      } else {
        toast.error(data.error || 'Gagal mengirim ulasan')
      }
    } catch (error) {
      console.error('Gagal mengirim ulasan:', error)
      toast.error('Gagal mengirim ulasan')
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
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/orders/${orderId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pesanan
            </Button>
          </Link>
          <div className="border-l h-6"></div>
          <div>
            <h1 className="text-3xl font-bold">Ulas Pembelian Anda</h1>
            <p className="text-gray-600">
              Pesanan #{order.orderNumber} • Diantar pada {formatDate(order.updatedAt)}
            </p>
          </div>
        </div>

        {allReviewsSubmitted && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Semua Ulasan Terkirim!</h3>
                  <p className="text-green-700">
                    Terima kasih telah meluangkan waktu untuk mengulas pembelian Anda. Umpan balik Anda membantu pelanggan lain membuat keputusan yang tepat.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {order.items.map((item) => {
            const review = reviewForms[item.product.id]
            const isSubmitted = review?.submitted || existingReviews.has(item.product.id)
            const isSubmittingThis = submitting === item.product.id

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.product.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Kuantitas: {item.quantity}</span>
                        <span>Harga: ${Number(item.price).toFixed(2)}</span>
                      </div>
                    </div>

                    {isSubmitted && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Telah Diulas
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isSubmitted ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-gray-900 mb-1">Ulasan Terkirim</p>
                      <p className="text-sm text-gray-600">
                        Terima kasih telah mengulas produk ini!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Peringkat Anda *</Label>
                        <div className="flex items-center gap-4">
                          <StarRating
                            rating={review?.rating || 0}
                            onRatingChange={(rating) => handleReviewChange(item.product.id, 'rating', rating)}
                            size="lg"
                          />
                          {review?.rating > 0 && (
                            <span className="text-sm text-gray-600">
                              {review.rating} bintang
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`comment-${item.product.id}`}>
                          Ulasan Anda (Opsional)
                        </Label>
                        <textarea
                          id={`comment-${item.product.id}`}
                          rows={4}
                          value={review?.comment || ''}
                          onChange={(e) => handleReviewChange(item.product.id, 'comment', e.target.value)}
                          placeholder="Bagikan pengalaman Anda dengan produk ini..."
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          disabled={isSubmittingThis}
                        />
                      </div>

                      <Button
                        onClick={() => submitReview(item.product.id)}
                        disabled={isSubmittingThis || (review?.rating || 0) === 0}
                        className="w-full"
                      >
                        {isSubmittingThis ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mengirim Ulasan...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Kirim Ulasan
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Link href={`/orders/${orderId}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Detail Pesanan
            </Button>
          </Link>

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
