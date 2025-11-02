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

export default function QuickAddModal({ item, onClose }: QuickAddModalProps) {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string>('')

  const hasStock = item.availableSizes && item.availableSizes.length > 0

  const handleAddToCart = () => {
    // Only validate size/color selection if they are available options
    // No stock quantity validation - allow orders regardless of stock
    if (hasStock && item.availableSizes && item.availableSizes.length > 0 && !selectedSize) {
      setError('Please select a size')
      return
    }

    if (hasStock && item.availableStockColors && item.availableStockColors.length > 0 && !selectedColor) {
      setError('Please select a color')
      return
    }

    // Add to cart (no stock validation)
    addItem({
      design_number: item.design_number,
      catalogue_item_id: item.id,
      unit_price: item.price,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      color_option: 'all',
      image_url: item.photos?.[0]?.photo_url,
      name: `Design #${item.design_number}`
    })

    // Close modal
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Design #{item.design_number}</h2>
            <p className="text-xl text-brand-secondary font-bold mt-1">
              ₹{item.price}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-quaternary hover:text-brand-primary text-2xl"
          >
            ×
          </button>
        </div>

        {/* Image */}
        {item.photos?.[0]?.photo_url && (
          <div className="mb-4 aspect-[2/3] bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-2 rounded-lg">
            <img
              src={item.photos[0].photo_url}
              alt={`Design ${item.design_number}`}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Size Selection */}
        {hasStock && item.availableSizes && item.availableSizes.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Select Size *</label>
            <div className="flex flex-wrap gap-2">
              {item.availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size)
                    setError('')
                  }}
                  className={`px-4 py-2 rounded-full border-2 transition-colors ${
                    selectedSize === size
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

        {/* Color Selection */}
        {hasStock && item.availableStockColors && item.availableStockColors.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Select Color *</label>
            <div className="flex flex-wrap gap-2">
              {item.availableStockColors.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color)
                    setError('')
                  }}
                  className={`px-4 py-2 rounded-full border-2 transition-colors text-sm ${
                    selectedColor === color
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
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full bg-brand-quaternary text-white font-bold hover:bg-brand-primary transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center border-2 border-brand-quaternary rounded-lg py-2 font-semibold"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-brand-quaternary text-white font-bold hover:bg-brand-primary transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Info Message */}
        {!hasStock && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 text-sm">
            Your order will help us prioritize production and delivery.
          </div>
        )}

        {/* Actions */}
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
  )
}
