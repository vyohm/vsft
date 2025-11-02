'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomerDetailsForm from '@/components/CustomerDetailsForm'
import OrderItemsForm from '@/components/OrderItemsForm'
import WhatsAppVerificationStep from '@/components/WhatsAppVerificationStep'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import { CustomerFormData, OrderItemFormData } from '@/lib/types'

export default function OrderPage() {
  const router = useRouter()
  const { customerDetails, setCustomerDetails, items: cartItems, clearCart } = useCart()
  const [step, setStep] = useState<'customer' | 'verification' | 'items'>('customer')
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Check if customer details already exist on initial load only
  useEffect(() => {
    if (!hasInitialized && customerDetails && !submitting) {
      setCustomerData(customerDetails as CustomerFormData)
      // If already verified and has items, skip to items
      // If already verified but no items, redirect to catalogue
      // Otherwise go to verification
      if (customerDetails.is_whatsapp_verified) {
        if (cartItems.length === 0) {
          router.push('/#catalogue')
          setHasInitialized(true)
          return
        }
        setStep('items')
      } else {
        setStep('verification')
      }
      setHasInitialized(true)
    } else if (!hasInitialized) {
      setHasInitialized(true)
    }
  }, [customerDetails, submitting, hasInitialized, cartItems.length, router])

  const handleCustomerSubmit = async (data: CustomerFormData) => {
    setCustomerData(data)
    // Save to cart context so it persists
    setCustomerDetails(data)

    // Create or update customer in database so webhook can find them
    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select()
        .eq('phone_number', data.phone_number)
        .single()

      if (!existingCustomer) {
        // Create new customer
        await supabase
          .from('customers')
          .insert([{
            name: data.name,
            phone_number: data.phone_number,
            company_name: data.company_name,
            gst_number: data.gst_number,
            phone_verified: false,
            is_whatsapp_verified: false
          }])
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      // Continue anyway - don't block the flow
    }

    setStep('verification')
  }

  const handleVerified = (code: string) => {
    // Code verification handled
    // If no items in cart, redirect to catalogue to browse
    if (cartItems.length === 0) {
      router.push('/#catalogue')
    } else {
      setStep('items')
    }
  }

  const handleSkipVerification = () => {
    // If no items in cart, redirect to catalogue to browse
    if (cartItems.length === 0) {
      router.push('/#catalogue')
    } else {
      setStep('items')
    }
  }

  const handleOrderSubmit = async (items: OrderItemFormData[]) => {
    if (!customerData) return

    setSubmitting(true)

    try {
      console.log('Starting order submission...')
      console.log('Customer data:', customerData)
      console.log('Items to submit:', items)

      // 1. Create or get customer
      // First, try to find existing customer by phone number
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select()
        .eq('phone_number', customerData.phone_number)
        .single()

      let customer = existingCustomer

      if (!existingCustomer) {
        // Customer doesn't exist, create new one
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([customerData])
          .select()
          .single()

        if (customerError) {
          console.error('Customer creation error:', customerError)
          throw customerError
        }
        customer = newCustomer
        console.log('Customer created:', customer)
      } else {
        console.log('Using existing customer:', customer)
      }

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

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }
      console.log('Order created:', order)

      // 3. Get catalogue items for prices
      const designNumbers = items.map((item) => item.design_number)
      console.log('Fetching catalogue items for design numbers:', designNumbers)

      const { data: catalogueItems, error: catalogueError } = await supabase
        .from('catalogue_items')
        .select('*')
        .in('design_number', designNumbers)

      if (catalogueError) {
        console.error('Catalogue fetch error:', catalogueError)
        throw catalogueError
      }
      console.log('Catalogue items fetched:', catalogueItems)

      // 4. Create order items
      const orderItems = items.map((item) => {
        const catalogueItem = catalogueItems.find(
          (ci) => ci.design_number === item.design_number
        )
        if (!catalogueItem) throw new Error(`Design ${item.design_number} not found`)

        // Find matching cart item for size, color, and image
        const cartItem = cartItems.find(
          ci => ci.design_number === item.design_number &&
                ci.size === (item as any).size &&
                ci.color === (item as any).color
        )

        return {
          order_id: order.id,
          catalogue_item_id: catalogueItem.id,
          design_number: item.design_number,
          unit_price: catalogueItem.price,
          quantity: item.quantity,
          color_option: item.color_option,
          size: (item as any).size,
          color: (item as any).color,
          image_url: cartItem?.image_url,
        }
      })

      console.log('Order items to insert:', orderItems)

      const { error: itemsError, data: insertedItems } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) {
        console.error('Order items insertion error:', itemsError)
        console.error('Error code:', itemsError.code)
        console.error('Error message:', itemsError.message)
        console.error('Error details:', itemsError.details)
        console.error('Error hint:', itemsError.hint)
        throw itemsError
      }
      console.log('Order items inserted successfully:', insertedItems)

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

      // 6. Clear cart and customer details
      clearCart()

      // 7. Redirect to success page
      router.push(`/order/${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
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
                  step === 'verification'
                    ? 'bg-brand-secondary text-brand-primary'
                    : step === 'items'
                    ? 'bg-brand-primary text-brand-light'
                    : 'bg-brand-quaternary text-white'
                }`}
              >
                2
              </div>
              <div className="w-24 h-1 bg-brand-quaternary" />
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step === 'items'
                    ? 'bg-brand-secondary text-brand-primary'
                    : 'bg-brand-quaternary text-white'
                }`}
              >
                3
              </div>
            </div>
          </div>

          {submitting ? (
            <div className="text-center py-12">
              <p className="text-2xl text-brand-primary">Submitting your order...</p>
            </div>
          ) : step === 'customer' ? (
            <CustomerDetailsForm onSubmit={handleCustomerSubmit} />
          ) : step === 'verification' ? (
            <WhatsAppVerificationStep
              phoneNumber={customerData?.phone_number || ''}
              onVerified={handleVerified}
              onSkip={handleSkipVerification}
            />
          ) : (
            <OrderItemsForm
              onSubmit={handleOrderSubmit}
              onBack={() => setStep('verification')}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
