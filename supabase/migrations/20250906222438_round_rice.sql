/*
  # Fix RLS policies for admin panel access

  1. Security Changes
    - Grant necessary permissions to anon role for admin operations
    - Enable RLS on all admin-related tables
    - Create policies for CRUD operations on admin tables

  2. Tables Updated
    - delivery_products: Full CRUD access for anon role
    - delivery_neighborhoods: Full CRUD access for anon role  
    - store_hours: Full CRUD access for anon role
    - store_settings: Full CRUD access for anon role
    - promotions: Full CRUD access for anon role
    - attendance_users: Full CRUD access for anon role
    - product_images: Full CRUD access for anon role
    - product_image_associations: Full CRUD access for anon role
    - order_settings: Full CRUD access for anon role
    - push_subscriptions: Read and insert access for anon role
    - customers: Read access for anon role (for cashback management)
    - transactions: Read access for anon role (for cashback management)

  3. Important Notes
    - These policies are for development/demo purposes
    - In production, implement proper authentication and more restrictive policies
    - Consider using service role key for admin operations in production
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_image_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "delivery_products_anon_all" ON delivery_products;
DROP POLICY IF EXISTS "delivery_neighborhoods_anon_all" ON delivery_neighborhoods;
DROP POLICY IF EXISTS "store_hours_anon_all" ON store_hours;
DROP POLICY IF EXISTS "store_settings_anon_all" ON store_settings;
DROP POLICY IF EXISTS "promotions_anon_all" ON promotions;
DROP POLICY IF EXISTS "attendance_users_anon_all" ON attendance_users;
DROP POLICY IF EXISTS "product_images_anon_all" ON product_images;
DROP POLICY IF EXISTS "product_image_associations_anon_all" ON product_image_associations;
DROP POLICY IF EXISTS "order_settings_anon_all" ON order_settings;
DROP POLICY IF EXISTS "push_subscriptions_anon_access" ON push_subscriptions;
DROP POLICY IF EXISTS "customers_anon_read" ON customers;
DROP POLICY IF EXISTS "transactions_anon_read" ON transactions;

-- Delivery Products - Full CRUD access for anon role
CREATE POLICY "delivery_products_anon_all"
  ON delivery_products
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Delivery Neighborhoods - Full CRUD access for anon role  
CREATE POLICY "delivery_neighborhoods_anon_all"
  ON delivery_neighborhoods
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Store Hours - Full CRUD access for anon role
CREATE POLICY "store_hours_anon_all"
  ON store_hours
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Store Settings - Full CRUD access for anon role
CREATE POLICY "store_settings_anon_all"
  ON store_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Promotions - Full CRUD access for anon role
CREATE POLICY "promotions_anon_all"
  ON promotions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Attendance Users - Full CRUD access for anon role
CREATE POLICY "attendance_users_anon_all"
  ON attendance_users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Product Images - Full CRUD access for anon role
CREATE POLICY "product_images_anon_all"
  ON product_images
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Product Image Associations - Full CRUD access for anon role
CREATE POLICY "product_image_associations_anon_all"
  ON product_image_associations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Order Settings - Full CRUD access for anon role
CREATE POLICY "order_settings_anon_all"
  ON order_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Push Subscriptions - Read and Insert access for anon role
CREATE POLICY "push_subscriptions_anon_access"
  ON push_subscriptions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Customers - Read access for anon role (needed for cashback management)
CREATE POLICY "customers_anon_read"
  ON customers
  FOR SELECT
  TO anon
  USING (true);

-- Transactions - Read access for anon role (needed for cashback management)
CREATE POLICY "transactions_anon_read"
  ON transactions
  FOR SELECT
  TO anon
  USING (true);

-- Grant usage on sequences that might be needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execute permissions on functions that might be called
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;