// src/components/ui/star-rating.tsx
'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showText = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating
  const isInteractive = !readonly && onRatingChange

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div 
        className="flex gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating
          const isPartial = star === Math.ceil(displayRating) && displayRating % 1 !== 0

          return (
            <button
              key={star}
              type="button"
              className={cn(
                'relative transition-colors',
                isInteractive && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={readonly}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-all duration-150',
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-transparent text-gray-300',
                  isInteractive && 'hover:text-yellow-400'
                )}
              />
              
              {/* Partial fill for decimal ratings */}
              {isPartial && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(displayRating % 1) * 100}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-yellow-400 text-yellow-400'
                    )}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {showText && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)} {rating === 1 ? 'star' : 'stars'}
        </span>
      )}
    </div>
  )
}

// Display-only rating with count
interface RatingDisplayProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingDisplay({ 
  rating, 
  count, 
  size = 'md', 
  className 
}: RatingDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating rating={rating} readonly size={size} />
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <span className="font-medium">{rating.toFixed(1)}</span>
        {count !== undefined && (
          <>
            <span>•</span>
            <span>{count} {count === 1 ? 'review' : 'reviews'}</span>
          </>
        )}
      </div>
    </div>
  )
}

// Rating breakdown component
interface RatingBreakdownProps {
  distribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
  totalReviews: number
}

export function RatingBreakdown({ distribution, totalReviews }: RatingBreakdownProps) {
  return (
    <div className="space-y-2">
      {distribution.reverse().map((item) => (
        <div key={item.rating} className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-12">
            <span className="text-sm">{item.rating}</span>
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
          
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          
          <span className="text-sm text-gray-600 w-12 text-right">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  )
}