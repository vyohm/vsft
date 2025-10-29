-- Row Level Security (RLS) policy for stock_items table
-- Run this in your Supabase SQL Editor to allow public read access

-- Enable RLS on stock_items table (if not already enabled)
alter table stock_items enable row level security;

-- Drop existing policy if it exists
drop policy if exists "Allow public read access to stock_items" on stock_items;

-- Create policy to allow public read access for anonymous and authenticated users
create policy "Allow public read access to stock_items"
  on stock_items
  for select
  to anon, authenticated
  using (true);

-- Optional: If you want to restrict write access to authenticated users only
-- drop policy if exists "Allow authenticated users to insert stock_items" on stock_items;
-- create policy "Allow authenticated users to insert stock_items"
--   on stock_items
--   for insert
--   to authenticated
--   with check (true);

-- drop policy if exists "Allow authenticated users to update stock_items" on stock_items;
-- create policy "Allow authenticated users to update stock_items"
--   on stock_items
--   for update
--   to authenticated
--   using (true)
--   with check (true);

-- drop policy if exists "Allow authenticated users to delete stock_items" on stock_items;
-- create policy "Allow authenticated users to delete stock_items"
--   on stock_items
--   for delete
--   to authenticated
--   using (true);
