-- Add color_name column to catalogue_item_photos table
-- This will store the human-readable color name (e.g., "T.BLUE", "MOVE", "RANI")

alter table catalogue_item_photos
  add column if not exists color_name text;

-- Create index for better query performance
create index if not exists idx_catalogue_item_photos_color_name
  on catalogue_item_photos(color_name);

-- Add comment for documentation
comment on column catalogue_item_photos.color_name is 'Human-readable color name (e.g., T.BLUE, MOVE, RANI)';
