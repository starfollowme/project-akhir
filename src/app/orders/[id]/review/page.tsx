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
      router.push(
        '/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname)
      )
    }
  }, [status, router])

  useEffect(() => {
    if (session && orderId) {
      fetchOrderDetails()
    }
  }, [session, orderId])

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (!data.success) throw new Error()
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
        const r = await fetch(
          `/api/products/${item.product.id}/can-review`
        )
        const info = await r.json()
        if (info.reason === 'Already reviewed') existing.add(item.product.id)
        forms[item.product.id] = {
          rating: 0,
          comment: '',
          submitted: info.reason === 'Already reviewed'
        }
      }
      setReviewForms(forms)
      setExistingReviews(existing)
    } catch {
      toast.error('Gagal memuat data pesanan')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewChange = (
    productId: string,
    field: 'rating' | 'comment',
    value: number | string
  ) => {
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
    if (!review || review.rating === 0) {
      toast.error('Pilih peringkat terlebih dahulu')
      return
    }
    setSubmitting(productId)
    try {
      const res = await fetch(
        `/api/products/${productId}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: review.rating,
            comment: review.comment || null
          })
        }
      )
      const resData = await res.json()
      if (!resData.success) throw new Error()
      toast.success('Ulasan berhasil dikirim!')
      setReviewForms(prev => ({
        ...prev,
        [productId]: { ...prev[productId], submitted: true }
      }))
      setExistingReviews(prev => new Set(prev).add(productId))
    } catch {
      toast.error('Gagal mengirim ulasan')
    } finally {
      setSubmitting(null)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session || !order) return null

  const allSubmitted = order.items.every(
    item =>
      reviewForms[item.product.id]?.submitted ||
      existingReviews.has(item.product.id)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost">
            <ArrowLeft className="mr-2" /> Kembali
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4">Ulas Pembelian Anda</h1>
      </div>
      <p className="mb-6 text-gray-600">
        Pesanan #{order.orderNumber} • Diantar pada {formatDate(order.updatedAt)}
      </p>
      {allSubmitted && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" />
              <span className="text-green-900">Semua ulasan telah dikirim!</span>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {order.items.map(item => {
          const info = reviewForms[item.product.id]
          const isDone = info?.submitted || existingReviews.has(item.product.id)
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-16 h-16 mr-4 relative">
                    {item.product.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    ) : (
                      <Package className="text-gray-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle>{item.product.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} • Harga: ${item.price}
                    </p>
                  </div>
                  {isDone && (
                    <Badge className="bg-green-100 text-green-800">
                      Telah Diulas
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isDone ? (
                  <div className="text-center text-gray-700">
                    Terima kasih atas ulasannya!
                  </div>
                ) : (
                  <>
                    <Label>Peringkat Anda</Label>
                    <StarRating
                      rating={info?.rating || 0}
                      onRatingChange={val =>
                        handleReviewChange(item.product.id, 'rating', val)
                      }
                      size="lg"
                    />
                    <Label className="mt-4">Komentar (opsional)</Label>
                    <textarea
                      rows={3}
                      className="w-full border rounded p-2"
                      value={info?.comment || ''}
                      onChange={e =>
                        handleReviewChange(
                          item.product.id,
                          'comment',
                          e.target.value
                        )
                      }
                    />
                    <Button
                      className="mt-4"
                      onClick={() => submitReview(item.product.id)}
                      disabled={submitting === item.product.id}
                    >
                      {submitting === item.product.id
                        ? 'Mengirim...'
                        : 'Kirim Ulasan'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
