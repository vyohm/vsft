-- Add category column to catalogue_items table if it doesn't exist
-- This allows categorizing designs (e.g., Indowestern, Unstitch, 6211 Suit, etc.)

alter table catalogue_items
  add column if not exists category text;

-- Create index for better query performance on category filtering
create index if not exists idx_catalogue_items_category
  on catalogue_items(category);

-- Optional: Update existing catalogue items with categories based on design_number patterns
-- Uncomment and modify as needed based on your design number naming conventions
/*
-- Example: Set category based on design number prefix
update catalogue_items
set category = case
  when design_number like 'IW%' then 'Indowestern'
  when design_number like 'UN%' then 'Unstitch'
  when design_number like '6211%' then '6211 Suit'
  when design_number like 'KU%' then 'Kurta'
  when design_number like 'SH%' then 'Sherwani'
  else 'Uncategorized'
end
where category is null;
*/
