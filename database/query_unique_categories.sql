-- Query unique category values from stock_items table

-- Get all unique categories with count
select category, count(*) as item_count
from stock_items
where category is not null
group by category
order by category;

-- Alternative: Just list unique categories
-- select distinct category
-- from stock_items
-- where category is not null
-- order by category;

-- Check for null or empty categories
-- select count(*) as null_category_count
-- from stock_items
-- where category is null or category = '';
