'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export default function NewOrderPage() {
  const router = useRouter()
  const { clearAll } = useCart()
  const hasCleared = useRef(false)

  useEffect(() => {
    // Only run once to prevent infinite loop
    if (hasCleared.current) return
    hasCleared.current = true

    // Clear all cart and customer data
    clearAll()

    // Use replace instead of push to avoid back button issues
    // Small delay to ensure clearAll completes
    setTimeout(() => {
      router.replace('/order')
    }, 100)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p className="text-brand-quaternary">Starting new order...</p>
      </div>
    </div>
  )
}
