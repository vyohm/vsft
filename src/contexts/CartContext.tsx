'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem } from '@/lib/types'

export interface CustomerDetails {
  name: string
  phone_number: string
  company_name?: string
  gst_number?: string
  is_whatsapp_verified?: boolean
}

interface CartContextType {
  items: CartItem[]
  customerDetails: CustomerDetails | null
  needsCustomerDetails: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (designNumber: string, size?: string, color?: string) => void
  updateQuantity: (designNumber: string, quantity: number, size?: string, color?: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  setCustomerDetails: (details: CustomerDetails) => void
  clearCustomerDetails: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'vsft_cart'
const CUSTOMER_STORAGE_KEY = 'vsft_customer'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [customerDetails, setCustomerDetailsState] = useState<CustomerDetails | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart and customer details from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart)
        setItems(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        setItems([])
      }
    }

    const storedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    if (storedCustomer) {
      try {
        setCustomerDetailsState(JSON.parse(storedCustomer))
      } catch (error) {
        console.error('Error loading customer details from localStorage:', error)
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

  // Save customer details to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      if (customerDetails) {
        localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customerDetails))
      } else {
        localStorage.removeItem(CUSTOMER_STORAGE_KEY)
      }
    }
  }, [customerDetails, isInitialized])

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

  const setCustomerDetails = (details: CustomerDetails) => {
    setCustomerDetailsState(details)
  }

  const clearCustomerDetails = () => {
    setCustomerDetailsState(null)
  }

  const needsCustomerDetails = items.length > 0 && !customerDetails

  const value: CartContextType = {
    items,
    customerDetails,
    needsCustomerDetails,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    setCustomerDetails,
    clearCustomerDetails
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
