// src/app/api/products/[id]/can-review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/products/[id]/can-review - Check if user can review product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({
        success: true,
        canReview: false,
        reason: 'Not authenticated'
      })
    }

    // Check if user has purchased this product
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
      return NextResponse.json({
        success: true,
        canReview: false,
        reason: 'Must purchase product first'
      })
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: params.id
        }
      }
    })

    if (existingReview) {
      return NextResponse.json({
        success: true,
        canReview: false,
        reason: 'Already reviewed'
      })
    }

    return NextResponse.json({
      success: true,
      canReview: true
    })
  } catch (error) {
    console.error('Error checking review eligibility:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check review eligibility' },
      { status: 500 }
    )
  }
}