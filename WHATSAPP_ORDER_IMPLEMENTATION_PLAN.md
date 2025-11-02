# WhatsApp Order System Implementation Plan

## Goal
Build a robust order system with WhatsApp authentication that maintains state when users navigate between catalogue and order pages.

## Current State Analysis

### Existing System
- ✅ Order page with 2-step flow (customer details → order items)
- ✅ Database schema: customers, orders, order_items tables
- ✅ CustomerDetailsForm and OrderItemsForm components
- ✅ Basic order creation flow
- ❌ No authentication
- ❌ No state persistence between pages
- ❌ No cart functionality
- ❌ No WhatsApp integration

### Database Tables
- `customers` - stores customer info (phone_number, name, etc.)
- `orders` - stores orders (customer_id, status, total_amount)
- `order_items` - stores order line items (order_id, design_number, quantity, color)
- `catalogue_items` - products available for order

## Implementation Plan

### Phase 1: WhatsApp Authentication (Priority: High)
**Goal**: Implement phone number authentication via WhatsApp OTP

#### 1.1 Enable Supabase Phone Auth
- [ ] Enable phone authentication in Supabase dashboard
- [ ] Configure WhatsApp as SMS provider (Twilio or other)
- [ ] Set up rate limiting and security rules
- [ ] Test OTP delivery to WhatsApp

#### 1.2 Create Auth Components
- [ ] Create `/src/components/auth/PhoneAuthModal.tsx`
  - Phone number input with country code
  - OTP verification input
  - Error handling and loading states
- [ ] Create `/src/lib/auth.ts` - auth utilities
  - signInWithPhone(phoneNumber)
  - verifyOTP(phoneNumber, otp)
  - signOut()
  - getCurrentUser()

#### 1.3 Auth State Management
- [ ] Create auth context provider `/src/contexts/AuthContext.tsx`
  - Track user session
  - Handle auth state changes
  - Provide auth methods to components
- [ ] Protect order routes (redirect if not authenticated)
- [ ] Add "Sign In" button to navbar

#### 1.4 Link Auth with Customer Records
- [ ] Update customer creation to use auth.user.id
- [ ] Add user_id column to customers table
- [ ] Create customer profile on first auth
- [ ] Auto-populate customer details from profile

**Files to Create:**
- `src/components/auth/PhoneAuthModal.tsx`
- `src/contexts/AuthContext.tsx`
- `src/lib/auth.ts`
- `database/add_user_id_to_customers.sql`

---

### Phase 2: Cart/Order State Management (Priority: High)
**Goal**: Persist order state across page navigation using localStorage and database

#### 2.1 Create Cart Context
- [ ] Create `/src/contexts/CartContext.tsx`
  - addItem(item, quantity, size, color)
  - removeItem(itemId)
  - updateQuantity(itemId, quantity)
  - clearCart()
  - saveToDatabase() - for authenticated users
  - loadFromDatabase() - on auth

#### 2.2 Cart Storage Strategy
**For Unauthenticated Users:**
- [ ] Store cart in localStorage
- [ ] Sync with session storage for better persistence
- [ ] Migrate cart to database on login

**For Authenticated Users:**
- [ ] Create `cart_items` table or use draft orders
- [ ] Auto-save cart changes to database
- [ ] Load cart from database on login
- [ ] Merge localStorage cart with database cart

#### 2.3 Draft Orders Table (Recommended Approach)
- [ ] Add 'draft' status to orders.status enum (already exists!)
- [ ] Create draft order on first item add (if authenticated)
- [ ] Update draft order as items change
- [ ] Convert draft → submitted on checkout
- [ ] Clean up old draft orders (>7 days)

**Files to Create:**
- `src/contexts/CartContext.tsx`
- `src/hooks/useCart.ts`
- `database/cart_cleanup_function.sql`

---

### Phase 3: Enhanced Catalogue Integration (Priority: Medium)
**Goal**: Allow adding items to cart directly from catalogue page

#### 3.1 Add to Cart from Catalogue
- [ ] Add "Add to Cart" button to catalogue cards
- [ ] Add quick-add modal with:
  - Size selector (from stock data)
  - Color selector (from stock data)
  - Quantity input
  - Stock availability check
- [ ] Show cart badge in navbar with item count
- [ ] Add toast notifications for cart actions

#### 3.2 Size & Color Selection
- [ ] Integrate with existing stock data
- [ ] Show only available sizes/colors
- [ ] Validate stock availability before adding
- [ ] Display "Out of Stock" for unavailable options

**Files to Update:**
- `src/components/CatalogueGrid.tsx` - add "Add to Cart" button
- `src/components/Navbar.tsx` - add cart badge
- Create `src/components/cart/QuickAddModal.tsx`

---

### Phase 4: Improved Order Flow (Priority: Medium)
**Goal**: Streamline checkout process with pre-filled data

#### 4.1 Checkout Page Redesign
- [ ] Show cart summary before checkout
- [ ] Pre-fill customer details from auth profile
- [ ] Allow editing customer details
- [ ] Add size/color display in order items
- [ ] Show stock availability warnings
- [ ] Add order notes field

