# Database Setup and Migrations

This folder contains SQL scripts for setting up and updating the database schema.

## Files Overview

### 1. `stock_items_rls_policy.sql`
**Purpose**: Enable Row Level Security (RLS) policies for the `stock_items` table.

**When to run**: Run this first if you're getting empty results or access denied errors when viewing the stock page.

**What it does**:
- Enables RLS on `stock_items` table
- Creates a policy to allow public read access (for both anonymous and authenticated users)
- Optional policies for write access (commented out by default)

### 2. `stock_items_add_relationships.sql`
**Purpose**: Link `stock_items` table with `catalogue_items` table.

**When to run**: Run this to establish the relationship between stock inventory and catalogue designs.

**What it does**:
- Adds `catalogue_item_id` column to `stock_items`
- Creates foreign key constraint linking to `catalogue_items`
- Creates indexes for better query performance
- Creates a view `stock_items_with_catalogue` that joins both tables
- Includes optional SQL to auto-populate `catalogue_item_id` based on matching `design_number`

**Benefits**:
- Maintains referential integrity between stock and catalogue
- Allows querying stock with catalogue details (name, description, image)
- Prevents orphaned stock items if catalogue items are deleted (uses `on delete set null`)

### 3. `catalogue_items_add_category.sql`
**Purpose**: Add category support to the `catalogue_items` table.

**When to run**: Run this if you want to categorize your catalogue items (e.g., Indowestern, Unstitch, 6211 Suit).

**What it does**:
- Adds `category` column to `catalogue_items`
- Creates index for better category filtering performance
- Includes optional SQL to bulk-update categories based on design number patterns

## Running the Scripts

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of the SQL file
4. Click **Run** or press `Cmd/Ctrl + Enter`

### Recommended Order:
1. `stock_items_rls_policy.sql` - First, to enable access
2. `catalogue_items_add_category.sql` - Second, to add category support to catalogue
3. `stock_items_add_relationships.sql` - Third, to link stock with catalogue

## Data Integrity Notes

### Category Data Issue
If you're seeing limited categories in the dropdown (e.g., only "6211 suit"), this means:
- Your `stock_items` table only has entries with that category value
- You need to update the category values in your existing stock items

**To fix this**, run an UPDATE query in Supabase SQL Editor:
```sql
-- Check current category values
select distinct category from stock_items;

-- Update categories as needed
update stock_items
set category = 'Indowestern'
where design_number like 'IW%';

update stock_items
set category = 'Unstitch'
where design_number like 'UN%';

-- Add more update statements based on your data
```

### Linking Stock to Catalogue
After running `stock_items_add_relationships.sql`, you should link existing stock items to catalogue items:

```sql
-- Auto-link stock items to catalogue items by design_number
update stock_items si
set catalogue_item_id = ci.id
from catalogue_items ci
where si.design_number = ci.design_number
  and si.catalogue_item_id is null;

-- Verify the linking
select
  si.id,
  si.design_number,
  si.catalogue_item_id,
  ci.design_number as catalogue_design_number
from stock_items si
left join catalogue_items ci on si.catalogue_item_id = ci.id
limit 10;
```

## Schema Reference

### stock_items Table Structure
```sql
stock_items (
  id                  bigserial primary key,
  design_number       text not null,
  catalogue_item_id   bigint references catalogue_items(id),
  size                text,
  color               text,
  category            text,
  quantity            integer not null default 0,
  price               numeric,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
)
```

### catalogue_items Table Structure
```sql
catalogue_items (
  id              bigint primary key,
  design_number   text not null,
  price           numeric not null,
  is_active       boolean default true,
  name            text,
  description     text,
  image_url       text,
  category        text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
)
```

## Troubleshooting

### Issue: Empty stock items or "No items found"
**Solution**: Run `stock_items_rls_policy.sql` to enable public read access.

### Issue: Categories dropdown only shows one or two options
**Solution**: Your stock_items table has limited category values. Update the category field in your stock items to include more categories (Indowestern, Unstitch, etc.).

### Issue: Can't link stock items to catalogue
**Solution**:
1. Ensure `catalogue_items` table has matching `design_number` values
2. Run the UPDATE query in `stock_items_add_relationships.sql` (uncomment the optional section)
3. Check if the design numbers match exactly (case-sensitive)

## Support

For any issues or questions about the database schema, check the main README.md or consult the Supabase documentation.
