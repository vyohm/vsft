'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CatalogueItem } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Pagination from './Pagination'
import Link from 'next/link'

const ITEMS_PER_PAGE = 12

export default function CatalogueGrid() {
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    async function fetchItems() {
      try {
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        const { data, error, count } = await supabase
          .from('catalogue_items')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) throw error
        setItems(data || [])
        setTotalCount(count || 0)
      } catch (error) {
        console.error('Error fetching catalogue items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [currentPage])

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-1">
              {(item.photoshoot_url || item.image_url) && (
                <img
                  src={item.photoshoot_url || item.image_url}
                  alt={item.name || `Design ${item.design_number}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="p-3 text-center">
              <h3 className="text-sm font-semibold mb-2">Design #{item.design_number}</h3>
              {item.description && (
                <p className="text-brand-quaternary mb-2 text-xs line-clamp-2">{item.description}</p>
              )}
              <div className="flex flex-col gap-2">
                <span className="text-lg font-bold text-brand-secondary">
                  {formatPrice(item.price)}
                </span>
                <Link href="/order" className="w-full">
                  <button className="w-full bg-brand-primary text-brand-light px-4 py-2 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors text-xs font-medium">
                    Order Now
                  </button>
                </Link>
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
  )
}
