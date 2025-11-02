'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { CatalogueItemWithPhotos, StockItem } from '@/lib/types'

interface QuickAddModalProps {
  item: CatalogueItemWithPhotos & {
    stockItems?: StockItem[]
    availableSizes?: string[]
    availableStockColors?: string[]
  }
  onClose: () => void
}

interface CartSelection {
  size: string
  color: string
  quantity: number
}

export default function QuickAddModal({ item, onClose }: QuickAddModalProps) {
  const { addItem } = useCart()
  const [selections, setSelections] = useState<CartSelection[]>([])
  const [error, setError] = useState<string>('')

  const hasStock = item.availableSizes && item.availableSizes.length > 0

  const addSelection = () => {
    setSelections([...selections, { size: '', color: '', quantity: 1 }])
  }

  const removeSelection = (index: number) => {
    setSelections(selections.filter((_, i) => i !== index))
  }

  const updateSelection = (index: number, field: keyof CartSelection, value: string | number) => {
    const newSelections = [...selections]
    newSelections[index] = { ...newSelections[index], [field]: value }
    setSelections(newSelections)
    setError('')
  }

  const handleAddToCart = () => {
    // If no stock info, add one item with quantity 1
    if (!hasStock) {
      addItem({
        design_number: item.design_number,
        catalogue_item_id: item.id,
        unit_price: item.price,
        quantity: 1,
        color_option: 'all',
        image_url: item.photos?.[0]?.photo_url,
        name: `Design #${item.design_number}`
      })
      onClose()
      return
    }

    // Validate selections
    if (selections.length === 0) {
      setError('Please add at least one size/color combination')
      return
    }

    for (const selection of selections) {
      if (item.availableSizes && item.availableSizes.length > 0 && !selection.size) {
        setError('Please select a size for all items')
        return
      }
      if (item.availableStockColors && item.availableStockColors.length > 0 && !selection.color) {
        setError('Please select a color for all items')
        return
      }
    }

    // Add all selections to cart
    selections.forEach(selection => {
      addItem({
        design_number: item.design_number,
        catalogue_item_id: item.id,
        unit_price: item.price,
        quantity: selection.quantity,
        size: selection.size || undefined,
        color: selection.color || undefined,
        color_option: 'all',
        image_url: item.photos?.[0]?.photo_url,
        name: `Design #${item.design_number}`
      })
    })

    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b-2 border-brand-quaternary p-4 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Design #{item.design_number}</h2>
              <p className="text-lg text-brand-secondary font-bold">₹{item.price}</p>
            </div>
            <button
              onClick={onClose}
              className="text-brand-quaternary hover:text-brand-primary text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6">
          {/* Image - smaller */}
          {item.photos?.[0]?.photo_url && (
            <div className="mb-4 w-48 mx-auto aspect-[2/3] bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-2 rounded-lg">
              <img
                src={item.photos[0].photo_url}
                alt={`Design ${item.design_number}`}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* No Stock - Simple Add */}
          {!hasStock && (
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 text-sm text-center">
              Your order will help us prioritize production and delivery.
            </div>
          )}

          {/* Multiple Selections */}
          {hasStock && (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Select Size & Color Combinations</h3>
                  <button
                    onClick={addSelection}
                    className="px-4 py-1 bg-brand-primary text-white rounded-full text-sm hover:bg-brand-secondary hover:text-brand-primary transition-colors"
                  >
                    + Add More
                  </button>
                </div>

                {selections.length === 0 && (
                  <p className="text-sm text-brand-quaternary mb-3">Click "Add More" to start adding items</p>
                )}

                {selections.map((selection, index) => (
                  <div key={index} className="mb-4 p-4 border-2 border-brand-quaternary rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-semibold text-brand-primary">Item #{index + 1}</span>
                      <button
                        onClick={() => removeSelection(index)}
                        className="text-red-500 hover:text-red-700 text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>

                    {/* Size */}
                    {item.availableSizes && item.availableSizes.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-xs font-semibold mb-2">Size *</label>
                        <div className="flex flex-wrap gap-2">
                          {item.availableSizes.map(size => (
                            <button
                              key={size}
                              onClick={() => updateSelection(index, 'size', size)}
                              className={`px-3 py-1 rounded-full border-2 transition-colors text-sm ${
                                selection.size === size
                                  ? 'bg-brand-primary text-white border-brand-primary'
                                  : 'bg-white text-brand-primary border-brand-quaternary hover:border-brand-primary'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color */}
                    {item.availableStockColors && item.availableStockColors.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-xs font-semibold mb-2">Color *</label>
                        <div className="flex flex-wrap gap-2">
                          {item.availableStockColors.map(color => (
                            <button
                              key={color}
                              onClick={() => updateSelection(index, 'color', color)}
                              className={`px-3 py-1 rounded-full border-2 transition-colors text-xs ${
                                selection.color === color
                                  ? 'bg-brand-secondary text-white border-brand-secondary'
                                  : 'bg-white text-brand-secondary border-brand-quaternary hover:border-brand-secondary'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">Quantity</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateSelection(index, 'quantity', Math.max(1, selection.quantity - 1))}
                          className="w-8 h-8 rounded-full bg-brand-quaternary text-white font-bold hover:bg-brand-primary transition-colors text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={selection.quantity}
                          onChange={(e) => updateSelection(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center border-2 border-brand-quaternary rounded-lg py-1 font-semibold text-sm"
                        />
                        <button
                          onClick={() => updateSelection(index, 'quantity', selection.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-brand-quaternary text-white font-bold hover:bg-brand-primary transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-brand-quaternary p-4">
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-brand-primary text-white px-6 py-3 rounded-full hover:bg-brand-secondary hover:text-brand-primary transition-colors font-semibold"
            >
              Add to Cart
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-brand-quaternary text-white px-6 py-3 rounded-full hover:opacity-80 transition-opacity font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
