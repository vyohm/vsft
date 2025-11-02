-- Fix SF to SFT naming in stock_items table
-- SF series doesn't exist, all SF designs should be SFT

-- Update all design numbers starting with SF (but not SFT) to SFT
UPDATE stock_items
SET design_number = 'SFT' || substring(design_number from 3)
WHERE design_number ~* '^SF[0-9]'
  AND design_number !~* '^SFT';

-- Verify the changes
SELECT
  COUNT(*) as total_sft_items,
  COUNT(DISTINCT design_number) as unique_sft_designs
FROM stock_items
WHERE design_number ~* '^SFT';

-- Show sample of updated records
SELECT design_number, size, color, quantity
FROM stock_items
WHERE design_number ~* '^SFT'
ORDER BY design_number
LIMIT 10;
