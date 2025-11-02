'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/contexts/CartContext'

export default function NewOrderPage() {
  const { clearAll } = useCart()
  const hasCleared = useRef(false)

  useEffect(() => {
    // Only run once to prevent infinite loop
    if (hasCleared.current) return
    hasCleared.current = true

    // Clear localStorage directly to ensure it persists across hard navigation
    localStorage.removeItem('vsft_cart')
    localStorage.removeItem('vsft_customer')

    // Also clear the context state
    clearAll()

    // Small delay then hard navigate to ensure fresh state
    setTimeout(() => {
      window.location.href = '/order'
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
