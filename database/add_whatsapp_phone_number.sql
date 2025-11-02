-- Add whatsapp_phone_number field to customers table
-- This stores the actual WhatsApp number used for verification
-- which may differ from the phone_number provided on the order form
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS whatsapp_phone_number text;

-- Add index for quick lookup by WhatsApp number
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_phone ON customers(whatsapp_phone_number);

-- Add comment
COMMENT ON COLUMN customers.whatsapp_phone_number IS 'The verified WhatsApp phone number (may differ from order form phone number)';
