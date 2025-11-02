'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CatalogueItemWithPhotos } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Pagination from './Pagination'
import Link from 'next/link'

const ITEMS_PER_PAGE = 12

export default function CatalogueGrid() {
  const [items, setItems] = useState<CatalogueItemWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<CatalogueItemWithPhotos | null>(null)
  const [availableColors, setAvailableColors] = useState<string[]>([])

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        // Fetch ALL catalogue items first to sort them properly
        const { data: allItems, error: allItemsError } = await supabase
          .from('catalogue_items')
          .select('id')
          .eq('is_active', true)

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

        // Merge photos with catalogue items and maintain sorted order
        const itemMap = new Map(catalogueData?.map(item => [item.id, item]) || [])
        const itemsWithPhotos = pageItemIds.map(id => {
          const item = itemMap.get(id)!
          return {
            ...item,
            photos: photosData?.filter(photo => photo.catalogue_item_id === id) || []
          }
        })

        setItems(itemsWithPhotos)
        setTotalCount(count)

        // Get all unique color names for dropdown
        const { data: colorPhotos } = await supabase
          .from('catalogue_item_photos')
          .select('color_name')
          .not('color_name', 'is', null)

        const uniqueColors = Array.from(new Set(colorPhotos?.map(p => p.color_name).filter(Boolean) || []))
        setAvailableColors(uniqueColors.sort())
      } catch (error) {
        console.error('Error fetching catalogue items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [currentPage, searchQuery, colorFilter])

  // Get filtered items based on search
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery ||
      item.design_number.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesColor = !colorFilter ||
      item.photos?.some(p => p.color_name?.toLowerCase().includes(colorFilter.toLowerCase()))

    return matchesSearch && matchesColor
  })

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-brand-quaternary">Loading catalogue...</p>
      </div>
    )
  }

  if (items.length === 0) {
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
          // Only count photos that have color names
          const colorPhotos = photos.filter(p => p.color_name)
          const colorCount = colorPhotos.length

          // Show first available photo (prioritize color1)
          const primaryPhoto = photos.find(p => p.color_variant === 'color1') || photos[0]
          const photoUrl = primaryPhoto?.photo_url || item.image_url

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl active:scale-95 transition-all cursor-pointer"
              onClick={() => setSelectedItem(item)}
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
                {colorCount > 0 && (
                  <p className="text-xs text-brand-secondary mb-2">
                    {colorCount} color{colorCount > 1 ? 's' : ''} available
                  </p>
                )}
                {item.description && (
                  <p className="text-brand-quaternary mb-2 text-xs line-clamp-2">{item.description}</p>
                )}
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-bold text-brand-secondary">
                    {formatPrice(item.price)}
                  </span>
                  <Link href="/order" className="w-full" onClick={(e) => e.stopPropagation()}>
                    <button className="w-full bg-brand-primary text-brand-light px-4 py-2 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors text-xs font-medium">
                      Order Now
                    </button>
                  </Link>
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

      {/* Color Variations Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Design #{selectedItem.design_number}</h2>
                  <p className="text-xl text-brand-secondary font-bold mt-2">
                    {formatPrice(selectedItem.price)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-brand-quaternary hover:text-brand-primary text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedItem.description && (
                <p className="text-brand-quaternary mb-6">{selectedItem.description}</p>
              )}

              <h3 className="font-semibold mb-4">Available Colors:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedItem.photos
                  ?.filter(p => p.color_name)
                  .map((photo) => (
                    <div key={photo.id} className="border-2 border-brand-quaternary rounded-lg overflow-hidden">
                      <div className="aspect-[2/3] bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-2">
                        <img
                          src={photo.photo_url}
                          alt={`${selectedItem.design_number} - ${photo.color_name}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-3 text-center bg-brand-tertiary">
                        <p className="font-semibold text-brand-primary">{photo.color_name}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {(!selectedItem.photos || selectedItem.photos.filter(p => p.color_name).length === 0) && (
                <p className="text-brand-quaternary text-center py-8">
                  No color variations available for this design.
                </p>
              )}

              <div className="mt-6 flex gap-4">
                <Link href="/order" className="flex-1" onClick={() => setSelectedItem(null)}>
                  <button className="w-full bg-brand-primary text-brand-light px-6 py-3 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors font-semibold">
                    Order Now
                  </button>
                </Link>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-brand-quaternary text-white px-6 py-3 rounded-full hover:opacity-80 transition-opacity font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
