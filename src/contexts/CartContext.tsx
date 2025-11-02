'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem } from '@/lib/types'

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (designNumber: string, size?: string, color?: string) => void
  updateQuantity: (designNumber: string, quantity: number, size?: string, color?: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'vsft_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setItems(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        setItems([])
      }
    }
    setIsInitialized(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isInitialized])

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prevItems => {
      // Check if item with same design_number, size, and color already exists
      const existingIndex = prevItems.findIndex(
        i =>
          i.design_number === item.design_number &&
          i.size === item.size &&
          i.color === item.color
      )

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...prevItems]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (item.quantity || 1)
        }
        return newItems
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            ...item,
            quantity: item.quantity || 1
          }
        ]
      }
    })
  }

  const removeItem = (designNumber: string, size?: string, color?: string) => {
    setItems(prevItems =>
      prevItems.filter(
        item =>
          !(
            item.design_number === designNumber &&
            item.size === size &&
            item.color === color
          )
      )
    )
  }

  const updateQuantity = (
    designNumber: string,
    quantity: number,
    size?: string,
    color?: string
  ) => {
    if (quantity <= 0) {
      removeItem(designNumber, size, color)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.design_number === designNumber &&
        item.size === size &&
        item.color === color
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.unit_price * item.quantity, 0)
  }

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