#### 4.2 Order Review & Confirmation
- [ ] Create order review step before submission
- [ ] Show total with itemized breakdown
- [ ] Allow editing items before submit
- [ ] Add "Continue Shopping" option
- [ ] Email/WhatsApp order confirmation

**Files to Update:**
- `src/app/order/page.tsx` - redesign flow
- `src/components/OrderSummary.tsx` - new component
- `src/components/OrderReview.tsx` - new component

---

### Phase 5: Order Management (Priority: Low)
**Goal**: Allow users to view and manage their orders

#### 5.1 Order History
- [ ] Create `/src/app/orders/page.tsx`
  - List all user orders
  - Filter by status
  - Search by order number
- [ ] Create order detail page `/src/app/orders/[orderId]/page.tsx`
  - Show full order details
  - Track order status
  - Reorder functionality

#### 5.2 Order Status Updates
- [ ] Add status update notifications (WhatsApp/Email)
- [ ] Allow cancellation of pending orders
- [ ] Show estimated delivery date

**Files to Create:**
- `src/app/orders/page.tsx`
- `src/app/orders/[orderId]/page.tsx`

---

## Database Schema Changes

### New/Modified Tables

#### 1. customers (modify)
```sql
ALTER TABLE customers
ADD COLUMN user_id uuid REFERENCES auth.users(id),
ADD COLUMN is_whatsapp_verified boolean DEFAULT false;
```

#### 2. orders (already has 'draft' status - no changes needed)
Current status enum: 'draft' | 'submitted' | 'processing' | 'completed' | 'cancelled'

#### 3. order_items (add size/color)
```sql
ALTER TABLE order_items
ADD COLUMN size text,
ADD COLUMN color text;
```

---

## Technical Architecture

### State Management Flow
```
User adds item to cart
  ↓
CartContext.addItem()
  ↓
If authenticated:
  - Save to database (draft order)
  - Update localStorage (backup)
Else:
  - Save to localStorage only
  ↓
Navigate to catalogue/order
  ↓
Cart state persists via:
  - Context (in-memory)
  - Database (if auth)
  - localStorage (fallback)
```

### Authentication Flow
```
User clicks "Sign In"
  ↓
Enter phone number
  ↓
Send OTP via WhatsApp
  ↓
Enter OTP
  ↓
Verify & create session
  ↓
Create/load customer profile
  ↓
Migrate localStorage cart to database
  ↓
Redirect to previous page
```

---

## Implementation Order (Recommended)

### Sprint 1: Foundation (Week 1)
1. ✅ Set up WhatsApp auth in Supabase
2. ✅ Create AuthContext and PhoneAuthModal
3. ✅ Add user_id to customers table
4. ✅ Test auth flow end-to-end

### Sprint 2: Cart System (Week 2)
5. ✅ Create CartContext with localStorage
6. ✅ Add draft orders support
7. ✅ Implement cart persistence
8. ✅ Add cart badge to navbar

### Sprint 3: Catalogue Integration (Week 3)
9. ✅ Add "Add to Cart" to catalogue
10. ✅ Create QuickAddModal with size/color
11. ✅ Stock availability checks
12. ✅ Cart notifications

### Sprint 4: Checkout Flow (Week 4)
13. ✅ Redesign order page with cart summary
14. ✅ Pre-fill customer details
15. ✅ Add order review step
16. ✅ Order confirmation

### Sprint 5: Order Management (Week 5)
17. ✅ Order history page
18. ✅ Order status tracking
19. ✅ Reorder functionality

---

## Key Decisions Needed

1. **WhatsApp Provider**: Which SMS/WhatsApp provider to use?
   - Twilio (most common)
   - MessageBird
   - Direct WhatsApp Business API

2. **Cart Storage**: Draft orders vs separate cart table?
   - **Recommended**: Use draft orders (simpler, already have status)
   - Alternative: Create separate cart_items table

3. **Auth Strategy**: Required or optional?
   - **Recommended**: Required for checkout (better UX, fraud prevention)
   - Alternative: Allow guest checkout, optional auth

4. **State Sync**: Real-time or manual?
   - **Recommended**: Auto-save on changes (debounced)
   - Alternative: Save on page navigation

---

## Success Metrics

- [ ] User can add items to cart from catalogue
- [ ] Cart persists when navigating between pages
- [ ] User can authenticate via WhatsApp
- [ ] Cart syncs between localStorage and database
- [ ] Authenticated users see pre-filled customer details
- [ ] Orders maintain size/color information
- [ ] Users can view order history
- [ ] Zero data loss on page refresh/navigation

---

## Next Steps

**Immediate Actions:**
1. Review this plan and approve approach
2. Decide on WhatsApp provider
3. Set up Supabase phone auth
4. Begin Phase 1: WhatsApp Authentication

**Questions to Answer:**
- Do you have a Twilio account or preferred SMS provider?
- Should checkout require authentication or allow guest orders?
- Any specific WhatsApp message format requirements?
