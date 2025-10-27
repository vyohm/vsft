// Database types - adjust based on your Supabase schema

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  category?: string
  created_at?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  created_at?: string
}

export interface Order {
  id: string
  customer_id: string
  product_id: string
  quantity: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  created_at?: string
}

export interface OrderWithDetails extends Order {
  customer?: Customer
  product?: Product
}
