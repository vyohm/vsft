'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CatalogueItem, OrderItemFormData } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

interface OrderItemRow extends OrderItemFormData {
  id: string
  catalogue_item?: CatalogueItem
  searching?: boolean
}

interface OrderItemsFormProps {
  onSubmit: (items: OrderItemFormData[]) => void
  onBack: () => void
}

export default function OrderItemsForm({ onSubmit, onBack }: OrderItemsFormProps) {
  const [rows, setRows] = useState<OrderItemRow[]>([
    {
      id: crypto.randomUUID(),
      design_number: '',
      quantity: 1,
      color_option: 'color1',
    },
  ])

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        design_number: '',
        quantity: 1,
        color_option: 'color1',
      },
    ])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  const searchDesignNumber = async (id: string, designNumber: string) => {
    if (!designNumber.trim()) return

    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, searching: true } : row))
    )

    try {
      const { data, error } = await supabase
        .from('catalogue_items')
        .select('*')
        .eq('design_number', designNumber)
        .eq('is_active', true)
        .single()

      if (error) throw error

      if (data) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, catalogue_item: data, searching: false }
              : row
          )
        )
      } else {
        alert('Design number not found')
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, catalogue_item: undefined, searching: false } : row
          )
        )
      }
    } catch (error) {
      console.error('Error searching design:', error)
      alert('Error searching for design number')
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, searching: false } : row
        )
      )
    }
  }

  const updateRow = (id: string, field: keyof OrderItemFormData, value: any) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all rows have catalogue items
    const invalidRows = rows.filter((row) => !row.catalogue_item)
    if (invalidRows.length > 0) {
      alert('Please search and select valid design numbers for all rows')
      return
    }

    onSubmit(
      rows.map((row) => ({
        design_number: row.design_number,
        quantity: row.quantity,
        color_option: row.color_option,
      }))
    )
  }

  const total = rows.reduce(
    (sum, row) => sum + (row.catalogue_item?.price || 0) * row.quantity,
    0
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Order Items</h2>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="p-4 border-2 border-brand-quaternary rounded-lg space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Item {index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Design Number *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={row.design_number}
                      onChange={(e) =>
                        updateRow(row.id, 'design_number', e.target.value)
                      }
                      className="flex-1 p-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary text-base"
                      placeholder="Enter design number"
                    />
                    <button
                      type="button"
                      onClick={() => searchDesignNumber(row.id, row.design_number)}
                      disabled={row.searching}
                      className="px-6 py-3 bg-brand-primary text-brand-light rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {row.searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                {row.catalogue_item && (
                  <div className="p-4 bg-brand-tertiary rounded-lg">
                    <p className="font-semibold text-lg">Design #{row.catalogue_item.design_number}</p>
                    <p className="text-2xl md:text-3xl font-bold text-brand-secondary mt-1">
                      {formatPrice(row.catalogue_item.price)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.id, 'quantity', parseInt(e.target.value))
                    }
                    className="w-full p-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color *</label>
                  <select
                    required
                    value={row.color_option}
                    onChange={(e) =>
                      updateRow(
                        row.id,
                        'color_option',
                        e.target.value as OrderItemFormData['color_option']
                      )
                    }
                    className="w-full p-3 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary"
                  >
                    <option value="color1">Color 1</option>
                    <option value="color2">Color 2</option>
                    <option value="color3">Color 3</option>
                    <option value="all">All Colors</option>
                  </select>
                </div>
              </div>

              {row.catalogue_item && (
                <div className="text-right">
                  <span className="text-lg font-semibold">
                    Line Total: {formatPrice(row.catalogue_item.price * row.quantity)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-4 w-full p-3 border-2 border-dashed border-brand-secondary text-brand-secondary rounded-lg hover:bg-brand-tertiary transition-colors"
        >
          + Add Row
        </button>

        <div className="mt-6 p-4 bg-brand-secondary rounded-lg">
          <div className="flex justify-between items-center text-brand-primary">
            <span className="text-xl font-bold">Order Total:</span>
            <span className="text-2xl font-bold">{formatPrice(total)}</span>
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
