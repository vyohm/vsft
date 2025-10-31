-- Add photoshoot_url column to catalogue_items table
-- This will store the URL to the photoshoot image from storage

alter table catalogue_items
  add column if not exists photoshoot_url text;

-- Create index for better query performance
create index if not exists idx_catalogue_items_photoshoot_url
  on catalogue_items(photoshoot_url);
