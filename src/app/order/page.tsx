'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomerDetailsForm from '@/components/CustomerDetailsForm'
import OrderItemsForm from '@/components/OrderItemsForm'
import { supabase } from '@/lib/supabase'
import { CustomerFormData, OrderItemFormData } from '@/lib/types'

export default function OrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<'customer' | 'items'>('customer')
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCustomerSubmit = (data: CustomerFormData) => {
    setCustomerData(data)
    setStep('items')
  }

  const handleOrderSubmit = async (items: OrderItemFormData[]) => {
    if (!customerData) return

    setSubmitting(true)

    try {
      // 1. Create or get customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single()

      if (customerError) throw customerError

      // 2. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: customer.id,
            status: 'submitted',
            total_amount: 0, // Will be updated via trigger or manually
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // 3. Get catalogue items for prices
      const designNumbers = items.map((item) => item.design_number)
      const { data: catalogueItems, error: catalogueError } = await supabase
        .from('catalogue_items')
        .select('*')
        .in('design_number', designNumbers)

      if (catalogueError) throw catalogueError

      // 4. Create order items
      const orderItems = items.map((item) => {
        const catalogueItem = catalogueItems.find(
          (ci) => ci.design_number === item.design_number
        )
        if (!catalogueItem) throw new Error(`Design ${item.design_number} not found`)

        return {
          order_id: order.id,
          catalogue_item_id: catalogueItem.id,
          design_number: item.design_number,
          unit_price: catalogueItem.price,
          quantity: item.quantity,
          color_option: item.color_option,
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 5. Update order total
      const total = orderItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      )

      const { error: updateError } = await supabase
        .from('orders')
        .update({ total_amount: total })
        .eq('id', order.id)

      if (updateError) throw updateError

      // 6. Redirect to success page
      router.push(`/order/${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4 bg-brand-light">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-light text-center mb-12 tracking-[2px]">
            Place Your Order
          </h1>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step === 'customer'
                    ? 'bg-brand-secondary text-brand-primary'
                    : 'bg-brand-primary text-brand-light'
                }`}
              >
                1
              </div>
              <div className="w-24 h-1 bg-brand-quaternary" />
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step === 'items'
                    ? 'bg-brand-secondary text-brand-primary'
                    : 'bg-brand-quaternary text-white'
                }`}
              >
                2
              </div>
            </div>
          </div>

          {submitting ? (
            <div className="text-center py-12">
              <p className="text-2xl text-brand-primary">Submitting your order...</p>
            </div>
          ) : step === 'customer' ? (
            <CustomerDetailsForm onSubmit={handleCustomerSubmit} />
          ) : (
            <OrderItemsForm
              onSubmit={handleOrderSubmit}
              onBack={() => setStep('customer')}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
