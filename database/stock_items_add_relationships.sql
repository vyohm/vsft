-- Add relationship between stock_items and catalogue_items
-- This allows linking stock inventory to catalogue designs

-- Step 1: Add catalogue_item_id column if it doesn't exist
alter table stock_items
  add column if not exists catalogue_item_id bigint;

-- Step 2: Create index for better query performance
create index if not exists idx_stock_items_catalogue_item_id
  on stock_items(catalogue_item_id);

-- Step 3: Add foreign key constraint to link with catalogue_items
-- This ensures referential integrity between stock_items and catalogue_items
alter table stock_items
  add constraint fk_stock_items_catalogue_item
  foreign key (catalogue_item_id)
  references catalogue_items(id)
  on delete set null;

-- Optional: Update existing stock_items to link with catalogue_items by design_number
-- Uncomment the following if you want to auto-populate catalogue_item_id based on matching design_numbers
/*
update stock_items si
set catalogue_item_id = ci.id
from catalogue_items ci
where si.design_number = ci.design_number
  and si.catalogue_item_id is null;
*/

-- Step 4: Create a view that joins stock_items with catalogue_items for easier querying
create or replace view stock_items_with_catalogue as
select
  si.*,
  ci.name as catalogue_name,
  ci.description as catalogue_description,
  ci.image_url as catalogue_image_url,
  ci.is_active as catalogue_is_active,
  coalesce(si.price, ci.price) as effective_price
from stock_items si
left join catalogue_items ci on si.catalogue_item_id = ci.id;

-- Grant select permissions on the view
grant select on stock_items_with_catalogue to anon, authenticated;
