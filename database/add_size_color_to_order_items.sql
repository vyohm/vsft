-- Add size and color columns to order_items table
-- This allows tracking specific size/color selections per order item

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS color text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_size ON order_items(size);
CREATE INDEX IF NOT EXISTS idx_order_items_color ON order_items(color);

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
