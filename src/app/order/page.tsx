'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomerDetailsForm from '@/components/CustomerDetailsForm'
import GroupedOrderItemsForm from '@/components/GroupedOrderItemsForm'
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
  const [verificationCompleted, setVerificationCompleted] = useState(false)

  // Check if customer details already exist on initial load only
  useEffect(() => {
    if (!hasInitialized && customerDetails && !submitting) {
      setCustomerData(customerDetails as CustomerFormData)

      // If customer has items in cart, they've already been through the flow - go to items
      if (cartItems.length > 0) {
        setVerificationCompleted(true)
        setStep('items')
        setHasInitialized(true)
        return
      }

      // If verification step was already completed/skipped but no items, redirect to browse
      if (customerDetails.verification_step_completed) {
        setVerificationCompleted(true)
        router.push('/explore')
        setHasInitialized(true)
        return
      }

      // If verified but no items, redirect to catalogue
      if (customerDetails.is_whatsapp_verified) {
        setVerificationCompleted(true)
        router.push('/explore')
        setHasInitialized(true)
        return
      }

      // New customer with no items - show verification
      setStep('verification')
      setHasInitialized(true)
    } else if (!hasInitialized) {
      setHasInitialized(true)
    }
  }, [customerDetails, submitting, hasInitialized, cartItems.length, router])

  // Watch for cart changes - if verification has been completed/skipped and items are added, go to items step
  useEffect(() => {
    if (hasInitialized && verificationCompleted && cartItems.length > 0 && step !== 'items') {
      setStep('items')
    }
  }, [cartItems.length, verificationCompleted, step, hasInitialized])

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

  const handleVerified = () => {
    // Code verification handled - mark as completed so we don't return to this step
    setVerificationCompleted(true)
    // Update customer details to persist this
    if (customerData) {
      setCustomerDetails({
        ...customerData,
        verification_step_completed: true
      })
    }
    // If no items in cart, redirect to catalogue to browse
    if (cartItems.length === 0) {
      router.push('/explore')
    } else {
      setStep('items')
    }
  }

  const handleSkipVerification = () => {
    // Mark verification as completed (skipped) so we don't return to this step
    setVerificationCompleted(true)
    // Update customer details to persist this
    if (customerData) {
      setCustomerDetails({
        ...customerData,
        verification_step_completed: true
      })
    }
    // If no items in cart, redirect to catalogue to browse
    if (cartItems.length === 0) {
      router.push('/explore')
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

      // 6. Auto-send invoice if WhatsApp is verified
      if (customer.is_whatsapp_verified) {
        try {
          console.log('Auto-sending invoice to verified WhatsApp...')
          const invoiceResponse = await fetch(`/api/orders/${order.id}/send-invoice`, {
            method: 'POST'
          })

          if (invoiceResponse.ok) {
            console.log('Invoice sent successfully')
          } else {
            console.error('Failed to send invoice automatically')
          }
        } catch (invoiceError) {
          console.error('Error sending invoice:', invoiceError)
          // Don't fail the order if invoice sending fails
        }
      }

      // 7. Clear cart and customer details
      clearCart()

      // 8. Redirect to success page
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
          <h1 className="text-4xl md:text-5xl font-light text-center mb-4 tracking-[2px]">
            Place Your Order
          </h1>

          {/* Customer Info */}
          {customerData && (
            <div className="text-center mb-8">
              <p className="text-lg text-brand-quaternary inline-flex items-center gap-3 flex-wrap justify-center">
                <span>
                  Order for: <span className="font-semibold text-brand-primary">{customerData.name}</span>
                  {customerData.company_name && (
                    <span className="text-brand-quaternary"> • {customerData.company_name}</span>
                  )}
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('vsft_cart')
                    localStorage.removeItem('vsft_customer')
                    window.location.href = '/order'
                  }}
                  className="text-sm text-brand-quaternary hover:text-brand-primary underline transition-colors"
                >
                  Not you?
                </button>
              </p>
            </div>
          )}

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
            <GroupedOrderItemsForm
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
