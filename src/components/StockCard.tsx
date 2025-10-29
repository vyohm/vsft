'use client'

import { useState } from 'react'
import { GroupedStockItem } from '@/lib/types'

type GroupByMode = 'color' | 'size'

interface StockCardProps {
  item: GroupedStockItem
}

export default function StockCard({ item }: StockCardProps) {
  const [groupBy, setGroupBy] = useState<GroupByMode>('color')

  // Group variations by color or size
  const getGroupedVariations = () => {
    if (groupBy === 'color') {
      // Group by color, show sizes under each color
      const grouped = item.variations.reduce((acc, variation) => {
        const key = variation.color || 'No Color'
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(variation)
        return acc
      }, {} as Record<string, typeof item.variations>)

      return Object.entries(grouped).map(([key, variations]) => ({
        groupKey: key,
        variations: variations.sort((a, b) => (a.size || '').localeCompare(b.size || ''))
      }))
    } else {
      // Group by size, show colors under each size
      const grouped = item.variations.reduce((acc, variation) => {
        const key = variation.size || 'No Size'
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(variation)
        return acc
      }, {} as Record<string, typeof item.variations>)

      return Object.entries(grouped).map(([key, variations]) => ({
        groupKey: key,
        variations: variations.sort((a, b) => (a.color || '').localeCompare(b.color || ''))
      }))
    }
  }

  const groupedVariations = getGroupedVariations()

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all">
      <div className="h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-brand-tertiary to-brand-quaternary flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-4xl font-bold mb-2">{item.total_quantity}</p>
          <p className="text-sm uppercase tracking-wider">Total In Stock</p>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-semibold">
            Design #{item.design_number}
          </h3>
          {item.category && (
            <p className="text-sm text-brand-quaternary">{item.category}</p>
          )}
        </div>

        {/* Toggle between Color and Size view */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setGroupBy('color')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              groupBy === 'color'
                ? 'bg-brand-secondary text-brand-primary'
                : 'bg-brand-tertiary/30 text-brand-quaternary hover:bg-brand-tertiary/50'
            }`}
          >
            By Color
          </button>
          <button
            onClick={() => setGroupBy('size')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              groupBy === 'size'
                ? 'bg-brand-secondary text-brand-primary'
                : 'bg-brand-tertiary/30 text-brand-quaternary hover:bg-brand-tertiary/50'
            }`}
          >
            By Size
          </button>
        </div>

        {/* Grouped Variations */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-brand-quaternary font-semibold">
            {groupBy === 'color' ? 'Colors' : 'Sizes'} ({groupedVariations.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {groupedVariations.map((group, idx) => (
              <div key={idx} className="border border-brand-tertiary/30 rounded-lg p-2">
                {/* Group Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-brand-primary">
                    {group.groupKey}
                  </span>
                  <span className="text-xs text-brand-quaternary">
                    {group.variations.reduce((sum, v) => sum + v.quantity, 0)} total
                  </span>
                </div>

                {/* Items in this group */}
                <div className="space-y-1">
                  {group.variations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between text-xs bg-brand-tertiary/10 px-2 py-1 rounded"
                    >
                      <span className="text-brand-quaternary">
                        {groupBy === 'color'
                          ? (variation.size || 'N/A')
                          : (variation.color || 'N/A')
                        }
                      </span>
                      <span className="font-bold text-brand-secondary">
                        {variation.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
