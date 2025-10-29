# Stock Data

This folder contains the imported stock data for the vSFT application.

## Files

- **all-stock-combined.csv** - Combined stock data from all categories (1,605 items, 3,142 pieces)

## Database Table: stock_items

The stock data has been imported into the `stock_items` table in Supabase with the following structure:

### Columns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| sku | VARCHAR(100) | Stock Keeping Unit code |
| name | VARCHAR(255) | Item name (auto-generated from design, color, size) |
| description | TEXT | Item description (auto-generated) |
| quantity | DECIMAL(10,2) | Available quantity |
| category | VARCHAR(100) | Category (e.g., "6211 SUIT", "FINISHED INDO-WESTERN") |
| color | VARCHAR(100) | Item color |
| size | VARCHAR(50) | Item size |
| design_number | VARCHAR(100) | Parent design number |
| lot_number | VARCHAR(50) | Manufacturing lot number |
| lot_code | VARCHAR(50) | Lot code |
| unit_price | DECIMAL(10,2) | Price per unit (optional) |
| supplier | VARCHAR(255) | Supplier name (optional) |
| reorder_level | INTEGER | Reorder threshold |
| location | VARCHAR(255) | Storage location (optional) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Unique Constraint

Items are uniquely identified by the combination of `(sku, design_number, color, size)`.

### Data Summary

- **Total items**: 1,605 unique variants
- **Total pieces**: 3,142
- **Categories**:
  - 6211 SUIT: 1,509 items (2,940 pieces)
  - FINISHED INDO-WESTERN: 35 items (103 pieces)
  - FINISHED GOODS: 6 items (22 pieces)
  - FINISHED UNSTITCH: 55 items (77 pieces)

## Source Data

Original PDFs are located in `public/assets/stock/`:
- finished-suits.pdf
- finished-indowestern.pdf
- finished-goods.pdf
- finished-unstiched.pdf

Extraction scripts and intermediate files are archived in `archive/stock-extraction/`.
