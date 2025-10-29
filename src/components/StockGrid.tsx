'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StockItem, GroupedStockItem } from '@/lib/types'
import Pagination from './Pagination'
import StockCard from './StockCard'

const ITEMS_PER_PAGE = 10

export default function StockGrid() {
  const [groupedItems, setGroupedItems] = useState<GroupedStockItem[]>([])
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
        // Fetch unique sizes using RPC call for better performance
        const { data: sizeData, error: sizeError } = await supabase
          .rpc('get_unique_sizes')

        if (sizeError) {
          console.error('Error fetching sizes:', sizeError)
          // Fallback to regular query with limit
          const { data: fallbackSizes } = await supabase
            .from('stock_items')
            .select('size')
            .not('size', 'is', null)
            .order('size')
            .limit(1000)
          const uniqueSizes = Array.from(new Set(fallbackSizes?.map(item => item.size).filter(Boolean))) as string[]
          setSizes(uniqueSizes)
        } else {
          // Extract size values from RPC response objects
          const sizeValues = sizeData?.map((item: any) => item.size).filter(Boolean) || []
          setSizes(sizeValues)
        }

        // Fetch unique colors using RPC call for better performance
        const { data: colorData, error: colorError } = await supabase
          .rpc('get_unique_colors')

        if (colorError) {
          console.error('Error fetching colors:', colorError)
          // Fallback to regular query with limit
          const { data: fallbackColors } = await supabase
            .from('stock_items')
            .select('color')
            .not('color', 'is', null)
            .order('color')
            .limit(1000)
          const uniqueColors = Array.from(new Set(fallbackColors?.map(item => item.color).filter(Boolean))) as string[]
          setColors(uniqueColors)
        } else {
          // Extract color values from RPC response objects
          const colorValues = colorData?.map((item: any) => item.color).filter(Boolean) || []
          setColors(colorValues)
        }

        // Fetch unique categories using RPC call for better performance
        const { data: categoryData, error: categoryError } = await supabase
          .rpc('get_unique_categories')

        if (categoryError) {
          console.error('Error fetching categories:', categoryError)
          // Fallback to regular query with limit
          const { data: fallbackCategories } = await supabase
            .from('stock_items')
            .select('category')
            .not('category', 'is', null)
            .order('category')
            .limit(1000)
          const uniqueCategories = Array.from(new Set(fallbackCategories?.map(item => item.category).filter(Boolean))) as string[]
          setCategories(uniqueCategories)
        } else {
          // Extract category values from RPC response objects
          const categoryValues = categoryData?.map((item: any) => item.category).filter(Boolean) || []
          setCategories(categoryValues)
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [])

  // Fetch and group stock items
  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)

        let query = supabase
          .from('stock_items')
          .select('*')
          .order('design_number', { ascending: true })

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

        const { data, error } = await query

        if (error) {
          console.error('Error fetching stock items:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setGroupedItems([])
          setTotalCount(0)
        } else {
          // Group items by design_number
          const grouped = groupByDesignNumber(data || [])
          // Sort by total_quantity descending (highest stock first)
          const sorted = grouped.sort((a, b) => b.total_quantity - a.total_quantity)
          setGroupedItems(sorted)
          setTotalCount(sorted.length)
        }
      } catch (error) {
        console.error('Error fetching stock items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [searchQuery, selectedSize, selectedColor, selectedCategory])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedSize, selectedColor, selectedCategory])

  // Group stock items by design_number
  const groupByDesignNumber = (items: StockItem[]): GroupedStockItem[] => {
    const grouped = items.reduce((acc, item) => {
      const key = item.design_number
      if (!acc[key]) {
        acc[key] = {
          design_number: item.design_number,
          category: item.category,
          catalogue_item_id: item.catalogue_item_id,
          total_quantity: 0,
          variations: []
        }
      }
      acc[key].total_quantity += item.quantity
      acc[key].variations.push({
        id: item.id,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      })
      return acc
    }, {} as Record<string, GroupedStockItem>)

    return Object.values(grouped)
  }

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

  // Pagination logic
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedItems = groupedItems.slice(startIndex, endIndex)
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
          {totalCount} {totalCount === 1 ? 'design' : 'designs'} found
        </div>
      </div>

      {/* Stock Items Grid */}
      {paginatedItems.length === 0 ? (
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
            {paginatedItems.map((item) => (
              <StockCard key={item.design_number} item={item} />
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
