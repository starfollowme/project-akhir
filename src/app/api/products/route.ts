import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating a product
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
})

// GET /api/products - Handle requests for both public and admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // Only used by admin

    const skip = (page - 1) * limit
    const where: {
      isActive?: boolean
      category?: { slug: string }
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    // Conditional logic:
    // If not admin, only show active products
    // If admin, show all unless filtered by status
    if (!isAdmin) {
      where.isActive = true
    } else if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Common filters for public and admin
    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          // Only include additional data if admin
          ...(isAdmin && {
            _count: {
              select: {
                reviews: true,
                orderItems: true
              }
            }
          })
        },
        skip,
        take: limit,
        // Different ordering for admin
        orderBy: isAdmin
          ? [{ isActive: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }

    // If admin, include additional stats
    if (isAdmin) {
      const statsResult = await prisma.product.groupBy({
        by: ['isActive'],
        _count: { isActive: true }
      })
      const activeCount = statsResult.find(s => s.isActive === true)?._count.isActive || 0
      const inactiveCount = statsResult.find(s => s.isActive === false)?._count.isActive || 0
      
      return NextResponse.json({
        success: true,
        data: {
          products,
          pagination,
          stats: {
            total: activeCount + inactiveCount,
            active: activeCount,
            inactive: inactiveCount
          }
        }
      })
    }

    // Standard response for public
    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination
      }
    })

  } catch (error) {
    console.error('Failed to fetch products:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products', 
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }
    
    const validatedData = validation.data

    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    const productData = {
      name: validatedData.name,
      description: validatedData.description ?? null,
      price: validatedData.price,
      stock: validatedData.stock,
      categoryId: validatedData.categoryId,
      imageUrl: validatedData.imageUrl ?? null,
      isActive: true
    }

    const product = await prisma.product.create({
      data: productData,
      include: { category: true }
    })

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to create product', details: errorMessage },
      { status: 500 }
    )
  }
}