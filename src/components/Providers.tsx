'use client'

import { ReactNode } from 'react'
import { CartProvider } from '@/contexts/CartContext'
import ClarityProvider from './ClarityProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ClarityProvider />
      {children}
    </CartProvider>
  )
}
