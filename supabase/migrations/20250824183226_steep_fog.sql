/*
  # Remove table sales functionality

  1. Tables to Remove
    - `store1_tables` - Restaurant tables for store 1
    - `store1_table_sales` - Table sales for store 1
    - `store1_table_sale_items` - Table sale items for store 1
    - `store2_tables` - Restaurant tables for store 2
    - `store2_table_sales` - Table sales for store 2
    - `store2_table_sale_items` - Table sale items for store 2

  2. Enums to Remove
    - `table_status` - Table status enum
    - `table_sale_status` - Table sale status enum
    - `table_payment_type` - Table payment type enum

  3. Functions to Remove
    - `update_table_status_on_sale_change` - Function to update table status
    - `update_table_updated_at_column` - Function to update table timestamps

  4. Sequences to Remove
    - `store1_table_sales_sale_number_seq` - Sale number sequence for store 1
    - `store2_table_sales_sale_number_seq` - Sale number sequence for store 2
*/

-- Remove foreign key constraints first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store1_tables_current_sale_id_fkey'
  ) THEN
    ALTER TABLE store1_tables DROP CONSTRAINT store1_tables_current_sale_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store2_tables_current_sale_id_fkey'
  ) THEN
    ALTER TABLE store2_tables DROP CONSTRAINT store2_tables_current_sale_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store1_table_sales_table_id_fkey'
  ) THEN
    ALTER TABLE store1_table_sales DROP CONSTRAINT store1_table_sales_table_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store2_table_sales_table_id_fkey'
  ) THEN
    ALTER TABLE store2_table_sales DROP CONSTRAINT store2_table_sales_table_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store1_table_sale_items_sale_id_fkey'
  ) THEN
    ALTER TABLE store1_table_sale_items DROP CONSTRAINT store1_table_sale_items_sale_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store2_table_sale_items_sale_id_fkey'
  ) THEN
    ALTER TABLE store2_table_sale_items DROP CONSTRAINT store2_table_sale_items_sale_id_fkey;
  END IF;
END $$;

-- Drop tables if they exist
DROP TABLE IF EXISTS store1_table_sale_items CASCADE;
DROP TABLE IF EXISTS store2_table_sale_items CASCADE;
DROP TABLE IF EXISTS store1_table_sales CASCADE;
DROP TABLE IF EXISTS store2_table_sales CASCADE;
DROP TABLE IF EXISTS store1_tables CASCADE;
DROP TABLE IF EXISTS store2_tables CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS store1_table_sales_sale_number_seq CASCADE;
DROP SEQUENCE IF EXISTS store2_table_sales_sale_number_seq CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_table_status_on_sale_change() CASCADE;
DROP FUNCTION IF EXISTS update_table_updated_at_column() CASCADE;

-- Drop enums if they exist
DROP TYPE IF EXISTS table_status CASCADE;
DROP TYPE IF EXISTS table_sale_status CASCADE;
DROP TYPE IF EXISTS table_payment_type CASCADE;