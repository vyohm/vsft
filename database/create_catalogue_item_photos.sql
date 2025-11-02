-- Create catalogue_item_photos table
-- This table stores multiple photoshoot images for each catalogue item, organized by color variation

create table if not exists catalogue_item_photos (
  id bigserial primary key,
  catalogue_item_id bigint not null references catalogue_items(id) on delete cascade,
  color_variant text not null check (color_variant in ('color1', 'color2', 'color3')),
  photo_url text not null,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_catalogue_item_photos_catalogue_item_id
  on catalogue_item_photos(catalogue_item_id);

create index if not exists idx_catalogue_item_photos_color_variant
  on catalogue_item_photos(catalogue_item_id, color_variant);

-- Add unique constraint to ensure no duplicate photo URLs per color variant
create unique index if not exists idx_catalogue_item_photos_unique_photo
  on catalogue_item_photos(catalogue_item_id, color_variant, photo_url);

-- Enable Row Level Security
alter table catalogue_item_photos enable row level security;

-- Create policy to allow public read access
create policy "Allow public read access to catalogue item photos"
  on catalogue_item_photos
  for select
  using (true);

-- Optional: Create policy for authenticated write access (uncomment if needed)
/*
create policy "Allow authenticated users to insert photos"
  on catalogue_item_photos
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update photos"
  on catalogue_item_photos
  for update
  to authenticated
  using (true);

create policy "Allow authenticated users to delete photos"
  on catalogue_item_photos
  for delete
  to authenticated
  using (true);
*/

-- Create a view that joins catalogue items with their photos
create or replace view catalogue_items_with_photos as
select
  ci.*,
  coalesce(
    json_agg(
      json_build_object(
        'id', cip.id,
        'color_variant', cip.color_variant,
        'photo_url', cip.photo_url,
        'display_order', cip.display_order
      )
      order by cip.color_variant, cip.display_order
    ) filter (where cip.id is not null),
    '[]'::json
  ) as photos
from catalogue_items ci
left join catalogue_item_photos cip on ci.id = cip.catalogue_item_id
group by ci.id;

-- Add comment for documentation
comment on table catalogue_item_photos is 'Stores photoshoot images for catalogue items, organized by color variations';
comment on column catalogue_item_photos.color_variant is 'Color variant: color1, color2, or color3';
comment on column catalogue_item_photos.display_order is 'Order in which photos should be displayed (lower numbers first)';
