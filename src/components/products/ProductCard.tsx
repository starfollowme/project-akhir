// src/components/products/ProductCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProductWithCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Edit, Trash2 } from 'lucide-react';

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToCart?: (productId: string, quantity: number) => Promise<void>;
  onDelete?: (productId: string) => Promise<void>;
  showActions?: boolean;
}

export function ProductCard({ product, onAddToCart, onDelete, showActions = true }: ProductCardProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity] = useState(1);

  const handleAddToCart = async () => {
    if (!onAddToCart || !session) return;

    setIsLoading(true);
    try {
      await onAddToCart(product.id, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await onDelete(product.id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const isAdmin = session?.user?.role === 'ADMIN';
  const isOutOfStock = product.stock === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="space-y-2">
          <Badge
            variant="secondary"
            className="text-xs"
          >
            {product.category.name}
          </Badge>

          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">{product.name}</h3>
          </Link>

          {product.description && <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>}

          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-green-600">${Number(product.price).toFixed(2)}</span>
            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0">
          {isAdmin ? (
            <div className="flex gap-2 w-full">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || isOutOfStock || !session}
              className="w-full"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
