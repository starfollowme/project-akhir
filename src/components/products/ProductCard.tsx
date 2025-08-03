// src/components/products/ProductCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ProductWithCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RatingDisplay } from '@/components/ui/star-rating'
import { ShoppingCart, Edit, Archive, Eye, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface ProductCardProps {
  product: ProductWithCategory & { 
    averageRating?: number
    reviewCount?: number 
  }
  onAddToCart?: (productId: string, quantity: number) => Promise<void>
  onDelete?: (productId: string) => Promise<void>
  onStatusToggle?: (productId: string, currentStatus: boolean) => Promise<void>
  showActions?: boolean
  variant?: 'customer' | 'admin'
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onDelete, 
  onStatusToggle,
  showActions = true,
  variant = 'customer'
}: ProductCardProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [quantity] = useState(1)

  const handleAddToCart = async () => {
    if (!onAddToCart || !session) return
    
    setIsLoading(true)
    try {
      await onAddToCart(product.id, quantity)
      toast.success('Product added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    const action = variant === 'admin' ? 'archive' : 'delete'
    if (confirm(`Are you sure you want to ${action} "${product.name}"?`)) {
      try {
        await onDelete(product.id)
        toast.success(`Product ${action}d successfully!`)
      } catch (error) {
        console.error(`Error ${action}ing product:`, error)
        toast.error(`Failed to ${action} product`)
      }
    }
  }

  const handleStatusToggle = async () => {
    if (!onStatusToggle) return
    
    try {
      await onStatusToggle(product.id, product.isActive)
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully!`)
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('Failed to update product status')
    }
  }

  const isAdmin = session?.user?.role === 'ADMIN'
  const isOutOfStock = product.stock === 0
  const showAdminActions = variant === 'admin' || isAdmin

  return (
    <Card className={`h-full flex flex-col ${!product.isActive ? 'opacity-75 border-dashed' : ''}`}>
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!product.isActive && (
              <Badge variant="secondary" className="bg-gray-500 text-white">
                Inactive
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            {product.category.name}
          </Badge>
          
          <Link href={`/products/${product.id}`}>
            <h3 className={`font-semibold text-lg hover:text-blue-600 transition-colors ${
              !product.isActive ? 'text-gray-500' : ''
            }`}>
              {product.name}
            </h3>
          </Link>
          
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Rating (if available) */}
          {product.averageRating !== undefined && product.reviewCount !== undefined && (
            <RatingDisplay 
              rating={product.averageRating} 
              count={product.reviewCount}
              size="sm" 
            />
          )}
          
          <div className="flex justify-between items-center">
            <span className={`text-2xl font-bold ${
              !product.isActive ? 'text-gray-500' : 'text-green-600'
            }`}>
              ${Number(product.price).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              Stock: {product.stock}
            </span>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0">
          {showAdminActions ? (
            <div className="flex gap-2 w-full">
              <Link href={`/products/${product.id}`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </Link>
              
              <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>

              {onStatusToggle && (
                <Button
                  variant="outline"
                  onClick={handleStatusToggle}
                  size="sm"
                  title={product.isActive ? 'Deactivate' : 'Activate'}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="destructive"
                onClick={handleDelete}
                size="sm"
                title="Archive Product"
              >
                <Archive className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || isOutOfStock || !session || !product.isActive}
              className="w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isLoading ? 'Adding...' : 
               !product.isActive ? 'Unavailable' :
               isOutOfStock ? 'Out of Stock' : 
               'Add to Cart'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}