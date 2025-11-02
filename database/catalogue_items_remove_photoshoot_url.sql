-- Remove photoshoot_url column from catalogue_items table
-- This column is being replaced by the catalogue_item_photos table

-- Optional: Migrate existing photoshoot_url data to catalogue_item_photos
-- Uncomment this section if you have existing data you want to preserve
/*
insert into catalogue_item_photos (catalogue_item_id, color_variant, photo_url, display_order)
select
  id,
  'color1' as color_variant,
  photoshoot_url,
  0 as display_order
from catalogue_items
where photoshoot_url is not null
  and photoshoot_url != ''
  and not exists (
    select 1 from catalogue_item_photos cip
    where cip.catalogue_item_id = catalogue_items.id
      and cip.photo_url = catalogue_items.photoshoot_url
  );
*/

-- Drop the view that depends on photoshoot_url column
drop view if exists catalogue_items_with_photos;

-- Drop the index first
drop index if exists idx_catalogue_items_photoshoot_url;

-- Drop the column
alter table catalogue_items
  drop column if exists photoshoot_url;

-- Recreate the view without the photoshoot_url column
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
