import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

interface Review {
  rating: number;
}

interface Stat {
  rating: number;
  _count: {
    rating: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: params.id
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.review.count({
        where: {
          productId: params.id
        }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: {
          productId: params.id
        },
        _count: {
          rating: true
        }
      })
    ])

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / totalReviews
      : 0

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const stat = stats.find((s: Stat) => s.rating === rating)
      return {
        rating,
        count: stat?._count.rating || 0,
        percentage: total > 0 ? ((stat?._count.rating || 0) / total) * 100 : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          averageRating: Number(averageRating.toFixed(1)),
          totalReviews: total,
          ratingDistribution
        }
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rating, comment } = createReviewSchema.parse(body)

    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: params.id,
        order: {
          userId: session.user.id,
          status: 'DELIVERED'
        }
      }
    })

    if (!hasPurchased) {
      return NextResponse.json(
        { success: false, error: 'You can only review products you have purchased' },
        { status: 400 }
      )
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: params.id
        }
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        userId: session.user.id,
        productId: params.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
