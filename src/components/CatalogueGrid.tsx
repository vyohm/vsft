'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CatalogueItem } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Pagination from './Pagination'
import Link from 'next/link'

const ITEMS_PER_PAGE = 10

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-brand-tertiary to-brand-quaternary">
              {(item.photoshoot_url || item.image_url) && (
                <img
                  src={item.photoshoot_url || item.image_url}
                  alt={item.name || `Design ${item.design_number}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-2">
                <h3 className="text-lg sm:text-xl font-semibold">Design #{item.design_number}</h3>
              </div>
              {item.description && (
                <p className="text-brand-quaternary mb-3 text-sm sm:text-base line-clamp-2">{item.description}</p>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
                <span className="text-xl sm:text-2xl font-bold text-brand-secondary">
                  {formatPrice(item.price)}
                </span>
                <Link href="/order" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-brand-primary text-brand-light px-5 py-2.5 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors text-sm font-medium">
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
