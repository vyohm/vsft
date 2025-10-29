'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StockItem } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Pagination from './Pagination'

const ITEMS_PER_PAGE = 10

export default function StockGrid() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Filter options
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Fetch unique filter values
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        // Fetch unique sizes
        const { data: sizeData, error: sizeError } = await supabase
          .from('stock_items')
          .select('size')
          .not('size', 'is', null)
          .order('size')

        if (sizeError) {
          console.error('Error fetching sizes:', sizeError)
        } else {
          const uniqueSizes = Array.from(new Set(sizeData?.map(item => item.size).filter(Boolean))) as string[]
          setSizes(uniqueSizes)
        }

        // Fetch unique colors
        const { data: colorData, error: colorError } = await supabase
          .from('stock_items')
          .select('color')
          .not('color', 'is', null)
          .order('color')

        if (colorError) {
          console.error('Error fetching colors:', colorError)
        } else {
          const uniqueColors = Array.from(new Set(colorData?.map(item => item.color).filter(Boolean))) as string[]
          setColors(uniqueColors)
        }

        // Fetch unique categories
        const { data: categoryData, error: categoryError } = await supabase
          .from('stock_items')
          .select('category')
          .not('category', 'is', null)
          .order('category')

        if (categoryError) {
          console.error('Error fetching categories:', categoryError)
        } else {
          console.log('Raw category data:', categoryData)
          const uniqueCategories = Array.from(new Set(categoryData?.map(item => item.category).filter(Boolean))) as string[]
          console.log('Unique categories:', uniqueCategories)
          setCategories(uniqueCategories)
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [])

  // Fetch stock items
  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        let query = supabase
          .from('stock_items')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })

        // Apply search filter
        if (searchQuery) {
          query = query.ilike('design_number', `%${searchQuery}%`)
        }

        // Apply size filter
        if (selectedSize) {
          query = query.eq('size', selectedSize)
        }

        // Apply color filter
        if (selectedColor) {
          query = query.eq('color', selectedColor)
        }

        // Apply category filter
        if (selectedCategory) {
          query = query.eq('category', selectedCategory)
        }

        const { data, error, count } = await query.range(from, to)

        if (error) {
          console.error('Error fetching stock items:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
        }
        setItems(data || [])
        setTotalCount(count || 0)
      } catch (error) {
        console.error('Error fetching stock items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [currentPage, searchQuery, selectedSize, selectedColor, selectedCategory])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedSize, selectedColor, selectedCategory])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedSize('')
    setSelectedColor('')
    setSelectedCategory('')
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-brand-quaternary">Loading stock...</p>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasActiveFilters = searchQuery || selectedSize || selectedColor || selectedCategory

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by design number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Size Filter */}
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors bg-white"
          >
            <option value="">All Sizes</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          {/* Color Filter */}
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors bg-white"
          >
            <option value="">All Colors</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-brand-quaternary text-white rounded-lg hover:bg-brand-primary transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-brand-quaternary">
          {totalCount} {totalCount === 1 ? 'item' : 'items'} found
        </div>
      </div>

      {/* Stock Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-brand-quaternary">
            No stock items found matching your filters.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-6 py-2 bg-brand-secondary text-brand-primary rounded-full hover:bg-brand-tertiary transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <div className="h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-brand-tertiary to-brand-quaternary flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-4xl font-bold mb-2">{item.quantity}</p>
                    <p className="text-sm uppercase tracking-wider">In Stock</p>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold">
                      Design #{item.design_number}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm sm:text-base">
                    {item.size && (
                      <div className="flex justify-between">
                        <span className="text-brand-quaternary">Size:</span>
                        <span className="font-medium">{item.size}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="flex justify-between">
                        <span className="text-brand-quaternary">Color:</span>
                        <span className="font-medium">{item.color}</span>
                      </div>
                    )}
                    {item.category && (
                      <div className="flex justify-between">
                        <span className="text-brand-quaternary">Category:</span>
                        <span className="font-medium">{item.category}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-brand-quaternary">Quantity:</span>
                      <span className="font-bold text-brand-secondary">{item.quantity}</span>
                    </div>
                    {item.price && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-brand-quaternary">Price:</span>
                        <span className="text-xl font-bold text-brand-secondary">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </>
  )
}
