'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CatalogueItemWithPhotos, StockItem } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Pagination from './Pagination'
import QuickAddModal from './QuickAddModal'
import AddItemModal from './AddItemModal'
import EditPriceModal from './EditPriceModal'

const ITEMS_PER_PAGE = 12

interface ItemWithStock extends CatalogueItemWithPhotos {
  stockItems?: StockItem[]
  availableSizes?: string[]
  availableStockColors?: string[]
}

// Generate design number variations for fuzzy matching
function generateVariations(designNumber: string): string[] {
  const variations = new Set<string>()
  const upper = designNumber.toUpperCase().trim()
  variations.add(upper)

  // SFT <-> SF conversion
  if (upper.startsWith('SFT')) {
    variations.add(upper.replace('SFT', 'SF'))
  } else if (upper.startsWith('SF')) {
    variations.add('SFT' + upper.substring(2))
  }

  // Remove leading zeros and add padded versions
  const match = upper.match(/^([A-Z]+)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const number = match[2]

    const numWithoutZeros = parseInt(number, 10).toString()
    if (numWithoutZeros !== number) {
      variations.add(prefix + numWithoutZeros)
    }

    const paddedVariations = [
      number.padStart(4, '0'),
      number.padStart(3, '0'),
      number.padStart(2, '0')
    ]
    paddedVariations.forEach(padded => {
      variations.add(prefix + padded)
      if (prefix === 'SFT') {
        variations.add('SF' + padded)
      } else if (prefix === 'SF') {
        variations.add('SFT' + padded)
      }
    })
  }

  return Array.from(variations)
}

