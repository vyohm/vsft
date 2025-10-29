// Database types matching Supabase schema

export interface CatalogueItem {
  id: number
  design_number: string
  price: number
  is_active: boolean
  created_at?: string
  updated_at?: string
  // Optional fields that may be added later
  name?: string
  description?: string
  image_url?: string
  category?: string
}

export interface Customer {
  id: string
  name: string
  company_name?: string
  gst_number?: string
  phone_number: string
  phone_verified: boolean
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  customer_id: string
  order_number: string
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'cancelled'
  total_amount: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  catalogue_item_id: number
  design_number: string
  unit_price: number
  quantity: number
  color_option: 'color1' | 'color2' | 'color3' | 'all'
  line_total?: number
  created_at?: string
}

export interface OrderWithDetails extends Order {
  customer?: Customer
  order_items?: (OrderItem & { catalogue_item?: CatalogueItem })[]
}

// Form types
export interface CustomerFormData {
  name: string
  company_name?: string
  gst_number?: string
  phone_number: string
}

export interface OrderItemFormData {
  design_number: string
  quantity: number
  color_option: 'color1' | 'color2' | 'color3' | 'all'
}

// Stock Item type
export interface StockItem {
  id: number
  design_number: string
  catalogue_item_id?: number
  size?: string
  color?: string
  category?: string
  quantity: number
  price?: number
  created_at?: string
  updated_at?: string
}

// Stock Item with Catalogue details
export interface StockItemWithCatalogue extends StockItem {
  catalogue_item?: CatalogueItem
}

// Legacy Product type for compatibility
export interface Product extends CatalogueItem {}
