-- Add WhatsApp verification fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS is_whatsapp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_code text;

-- Add WhatsApp verification field to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_whatsapp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_verified_at timestamptz;

-- Add indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_customers_verification_code ON customers(verification_code);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_verified ON customers(is_whatsapp_verified);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_verified ON orders(is_whatsapp_verified);

-- Add comments
COMMENT ON COLUMN customers.is_whatsapp_verified IS 'Whether customer has verified their WhatsApp number';
COMMENT ON COLUMN customers.whatsapp_verified_at IS 'Timestamp when WhatsApp was verified';
COMMENT ON COLUMN customers.verification_code IS 'Temporary code for WhatsApp verification';
COMMENT ON COLUMN orders.is_whatsapp_verified IS 'Whether this specific order was WhatsApp verified';
COMMENT ON COLUMN orders.whatsapp_verified_at IS 'Timestamp when this order was verified via WhatsApp';
