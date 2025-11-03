'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, CustomerDetails } from '@/contexts/CartContext'
import { CatalogueItemWithPhotos, StockItem } from '@/lib/types'
import CustomerDetailsModal from './CustomerDetailsModal'

interface QuickAddModalProps {
  item: CatalogueItemWithPhotos & {
    stockItems?: StockItem[]
    availableSizes?: string[]
    availableStockColors?: string[]
  }
  onClose: () => void
  onEditPrice?: () => void
}

export default function QuickAddModal({ item, onClose, onEditPrice }: QuickAddModalProps) {
  const router = useRouter()
  const { addItem, customerDetails, setCustomerDetails } = useCart()
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [customSize, setCustomSize] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [error, setError] = useState<string>('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [pendingCartItems, setPendingCartItems] = useState<any[]>([])
  const [needsOrderStart, setNeedsOrderStart] = useState(false)

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
    setError('')
  }

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
    setError('')
  }

  const addCustomSize = () => {
    if (customSize.trim() && !selectedSizes.includes(customSize.trim())) {
      setSelectedSizes(prev => [...prev, customSize.trim()])
      setCustomSize('')
      setError('')
    }
  }

  const addCustomColor = () => {
    if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
      setSelectedColors(prev => [...prev, customColor.trim()])
      setCustomColor('')
      setError('')
    }
  }

  const handleAddToCart = () => {
    // Check if customer details exist first
    if (!customerDetails) {
      setNeedsOrderStart(true)
      return
    }

    // Validate at least one size or color is selected
    if (selectedSizes.length === 0 && selectedColors.length === 0) {
      setError('Please select at least one size or color')
      return
    }

    // Generate all combinations
    const sizes = selectedSizes.length > 0 ? selectedSizes : ['']
    const colors = selectedColors.length > 0 ? selectedColors : ['']

    const itemsToAdd: any[] = []
    sizes.forEach(size => {
      colors.forEach(color => {
        itemsToAdd.push({
          design_number: item.design_number,
          catalogue_item_id: item.id,
          unit_price: item.price,
          quantity: quantity,
          size: size || undefined,
          color: color || undefined,
          color_option: 'all',
          image_url: item.photos?.[0]?.photo_url,
          name: `Design #${item.design_number}`
        })
      })
    })

    // Add all items to cart
    itemsToAdd.forEach(cartItem => addItem(cartItem))
    onClose()
  }

  const handleStartOrder = () => {
    // Close the "Start Order" modal and redirect to order page
    // When they come back, customer details will be saved and they can add items
    onClose()
    router.push('/order')
  }

  const handleCustomerDetailsSubmit = async (details: CustomerDetails, verifyNow: boolean) => {
    // Save customer details
    setCustomerDetails({ ...details, is_whatsapp_verified: false })

    // If verify now, send verification code
    if (verifyNow) {
      // For now, just save as unverified. The verification will happen after order is placed.
      // We'll implement sending verification code in the next step
    }

    // Add pending items to cart
    pendingCartItems.forEach(cartItem => addItem(cartItem))

    // Close modals
    setShowCustomerModal(false)
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
              <div className="flex items-center gap-2">
                <p className="text-lg text-brand-secondary font-bold">₹{item.price}</p>
                {item.price === 0 && onEditPrice && (
                  <button
                    onClick={() => {
                      onEditPrice()
                      onClose()
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit price"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
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

          {/* Size Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Select Sizes</label>
            {item.availableSizes && item.availableSizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded-full border-2 transition-colors text-sm ${
                      selectedSizes.includes(size)
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-white text-brand-primary border-brand-quaternary hover:border-brand-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomSize()}
                placeholder="Custom size"
                className="flex-1 px-3 py-2 border-2 border-brand-quaternary rounded-lg text-sm focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={addCustomSize}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-secondary hover:text-brand-primary transition-colors font-bold"
              >
                +
              </button>
            </div>
            {selectedSizes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSizes.map(size => (
                  <span
                    key={size}
                    className="px-2 py-1 bg-brand-primary text-white rounded-full text-xs flex items-center gap-1"
                  >
                    {size}
                    <button
                      onClick={() => toggleSize(size)}
                      className="hover:text-red-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Select Colors</label>
            {item.availableStockColors && item.availableStockColors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.availableStockColors.map(color => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1 rounded-full border-2 transition-colors text-sm ${
                      selectedColors.includes(color)
                        ? 'bg-brand-secondary text-white border-brand-secondary'
                        : 'bg-white text-brand-secondary border-brand-quaternary hover:border-brand-secondary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomColor()}
                placeholder="Custom color"
                className="flex-1 px-3 py-2 border-2 border-brand-quaternary rounded-lg text-sm focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={addCustomColor}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-secondary hover:text-brand-primary transition-colors font-bold"
              >
                +
              </button>
            </div>
            {selectedColors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedColors.map(color => (
                  <span
                    key={color}
                    className="px-2 py-1 bg-brand-secondary text-white rounded-full text-xs flex items-center gap-1"
                  >
                    {color}
                    <button
                      onClick={() => toggleColor(color)}
                      className="hover:text-red-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Quantity (per combination)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-brand-quaternary text-white font-bold hover:bg-brand-primary transition-colors text-sm"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-2 border-brand-quaternary rounded-lg py-1 font-semibold text-sm"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-brand-quaternary text-white font-bold hover:bg-brand-primary transition-colors text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Combinations Preview */}
          {(selectedSizes.length > 0 || selectedColors.length > 0) && (
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">
                {(selectedSizes.length || 1) * (selectedColors.length || 1)} combination(s) will be added to cart
              </p>
              <p className="text-xs text-green-600">
                {selectedSizes.length > 0 && `${selectedSizes.length} size(s)`}
                {selectedSizes.length > 0 && selectedColors.length > 0 && ' × '}
                {selectedColors.length > 0 && `${selectedColors.length} color(s)`}
                {' with quantity ' + quantity + ' each'}
              </p>
              <p className="text-xs text-green-700 font-semibold mt-1">
                Total pieces: {(selectedSizes.length || 1) * (selectedColors.length || 1) * quantity}
              </p>
            </div>
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

      {/* Customer Details Modal */}
      {showCustomerModal && (
        <CustomerDetailsModal
          onSubmit={handleCustomerDetailsSubmit}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {/* Start Order Modal */}
      {needsOrderStart && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-brand-primary">Start Your Order First</h3>
            <p className="text-brand-quaternary mb-6">
              Before adding items to your cart, please provide your details and verify your WhatsApp number. This only takes a minute!
            </p>
            <p className="text-sm text-brand-quaternary mb-6 bg-brand-tertiary p-3 rounded-lg">
              💡 <strong>Tip:</strong> After setup, you can return to the Catalogue tab to browse and add items to your cart.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleStartOrder}
                className="flex-1 bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-colors font-semibold"
              >
                Setup Order
              </button>
              <button
                onClick={() => setNeedsOrderStart(false)}
                className="flex-1 bg-brand-quaternary text-white px-6 py-3 rounded-lg hover:opacity-80 transition-opacity font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
