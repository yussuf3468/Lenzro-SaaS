# Product Category Migration Guide

## Overview

The app now supports **organization-specific customizable product categories** instead of hardcoded categories. Each organization can create and manage their own categories with custom colors and icons.

## What Changed

### Database Changes

1. **New Table**: `product_categories` - Stores custom categories per organization
2. **Products Table**: Changed from `category` (text) to `category_id` (uuid foreign key)
3. **Default Categories**: 5 starter categories created for each organization (General, Electronics, Clothing, Food & Beverages, Books & Stationery)

### Code Changes

1. **ProductForm.tsx**: Now fetches categories from database dynamically
2. **CategoryManagement.tsx**: New component for managing categories (CRUD operations)
3. **Inventory.tsx**: Displays category with custom color and icon
4. **Layout.tsx**: Added "Categories" tab under Inventory module
5. **Types**: Updated `Product` interface to use `category_id` and optional `category` object for display

## Migration Steps

### Step 1: Run the Database Migration

Execute `PRODUCTION_READY_DATABASE_FIX.sql` in your Supabase SQL Editor. This will:

- Create `product_categories` table with RLS policies
- Add `category_id` column to `products` table
- Create `initialize_default_categories()` function
- Initialize default categories for all existing organizations

### Step 2: Migrate Existing Products (If Any)

If you have existing products with the old `category` text field, you'll need to:

1. **Check existing products**:

```sql
SELECT id, name, category FROM products WHERE category IS NOT NULL;
```

2. **Create categories from existing data** (optional):

```sql
-- This creates categories based on unique category values in products
INSERT INTO product_categories (organization_id, name, display_order, is_active)
SELECT DISTINCT
  p.organization_id,
  p.category,
  ROW_NUMBER() OVER (PARTITION BY p.organization_id ORDER BY p.category) as display_order,
  true
FROM products p
WHERE p.category IS NOT NULL
ON CONFLICT DO NOTHING;
```

3. **Update products with category_id**:

```sql
-- Link products to their new categories
UPDATE products p
SET category_id = (
  SELECT pc.id
  FROM product_categories pc
  WHERE pc.organization_id = p.organization_id
    AND pc.name = p.category
  LIMIT 1
)
WHERE p.category IS NOT NULL;
```

4. **Drop old category column** (optional, after verifying migration):

```sql
ALTER TABLE products DROP COLUMN IF EXISTS category;
```

### Step 3: Test the New System

1. Login to your app
2. Navigate to **Categories** tab (under Inventory module)
3. Create a new category with custom color and icon
4. Go to **Inventory** and create a new product
5. Verify the category dropdown shows your custom categories
6. Check that products display with colored category badges and icons

## Features

### Category Management

- **Create**: Add new categories with name, description, color (8 options), and icon (20 emoji options)
- **Edit**: Update category details
- **Delete**: Remove categories (with confirmation)
- **Activate/Deactivate**: Control category visibility
- **Reorder**: Set display order for dropdown

### Product Form Integration

- Dynamic category dropdown (fetches from database)
- Shows icon + name in dropdown
- Links to category management if no categories exist
- Validates category selection

### Visual Display

- Category badges show custom color + icon
- Table view: Compact badge with color/icon
- Card view: Icon + name with color
- Modal view: Larger badge with all details

## Default Categories

Each new organization gets these 5 starter categories:

| Name               | Icon | Color             | Description                        |
| ------------------ | ---- | ----------------- | ---------------------------------- |
| General            | 📦   | #64748b (slate)   | General purpose items              |
| Electronics        | 💻   | #3b82f6 (blue)    | Electronic devices and accessories |
| Clothing           | 👕   | #a855f7 (purple)  | Apparel and fashion items          |
| Food & Beverages   | 🍔   | #f59e0b (amber)   | Food and drink products            |
| Books & Stationery | 📚   | #10b981 (emerald) | Books, office supplies, stationery |

Organizations can customize, delete, or add to these as needed.

## Notes

- **Multi-tenant**: Each organization has isolated categories (enforced by RLS)
- **Required Field**: Products must have a category (enforced by database)
- **Cascading**: Deleting a category will prevent deletion if products use it (foreign key constraint)
- **Performance**: Categories are cached in ProductForm, fetched once on mount
- **Migration Safe**: Old `category` column can coexist during migration, drop when ready

## Troubleshooting

### Products not showing after migration

- Check that `category_id` is populated for all products
- Verify RLS policies allow access to product_categories
- Check browser console for errors

### Category dropdown is empty

- Run `initialize_default_categories()` for your organization
- Check that organization_id matches in product_categories table
- Verify user has access via organization_members

### Old products still show text category

- Clear browser cache and refresh
- Check that products query includes category join
- Verify Product type includes optional category object
