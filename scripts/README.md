# Scripts Directory

This directory contains utility scripts for managing catalogue data and imports.

## Active Scripts

### Photo Import Scripts
- **`analyze-bucket-photos.js`** - Analyzes photos in the wotbot Supabase bucket (photoshoots-colored and photoshoots folders)
- **`import-photos.js`** - Imports photos from wotbot bucket to catalogue_item_photos table with fuzzy matching
- **`import-color-names.js`** - Imports color names from CSV to catalogue_item_photos table

### Analysis Scripts
- **`analyze-catalogue-stock-overlap.mjs`** - Analyzes overlap between catalogue items and stock table with fuzzy matching
- **`catalogue-completeness-report.mjs`** - Generates report of items missing photos, prices, or stock info

## Environment Variables Required

Most scripts require environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - vSFT project URL
- `VSFT_SERVICE_ROLE_KEY` - vSFT service role key (for writes)
- `SUPABASE_SERVICE_ROLE_KEY` - wotbot service role key (for photo imports)

## Running Scripts

```bash
# Install dependencies first
npm install dotenv

# Run any script
node scripts/script-name.js
# or for .mjs files
node scripts/script-name.mjs
```

## Archive

The `archive/` folder contains temporary debug scripts that were used during development but are no longer needed for regular operations. This folder is gitignored.
