/*
  # Fix Admin Panel RLS Policies

  This migration fixes the 401 Unauthorized error in the admin panel by ensuring
  proper RLS policies are in place for all tables accessed by admin components.

  ## Changes Made
  1. Enable RLS on all admin-accessed tables
  2. Create permissive policies for anon role on admin tables
  3. Ensure proper access to delivery_products, neighborhoods, store settings, etc.
  4. Fix any missing or restrictive policies

  ## Security Note
  These policies are permissive for development purposes.
  In production, implement proper authentication and role-based access.
*/

-- Enable RLS on all admin tables if not already enabled
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
ALTER TABLE product_schedules ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies for admin tables
DROP POLICY IF EXISTS "delivery_products_admin_access" ON delivery_products;
DROP POLICY IF EXISTS "delivery_neighborhoods_admin_access" ON delivery_neighborhoods;
DROP POLICY IF EXISTS "store_hours_admin_access" ON store_hours;
DROP POLICY IF EXISTS "store_settings_admin_access" ON store_settings;
DROP POLICY IF EXISTS "promotions_admin_access" ON promotions;
DROP POLICY IF EXISTS "attendance_users_admin_access" ON attendance_users;
DROP POLICY IF EXISTS "product_images_admin_access" ON product_images;
DROP POLICY IF EXISTS "product_image_associations_admin_access" ON product_image_associations;
DROP POLICY IF EXISTS "order_settings_admin_access" ON order_settings;
DROP POLICY IF EXISTS "push_subscriptions_admin_access" ON push_subscriptions;
DROP POLICY IF EXISTS "product_schedules_admin_access" ON product_schedules;

-- Create comprehensive policies for admin panel access
CREATE POLICY "delivery_products_admin_access"
  ON delivery_products
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "delivery_neighborhoods_admin_access"
  ON delivery_neighborhoods
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "store_hours_admin_access"
  ON store_hours
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "store_settings_admin_access"
  ON store_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "promotions_admin_access"
  ON promotions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "attendance_users_admin_access"
  ON attendance_users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_images_admin_access"
  ON product_images
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_image_associations_admin_access"
  ON product_image_associations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "order_settings_admin_access"
  ON order_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "push_subscriptions_admin_access"
  ON push_subscriptions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_schedules_admin_access"
  ON product_schedules
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure customers and transactions have read access for cashback management
CREATE POLICY IF NOT EXISTS "customers_admin_read"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "transactions_admin_read"
  ON transactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant necessary permissions for sequences (auto-increment fields)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions that might be called by admin panel
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;