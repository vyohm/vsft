'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OrderForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    productId: '',
    quantity: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create customer first
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
          },
        ])
        .select()
        .single()

      if (customerError) throw customerError

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: customer.id,
            product_id: formData.productId,
            quantity: formData.quantity,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // Redirect to order confirmation page
      router.push(`/order/${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.customerPhone}
          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="productId" className="block text-sm font-medium mb-2">
          Product ID *
        </label>
        <input
          type="text"
          id="productId"
          required
          value={formData.productId}
          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium mb-2">
          Quantity *
        </label>
        <input
          type="number"
          id="quantity"
          min="1"
          required
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </form>
  )
}
