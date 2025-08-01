// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive')
})

const updateCartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative')
})

// GET /api/cart - Get user's cart
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      })
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...cart,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity } = addToCartSchema.parse(body)

    // Check if product exists and has enough stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id }
      })
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    })

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity
      
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock' },
          { status: 400 }
        )
      }

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity }
      })
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully'
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    
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
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity } = updateCartItemSchema.parse(body)

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    })

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      )
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      },
      include: {
        product: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    if (quantity === 0) {
      // Remove item from cart
      await prisma.cartItem.delete({
        where: { id: cartItem.id }
      })
    } else {
      // Check stock
      if (cartItem.product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock' },
          { status: 400 }
        )
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cart updated successfully'
    })
  } catch (error) {
    console.error('Error updating cart:', error)
    
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
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    })

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      )
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}