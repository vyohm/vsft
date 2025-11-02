'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils'

interface GroupedItem {
  design_number: string
  unit_price: number
  image_url?: string
  catalogue_item_id: number
  variants: Array<{
    size?: string
    color?: string
    quantity: number
  }>
}

interface OrderItemsFormProps {
  onSubmit: (items: any[]) => void
  onBack: () => void
}

export default function GroupedOrderItemsForm({ onSubmit, onBack }: OrderItemsFormProps) {
  const router = useRouter()
  const { items: cartItems, removeItem, updateQuantity } = useCart()
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([])
  const [editingItem, setEditingItem] = useState<string | null>(null)

  // Group cart items by design number
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/explore')
      return
    }

    const grouped = cartItems.reduce((acc, item) => {
      const existing = acc.find(g => g.design_number === item.design_number)

      if (existing) {
        existing.variants.push({
          size: item.size,
          color: item.color,
          quantity: item.quantity
        })
      } else {
        acc.push({
          design_number: item.design_number,
          unit_price: item.unit_price,
          image_url: item.image_url,
          catalogue_item_id: item.catalogue_item_id,
          variants: [{
            size: item.size,
            color: item.color,
            quantity: item.quantity
          }]
        })
      }

      return acc
    }, [] as GroupedItem[])

    setGroupedItems(grouped)
  }, [cartItems, router])

  const handleQuantityChange = (designNumber: string, size: string | undefined, color: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) return
    updateQuantity(designNumber, newQuantity, size, color)
  }

  const handleRemoveVariant = (designNumber: string, size: string | undefined, color: string | undefined) => {
    removeItem(designNumber, size, color)
  }

  const handleRemoveAllVariants = (designNumber: string) => {
    const item = groupedItems.find(g => g.design_number === designNumber)
    if (!item) return

    item.variants.forEach(variant => {
      removeItem(designNumber, variant.size, variant.color)
    })
  }

  const calculateItemTotal = (item: GroupedItem) => {
    return item.variants.reduce((sum, v) => sum + (v.quantity * item.unit_price), 0)
  }

  const calculateGrandTotal = () => {
    return groupedItems.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Flatten grouped items back to individual order items
    const orderItems = groupedItems.flatMap(item =>
      item.variants.map(variant => ({
        design_number: item.design_number,
        quantity: variant.quantity,
        color_option: 'all' as const,
        size: variant.size,
        color: variant.color
      }))
    )

    onSubmit(orderItems)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Order Items</h2>

        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="mb-4 w-full p-3 border-2 border-dashed border-brand-secondary text-brand-secondary rounded-lg hover:bg-brand-tertiary transition-colors"
        >
          + Add New Item
        </button>

        <div className="space-y-6">
          {groupedItems.map((item) => (
            <div
              key={item.design_number}
              className="border-2 border-brand-quaternary rounded-lg p-4"
            >
              {/* Header with image and design info */}
              <div className="flex gap-4 mb-4">
                {item.image_url && (
                  <div className="w-24 h-32 flex-shrink-0 bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-1 rounded-lg">
                    <img
                      src={item.image_url}
                      alt={`Design ${item.design_number}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Design #{item.design_number}</h3>
                  <p className="text-2xl font-bold text-brand-secondary mb-2">
                    {formatPrice(item.unit_price)} each
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(editingItem === item.design_number ? null : item.design_number)}
                      className="text-sm text-brand-primary hover:text-brand-secondary underline"
                    >
                      {editingItem === item.design_number ? 'Done' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllVariants(item.design_number)}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Remove All
                    </button>
                  </div>
                </div>
              </div>

              {/* Variants list */}
              <div className="space-y-3">
                {item.variants.map((variant, vIndex) => (
                  <div
                    key={`${variant.size}-${variant.color}-${vIndex}`}
                    className="flex items-center gap-3 p-3 bg-brand-tertiary rounded-lg"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      {variant.size && (
                        <span className="px-3 py-1 bg-brand-primary text-white rounded-full text-sm font-semibold">
                          {variant.size}
                        </span>
                      )}
                      {variant.color && (
                        <span className="px-3 py-1 bg-brand-secondary text-white rounded-full text-sm font-semibold">
                          {variant.color}
                        </span>
                      )}
                    </div>

                    {editingItem === item.design_number ? (
                      // Edit mode - show quantity controls
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-brand-quaternary">Qty:</span>
                        <div className="flex items-center border-2 border-brand-quaternary rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.design_number, variant.size, variant.color, variant.quantity - 1)}
                            className="px-3 py-1 text-brand-primary hover:bg-brand-tertiary transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={variant.quantity}
                            onChange={(e) => handleQuantityChange(item.design_number, variant.size, variant.color, parseInt(e.target.value) || 1)}
                            className="w-16 text-center py-1 border-0 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.design_number, variant.size, variant.color, variant.quantity + 1)}
                            className="px-3 py-1 text-brand-primary hover:bg-brand-tertiary transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(item.design_number, variant.size, variant.color)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // View mode - show quantity and subtotal
                      <div className="flex items-center gap-4">
                        <span className="text-brand-quaternary">Qty: {variant.quantity}</span>
                        <span className="text-lg font-bold text-brand-primary">
                          {formatPrice(variant.quantity * item.unit_price)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Item subtotal */}
              <div className="mt-3 pt-3 border-t border-brand-quaternary">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-brand-quaternary">Subtotal for Design #{item.design_number}:</span>
                  <span className="text-xl font-bold text-brand-secondary">
                    {formatPrice(calculateItemTotal(item))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="mt-6 p-4 bg-brand-secondary rounded-lg">
          <div className="flex justify-between items-center text-brand-primary">
            <span className="text-xl font-bold">Order Total:</span>
            <span className="text-2xl font-bold">{formatPrice(calculateGrandTotal())}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-brand-quaternary text-white px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:opacity-80 transition-opacity"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transition-colors"
        >
          Submit Order
        </button>
      </div>
    </form>
  )
}