export default function CatalogueGrid() {
  const [items, setItems] = useState<ItemWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const [quickAddItem, setQuickAddItem] = useState<ItemWithStock | null>(null)
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [editPriceItem, setEditPriceItem] = useState<ItemWithStock | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)
        setSearchError(null)
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        // Build query with search filter
        let query = supabase
          .from('catalogue_items')
          .select('id')
          .eq('is_active', true)

        // Apply search filter at database level
        if (debouncedSearchQuery) {
          query = query.ilike('design_number', `%${debouncedSearchQuery}%`)
        }

        const { data: allItems, error: allItemsError } = await query

        if (allItemsError) throw allItemsError

        // Get photo counts for all items
        const allItemIds = allItems?.map(item => item.id) || []
        const { data: allPhotos, error: allPhotosError } = await supabase
          .from('catalogue_item_photos')
          .select('catalogue_item_id')
          .in('catalogue_item_id', allItemIds)

        if (allPhotosError) throw allPhotosError

        // Group by item ID to count photos
        const photoCountMap = new Map<number, number>()
        allPhotos?.forEach(photo => {
          const count = photoCountMap.get(photo.catalogue_item_id) || 0
          photoCountMap.set(photo.catalogue_item_id, count + 1)
        })

        // Sort items: those with photos first, then by created_at
        const sortedItemIds = allItems
          ?.sort((a, b) => {
            const aHasPhotos = (photoCountMap.get(a.id) || 0) > 0
            const bHasPhotos = (photoCountMap.get(b.id) || 0) > 0
            if (aHasPhotos && !bHasPhotos) return -1
            if (!aHasPhotos && bHasPhotos) return 1
            return 0
          })
          .map(item => item.id) || []

        // Get the page slice
        const pageItemIds = sortedItemIds.slice(from, to + 1)

        // Fetch full data for this page
        const { data: catalogueData, error: catalogueError } = await supabase
          .from('catalogue_items')
          .select('*')
          .in('id', pageItemIds)

        const count = sortedItemIds.length

        if (catalogueError) throw catalogueError

        // Fetch photos for all items
        const itemIds = catalogueData?.map(item => item.id) || []
        const { data: photosData, error: photosError } = await supabase
          .from('catalogue_item_photos')
          .select('*')
          .in('catalogue_item_id', itemIds)
          .order('display_order', { ascending: true })

        if (photosError) throw photosError

        // Fetch ALL stock items with pagination
        let allStockItems: StockItem[] = []
        let stockPage = 0
        const stockPageSize = 1000
        let hasMoreStock = true

        while (hasMoreStock) {
          const { data: stockData, error: stockError } = await supabase
            .from('stock_items')
            .select('*')
            .range(stockPage * stockPageSize, (stockPage + 1) * stockPageSize - 1)

          if (stockError) throw stockError

          if (stockData && stockData.length > 0) {
            allStockItems = allStockItems.concat(stockData)
            stockPage++
            hasMoreStock = stockData.length === stockPageSize
          } else {
            hasMoreStock = false
          }
        }

        // Build stock variation map for fuzzy matching
        const stockByDesign = new Map<string, StockItem[]>()
        allStockItems.forEach(stockItem => {
          const variations = generateVariations(stockItem.design_number)
          variations.forEach(variation => {
            const existing = stockByDesign.get(variation) || []
            stockByDesign.set(variation, [...existing, stockItem])
          })
        })

        // Merge photos and stock with catalogue items
        const itemMap = new Map(catalogueData?.map(item => [item.id, item]) || [])
        const itemsWithPhotos: ItemWithStock[] = pageItemIds.map(id => {
          const item = itemMap.get(id)!
          const photos = photosData?.filter(photo => photo.catalogue_item_id === id) || []

          // Find matching stock items using fuzzy matching
          const catalogueVariations = generateVariations(item.design_number)
          let stockItems: StockItem[] = []
          for (const variation of catalogueVariations) {
            const matchedStock = stockByDesign.get(variation)
            if (matchedStock) {
              stockItems = matchedStock
              break
            }
          }

          // Extract unique sizes and colors from stock (normalize FREE variations)
          const normalizedSizes = stockItems
            .map(s => s.size)
            .filter(Boolean)
            .map(size => ['F', 'FREE_SIZE'].includes(size!.toUpperCase()) ? 'FREE' : size!)
          const sizes = Array.from(new Set(normalizedSizes)).sort()
          const stockColors = Array.from(new Set(stockItems.map(s => s.color).filter(Boolean))).sort()

          return {
            ...item,
            photos,
            stockItems,
            availableSizes: sizes,
            availableStockColors: stockColors
          }
        })

        // Set search error if search returned no results, then reload all items
        if (debouncedSearchQuery && count === 0) {
          setSearchError(`Design "${debouncedSearchQuery}" not found`)

          // Fetch all items instead
          const { data: allItemsData } = await supabase
            .from('catalogue_items')
            .select('id')
            .eq('is_active', true)

          const allItemIds = allItemsData?.map(item => item.id) || []

          // Get photo counts for sorting
          const { data: allPhotosData } = await supabase
            .from('catalogue_item_photos')
            .select('catalogue_item_id')
            .in('catalogue_item_id', allItemIds)

          const photoCountMap2 = new Map<number, number>()
          allPhotosData?.forEach(photo => {
            const count = photoCountMap2.get(photo.catalogue_item_id) || 0
            photoCountMap2.set(photo.catalogue_item_id, count + 1)
          })

          // Sort and get page
          const sortedIds = allItemsData
            ?.sort((a, b) => {
              const aHasPhotos = (photoCountMap2.get(a.id) || 0) > 0
              const bHasPhotos = (photoCountMap2.get(b.id) || 0) > 0
              if (aHasPhotos && !bHasPhotos) return -1
              if (!aHasPhotos && bHasPhotos) return 1
              return 0
            })
            .map(item => item.id) || []

          const pageIds = sortedIds.slice(from, to + 1)

          // Fetch full data
          const { data: fullData } = await supabase
            .from('catalogue_items')
            .select('*')
            .in('id', pageIds)

          // Fetch photos
          const { data: pagePhotos } = await supabase
            .from('catalogue_item_photos')
            .select('*')
            .in('catalogue_item_id', pageIds)
            .order('display_order', { ascending: true })

          // Merge with stock
          const itemMap2 = new Map(fullData?.map(item => [item.id, item]) || [])
          const allItemsWithPhotos: ItemWithStock[] = pageIds.map(id => {
            const item = itemMap2.get(id)!
            const photos = pagePhotos?.filter(photo => photo.catalogue_item_id === id) || []

            const catalogueVariations = generateVariations(item.design_number)
            let stockItems: StockItem[] = []
            for (const variation of catalogueVariations) {
              const matchedStock = stockByDesign.get(variation)
              if (matchedStock) {
                stockItems = matchedStock
                break
              }
            }

            const normalizedSizes = stockItems
              .map(s => s.size)
              .filter(Boolean)
              .map(size => ['F', 'FREE_SIZE'].includes(size!.toUpperCase()) ? 'FREE' : size!)
            const sizes = Array.from(new Set(normalizedSizes)).sort()
            const stockColors = Array.from(new Set(stockItems.map(s => s.color).filter(Boolean))).sort()

            return {
              ...item,
              photos,
              stockItems,
              availableSizes: sizes,
              availableStockColors: stockColors
            }
          })

          setItems(allItemsWithPhotos)
          setTotalCount(sortedIds.length)
        } else {
          setItems(itemsWithPhotos)
          setTotalCount(count)
        }

        setIsInitialLoad(false)

        // Get all unique color names for dropdown
        const { data: colorPhotos } = await supabase
          .from('catalogue_item_photos')
          .select('color_name')
          .not('color_name', 'is', null)

        const uniqueColors = Array.from(new Set(colorPhotos?.map(p => p.color_name).filter(Boolean) || []))
        setAvailableColors(uniqueColors.sort())

        // Get all unique sizes from stock and normalize FREE variations
        const allSizesSet = new Set<string>()
        allStockItems.forEach(item => {
          if (item.size) {
            // Normalize all FREE variations to just "FREE"
            const normalizedSize = ['F', 'FREE_SIZE'].includes(item.size.toUpperCase())
              ? 'FREE'
              : item.size
            allSizesSet.add(normalizedSize)
          }
        })
        const uniqueSizes = Array.from(allSizesSet).sort()
        setAvailableSizes(uniqueSizes)
      } catch (error) {
        console.error('Error fetching catalogue items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [currentPage, debouncedSearchQuery])

  // Get filtered items based on color and size (search now happens server-side)
  const filteredItems = items.filter(item => {
    const matchesColor = !colorFilter ||
      item.photos?.some(p => p.color_name?.toLowerCase().includes(colorFilter.toLowerCase()))

    const matchesSize = !sizeFilter ||
      item.availableSizes?.includes(sizeFilter)

    return matchesColor && matchesSize
  })

  // Only show loading screen on initial load, not on subsequent searches
  if (isInitialLoad && loading) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-brand-quaternary">Loading catalogue...</p>
      </div>
    )
  }

  // Only show error if no search query and no items
  if (items.length === 0 && !debouncedSearchQuery) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <p className="text-xl text-brand-quaternary">
            No items found. Total count: {totalCount}
          </p>
          <p className="text-sm text-brand-quaternary">
            Check browser console (F12) for errors
          </p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <>
      {/* Loading indicator for background updates */}
      {loading && !isInitialLoad && (
        <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 text-sm text-center">
          Searching...
        </div>
      )}

      {/* Search error notification */}
      {searchError && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span className="flex-1">{searchError}</span>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
              title="Add this item to catalogue"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
            <button
              onClick={() => {
                setSearchQuery('')
                setDebouncedSearchQuery('')
                setSearchError(null)
              }}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by design number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary"
          />
        </div>
        <div className="flex-1">
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="w-full p-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary"
          >
            <option value="">All Sizes</option>
            {availableSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="w-full p-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary"
          >
            <option value="">All Colors</option>
            {availableColors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {filteredItems.map((item) => {
          const photos = item.photos || []
          const hasPhotos = photos.length > 0

          // Show first available photo (prioritize color1)
          const primaryPhoto = photos.find(p => p.color_variant === 'color1') || photos[0]
          const photoUrl = primaryPhoto?.photo_url || item.image_url

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl active:scale-95 transition-all cursor-pointer"
              onClick={() => setQuickAddItem(item)}
            >
              <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-1">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt={item.name || `Design ${item.design_number}`}
                    className="w-full h-full object-contain"
                  />
                )}
                {!hasPhotos && (
                  <div className="w-full h-full flex items-center justify-center text-brand-quaternary text-sm">
                    No Photo
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <h3 className="text-sm font-semibold mb-2">Design #{item.design_number}</h3>
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-bold text-brand-secondary">
                    {formatPrice(item.price)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuickAddItem(item)
                    }}
                    className="w-full bg-brand-primary text-brand-light px-4 py-2 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors text-xs font-medium"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Quick Add Modal */}
      {quickAddItem && (
        <QuickAddModal
          item={quickAddItem}
          onClose={() => setQuickAddItem(null)}
          onEditPrice={() => setEditPriceItem(quickAddItem)}
        />
      )}

      {/* Add Item Modal */}
      {showAddItemModal && debouncedSearchQuery && (
        <AddItemModal
          designNumber={debouncedSearchQuery}
          onClose={() => setShowAddItemModal(false)}
          onSuccess={() => {
            setShowAddItemModal(false)
            setSearchError(null)
            // Trigger a refresh by updating the search
            setDebouncedSearchQuery('')
            setTimeout(() => {
              setDebouncedSearchQuery(searchQuery)
            }, 100)
          }}
        />
      )}

      {/* Edit Price Modal */}
      {editPriceItem && (
        <EditPriceModal
          itemId={editPriceItem.id.toString()}
          designNumber={editPriceItem.design_number}
          currentPrice={editPriceItem.price}
          onClose={() => setEditPriceItem(null)}
          onSuccess={() => {
            setEditPriceItem(null)
            // Trigger a refresh
            setDebouncedSearchQuery('')
            setTimeout(() => {
              setDebouncedSearchQuery(searchQuery)
            }, 100)
          }}
        />
      )}
    </>
  )
}
