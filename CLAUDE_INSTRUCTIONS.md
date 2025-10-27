# Development Guidelines for VSFT Project

## Project Overview
E-commerce platform for fabric/design catalogue with order management.
Mobile-first design using Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Coding Standards

### Naming Conventions
- **Files**: kebab-case (catalogue-grid.tsx, order-form.tsx)
- **Components**: PascalCase (CatalogueGrid, OrderForm)
- **Variables/Functions**: camelCase (catalogueItems, fetchOrders)
- **Constants**: UPPER_SNAKE_CASE (API_ENDPOINTS, COLOR_OPTIONS)
- **Database**: snake_case (catalogue_items, order_items)

### Component Structure
```typescript
// Always use this structure for components
import { useState, useEffect } from 'react'
import type { ComponentProps } from '@/lib/types'

interface ComponentNameProps {
  // Define props here
}

export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // Hooks first
  const [state, setState] = useState()
  
  // Effects second
  useEffect(() => {
    // effect logic
  }, [])
  
  // Event handlers third
  const handleEvent = () => {
    // handler logic
  }
  
  // Render last
  return (
    <div className="mobile-first-classes">
      {/* Mobile-first: design for phone screens first */}
    </div>
  )
}
```

### Database Operations
- Always use TypeScript types for database operations
- Use server actions for mutations
- Handle loading and error states
- Implement optimistic updates where appropriate

### Mobile-First Design
- Start with mobile styles, use `sm:`, `md:`, `lg:` for larger screens
- Touch targets minimum 44px
- Readable text sizes (minimum 16px)
- Adequate spacing for finger navigation

### Key Variables to Maintain
- `catalogueItems` - for product data
- `orderItems` - for order line items
- `customerDetails` - for customer form data
- `isLoading`, `isError` - for async states
- `COLOR_OPTIONS` - ['color1', 'color2', 'color3', 'all']

### API Patterns
- Use Next.js App Router API routes
- Follow RESTful conventions:
  - GET /api/catalogue?page=1&limit=10
  - POST /api/orders
  - PUT /api/orders/[id]
  - DELETE /api/orders/[id]

### Error Handling
- Always wrap async operations in try-catch
- Show user-friendly error messages
- Log errors for debugging
- Graceful fallbacks for missing data