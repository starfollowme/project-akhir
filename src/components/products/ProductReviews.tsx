// src/components/products/ProductReviews.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StarRating, RatingDisplay, RatingBreakdown } from '@/components/ui/star-rating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  User, 
  Calendar,
  ThumbsUp,
  Flag,
  Edit3
} from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
}

interface ProductReviewsProps {
  productId: string
  className?: string
}

export function ProductReviews({ productId, className }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [canReview, setCanReview] = useState(false)
  
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  })

  useEffect(() => {
    fetchReviews()
    if (session) {
      checkCanReview()
    }
  }, [productId, session])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.data.reviews)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCanReview = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/can-review`)
      const data = await response.json()
      setCanReview(data.canReview)
    } catch (error) {
      console.error('Error checking review eligibility:', error)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (reviewForm.rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewForm)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Review submitted successfully!')
        setReviewForm({ rating: 0, comment: '' })
        setShowReviewForm(false)
        setCanReview(false)
        fetchReviews()
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Reviews Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">Customer Reviews</h3>
          {session && canReview && (
            <Button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Write Review
            </Button>
          )}
        </div>

        {/* Review Stats */}
        {stats && stats.totalReviews > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Overall Rating */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {stats.averageRating}
                    </div>
                    <RatingDisplay 
                      rating={stats.averageRating} 
                      count={stats.totalReviews}
                      size="lg" 
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div>
                  <h4 className="font-semibold mb-4">Rating Breakdown</h4>
                  <RatingBreakdown 
                    distribution={stats.ratingDistribution}
                    totalReviews={stats.totalReviews}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <Card>
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Rating *</Label>
                  <StarRating
                    rating={reviewForm.rating}
                    onRatingChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))}
                    size="lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Your Review</Label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting || reviewForm.rating === 0}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {getInitials(review.user.name, review.user.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {review.user.name || 'Anonymous User'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} readonly size="sm" />
                            <span className="text-sm text-gray-600">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Flag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your experience with this product.
                </p>
                {session && canReview && (
                  <Button onClick={() => setShowReviewForm(true)}>
                    Write First Review
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}