-- Add image_url column to order_items table
-- This allows storing the product image for each order item

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS image_url text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_image_url ON order_items(image_url);

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
