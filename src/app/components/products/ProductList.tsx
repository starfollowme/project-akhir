// src/components/products/ProductList.tsx
'use client'

import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Grid, List } from 'lucide-react'
import { ProductWithCategory } from '@/types'

interface ProductListProps {
  products: ProductWithCategory[]
  categories: any[]
  onAddToCart?: (productId: string, quantity: number) => Promise<void>
  onDelete?: (productId: string) => Promise<void>
  showActions?: boolean
  searchTerm?: string
  selectedCategory?: string
  onSearch?: (search: string) => void
  onCategoryChange?: (category: string) => void
  loading?: boolean
}

export function ProductList({
  products,
  categories,
  onAddToCart,
  onDelete,
  showActions = true,
  searchTerm = '',
  selectedCategory = '',
  onSearch,
  onCategoryChange,
  loading = false
}: ProductListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [localSearch, setLocalSearch] = useState(searchTerm)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(localSearch)
  }

  const handleCategoryChange = (category: string) => {
    onCategoryChange?.(category)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 flex-1">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                <div className="bg-gray-200 h-6 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          {/* Search */}
          {onSearch && (
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          )}

          {/* Category Filter */}
          {onCategoryChange && categories.length > 0 && (
            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {products.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
          {selectedCategory && ` in ${categories.find(c => c.slug === selectedCategory)?.name}`}
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}

      {/* Products Grid/List */}
      {products.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {products.map((product) => (
            <div key={product.id} className={viewMode === 'list' ? 'max-w-none' : ''}>
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onDelete={onDelete}
                showActions={showActions}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'No products are available at the moment'
            }
          </p>
          {(searchTerm || selectedCategory) && onSearch && onCategoryChange && (
            <Button
              variant="outline"
              onClick={() => {
                setLocalSearch('')
                onSearch('')
                onCategoryChange('')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}