-- Create PostgreSQL functions to efficiently get unique filter values
-- These functions return distinct values without hitting row limits

-- Function to get unique sizes
create or replace function get_unique_sizes()
returns table (size text) as $$
  select distinct stock_items.size
  from stock_items
  where stock_items.size is not null
  order by stock_items.size;
$$ language sql stable;

-- Function to get unique colors
create or replace function get_unique_colors()
returns table (color text) as $$
  select distinct stock_items.color
  from stock_items
  where stock_items.color is not null
  order by stock_items.color;
$$ language sql stable;

-- Function to get unique categories
create or replace function get_unique_categories()
returns table (category text) as $$
  select distinct stock_items.category
  from stock_items
  where stock_items.category is not null
  order by stock_items.category;
$$ language sql stable;

-- Grant execute permissions to anon and authenticated users
grant execute on function get_unique_sizes() to anon, authenticated;
grant execute on function get_unique_colors() to anon, authenticated;
grant execute on function get_unique_categories() to anon, authenticated;

-- Test the functions
-- select * from get_unique_sizes();
-- select * from get_unique_colors();
-- select * from get_unique_categories();
