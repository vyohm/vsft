'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export default function NewOrderPage() {
  const router = useRouter()
  const { clearAll } = useCart()

  useEffect(() => {
    // Clear all cart and customer data
    clearAll()

    // Redirect to order page to start fresh
    router.push('/order')
  }, [clearAll, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p className="text-brand-quaternary">Starting new order...</p>
      </div>
    </div>
  )
}
