// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// GET /api/admin/users/[id] - Get a single user's details (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { orders: true },
        },
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Fetch the 5 most recent orders
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'CUSTOMER']),
})

// PUT /api/admin/users/[id] - Update user role (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userIdToUpdate = params.id

    if (userIdToUpdate === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own role." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { role } = validation.data

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully',
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Deactivate (delete) a user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userIdToDelete = params.id

    if (userIdToDelete === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot deactivate your own account." },
        { status: 403 }
      )
    }

    // In a real-world scenario, you might want to handle related data (like orders)
    // before deleting the user, or simply set an `isActive` flag to false.
    // For this example, we proceed with deletion.
    await prisma.user.delete({
      where: { id: userIdToDelete },
    })

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    })
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate user' },
      { status: 500 }
    )
  }
}
