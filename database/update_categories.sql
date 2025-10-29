-- Streamline and standardize category values in stock_items table
-- Current categories will be mapped to: Suits, Indowesterns, Unstitched, Goods

-- Update categories to standardized values
update stock_items
set category = case
  when category = '6211 SUIT' then 'Suits'
  when category = 'FINISHED INDO-WESTERN' then 'Indowesterns'
  when category = 'FINISHED UNSTITCH' then 'Unstitched'
  when category = 'FINISHED GOODS' then 'Goods'
  else category
end;

-- Verify the changes
select category, count(*) as item_count
from stock_items
where category is not null
group by category
order by category;
