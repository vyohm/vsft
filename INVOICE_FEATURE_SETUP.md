# PDF Invoice & WhatsApp Delivery Feature

## Setup Instructions

### 1. Run Database Migrations

Run these SQL queries in your Supabase SQL Editor:

```sql
-- Add invoice fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS invoice_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS invoice_url text;

CREATE INDEX IF NOT EXISTS idx_orders_invoice_sent ON orders(invoice_sent);
```

### 2. Create Supabase Storage Bucket

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard > Storage
2. Click "New Bucket"
3. Name: `invoices`
4. Public: **Yes** (required for WhatsApp to access PDFs)
5. Click "Create bucket"

**Option B: Via SQL**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoices');
```

## How It Works

### Customer Flow

1. **Place Order** → Customer submits order as usual
2. **Order Confirmation Page** → Shows invoice section
3. **Send Invoice Button**:
   - **If WhatsApp Verified**: Generates PDF → Uploads to storage → Sends via WhatsApp
   - **If Not Verified**: Shows prompt to verify WhatsApp first

### Invoice Contents

The PDF invoice includes:
- **Header**: Company logo and name (Sangeet Fashion Textiles)
- **Order Details**: Order number, date
- **Customer Information**: Name, company, phone, GST number
- **Itemized List**: Design number, size, color, quantity, unit price, line totals
- **Total Amount**: Grand total in ₹
- **Footer**: Thank you message and contact info

### Technical Flow

```
Order Submitted
    ↓
Order Confirmation Page Loads
    ↓
User Clicks "Send Invoice via WhatsApp"
    ↓
Check WhatsApp Verified?
    ├─ No → Show Verification Prompt
    └─ Yes → Continue
        ↓
    POST /api/orders/{orderId}/send-invoice
        ↓
    Generate PDF with pdfkit
        ↓
    Upload to Supabase Storage (invoices bucket)
        ↓
    Get Public URL
        ↓
    Send Document via WhatsApp Business API
        ↓
    Update Order (invoice_sent = true, invoice_url, invoice_sent_at)
        ↓
    Return Success
        ↓
    UI Shows "Invoice sent ✓" + Download Link
```

## Features

### ✅ Professional PDF Invoice
- Branded with company colors (#2C5F2D green, #97BC62 gold)
- Clean table layout with alternating row colors
- Proper formatting with ₹ currency symbols
- Supports pagination for long orders

### ✅ WhatsApp Delivery
- Sends PDF as document attachment
- Includes caption with order summary
- Uses verified WhatsApp number (or fallback to order form number)

### ✅ Verification Check
- Requires WhatsApp verification before sending invoice
- Shows helpful prompt if not verified
- Links directly to verification flow

### ✅ Storage & Access
- PDFs stored in Supabase Storage for persistence
- Public URLs allow WhatsApp to download files
- Downloadable from order confirmation page

## Files Created/Modified

### New Files
- `src/lib/services/invoice.ts` - Invoice PDF generation service
- `src/app/api/orders/[orderId]/send-invoice/route.ts` - API endpoint
- `src/components/InvoiceSection.tsx` - Client component for UI
- `database/add_invoice_fields_to_orders.sql` - Migration
- `database/create_invoices_bucket.sql` - Storage setup

### Modified Files
- `src/lib/services/whatsapp.ts` - Added `sendDocument()` method
- `src/app/order/[orderId]/page.tsx` - Added invoice section
- `package.json` - Added pdfkit and @types/pdfkit

## Testing

1. **Create an order** with verified WhatsApp number
2. **Go to order confirmation page** (/order/{orderId})
3. **Click "Send Invoice via WhatsApp"**
4. **Check WhatsApp** - You should receive a PDF document
5. **Verify PDF** - Download and check formatting

## Environment Variables

No new environment variables needed! Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `VSFT_SERVICE_ROLE_KEY`
- `WHATSAPP_TOKEN`
- `PHONE_NUMBER_ID`

## Troubleshooting

### Invoice not sending?
- Check Supabase Storage bucket exists and is public
- Verify WhatsApp token is valid
- Check API logs for errors

### PDF formatting issues?
- pdfkit may need fonts - default Helvetica works
- Check image URLs are accessible
- Verify data is complete in database

### WhatsApp not receiving document?
- Ensure public URL is accessible (test in browser)
- Check WhatsApp Business API quota
- Verify phone number format is correct

## Future Enhancements

- [ ] Email invoice option for customers without WhatsApp
- [ ] Custom branding/logo upload
- [ ] Multiple invoice templates
- [ ] Automatic invoice sending on order submission (if verified)
- [ ] Invoice history view for customers
- [ ] Resend invoice button
