# Migration Guide: Multiple Photos Per Color Variant

This guide explains the new photo management system for catalogue items with multiple color variations.

## Overview

The new system replaces the single `photoshoot_url` column with a dedicated `catalogue_item_photos` table that supports multiple photos per catalogue item, organized by color variant.

## Changes Made

### 1. New Database Table: `catalogue_item_photos`

**Structure:**
- `id` - Primary key
- `catalogue_item_id` - Foreign key to `catalogue_items`
- `color_variant` - Color option: 'color1', 'color2', or 'color3'
- `photo_url` - URL to the photo
- `display_order` - Order for displaying multiple photos
- `created_at`, `updated_at` - Timestamps

**Features:**
- One-to-many relationship with catalogue items
- Cascade delete (photos are deleted when catalogue item is deleted)
- RLS enabled with public read access
- Indexed for optimal query performance
- View `catalogue_items_with_photos` for easy joined queries

### 2. Removed from `catalogue_items` Table

- ✅ Dropped `photoshoot_url` column
- ✅ Dropped `idx_catalogue_items_photoshoot_url` index

### 3. TypeScript Types Updated

**New types in `src/lib/types.ts`:**
```typescript
export interface CatalogueItemPhoto {
  id: number
  catalogue_item_id: number
  color_variant: 'color1' | 'color2' | 'color3'
  photo_url: string
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface CatalogueItemWithPhotos extends CatalogueItem {
  photos?: CatalogueItemPhoto[]
}
```

**Removed:**
- `photoshoot_url?: string` from `CatalogueItem` interface

### 4. Component Updates

**CatalogueGrid.tsx:**
- Fetches photos alongside catalogue items
- Merges photos with items in memory
- Displays primary photo (color1 preferred, or first available)
- Shows badge with photo count when multiple colors exist
- Fallback to `image_url` if no photos available

## Migration Steps

### Step 1: Run the Creation Script

In Supabase SQL Editor, run:
```sql
-- File: database/create_catalogue_item_photos.sql
```

This will:
- Create the `catalogue_item_photos` table
- Set up indexes and RLS policies
- Create the `catalogue_items_with_photos` view

### Step 2: Migrate Existing Data (Optional)

If you have existing `photoshoot_url` data you want to preserve, uncomment and run the migration section in:
```sql
-- File: database/catalogue_items_remove_photoshoot_url.sql
```

This will copy existing photoshoot URLs to the new table as 'color1' variants.

### Step 3: Remove Old Column

After migrating data (or if you have no data to preserve), run:
```sql
-- File: database/catalogue_items_remove_photoshoot_url.sql
```

This will drop the old `photoshoot_url` column and its index.

## Usage Examples

### Adding Photos for a Catalogue Item

```sql
-- Add photos for design #1234 with multiple colors
insert into catalogue_item_photos (catalogue_item_id, color_variant, photo_url, display_order)
values
  (1234, 'color1', 'https://your-bucket.supabase.co/path/1234-color1.jpg', 0),
  (1234, 'color2', 'https://your-bucket.supabase.co/path/1234-color2.jpg', 0),
  (1234, 'color3', 'https://your-bucket.supabase.co/path/1234-color3.jpg', 0);
```

### Querying Items with Photos

```typescript
// Method 1: Manual join (current implementation)
const { data: items } = await supabase
  .from('catalogue_items')
  .select('*')
  .eq('is_active', true)

const itemIds = items?.map(i => i.id) || []
const { data: photos } = await supabase
  .from('catalogue_item_photos')
  .select('*')
  .in('catalogue_item_id', itemIds)

// Method 2: Using the view (future option)
const { data: items } = await supabase
  .from('catalogue_items_with_photos')
  .select('*')
  .eq('is_active', true)
```

### Frontend Usage

```typescript
// Get primary photo (prioritizes color1)
const primaryPhoto = item.photos?.find(p => p.color_variant === 'color1') || item.photos?.[0]
const photoUrl = primaryPhoto?.photo_url || item.image_url

// Check if item has multiple colors
const hasMultipleColors = (item.photos?.length || 0) > 1
```

## Benefits

1. ✅ **Proper Data Structure**: Photos are properly normalized
2. ✅ **Color-Specific Images**: Each color variant can have its own photoshoot
3. ✅ **Multiple Photos**: Can store multiple photos per color (via `display_order`)
4. ✅ **Flexible Queries**: Easy to filter/fetch by color variant
5. ✅ **Better UX**: Customers can see actual colors before ordering
6. ✅ **Scalable**: Easy to add more color variants in the future

## Next Steps

### For Development:
1. Run the migration scripts in Supabase
2. Deploy the updated code
3. Test with sample data

### For Production:
1. **Backup your database** before running migrations
2. Run migrations during low-traffic period
3. Test thoroughly in staging first
4. Consider building an admin UI for photo management

### Future Enhancements:
- Build admin interface for uploading/managing photos
- Add image carousel for multiple photos per color
- Implement image optimization/CDN
- Add photo gallery on order form to help customers select colors
- Support for video content alongside photos

## Rollback Plan

If you need to rollback:

```sql
-- Re-add the photoshoot_url column
alter table catalogue_items add column photoshoot_url text;

-- Optionally migrate first photo back
update catalogue_items ci
set photoshoot_url = (
  select photo_url
  from catalogue_item_photos
  where catalogue_item_id = ci.id
    and color_variant = 'color1'
  order by display_order
  limit 1
);
```

## Support

For issues or questions, check:
- `database/README.md` for general database guidance
- Supabase documentation for RLS and storage
- Project README for overall setup
