-- Add invoice tracking fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS invoice_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS invoice_url text;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_invoice_sent ON orders(invoice_sent);

-- Add comments
COMMENT ON COLUMN orders.invoice_sent IS 'Whether invoice has been sent to customer via WhatsApp';
COMMENT ON COLUMN orders.invoice_sent_at IS 'Timestamp when invoice was sent';
COMMENT ON COLUMN orders.invoice_url IS 'URL of the generated invoice PDF';
