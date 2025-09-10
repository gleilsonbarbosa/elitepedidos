/*
  # Admin Panel RLS Policies

  1. Security Configuration
    - Enable RLS on all admin-accessed tables
    - Create permissive policies for admin operations
    - Allow anonymous and authenticated access for admin functions

  2. Tables Covered
    - delivery_products (product management)
    - delivery_neighborhoods (delivery areas)
    - store_hours (operating hours)
    - store_settings (store configuration)
    - promotions (marketing campaigns)
    - attendance_users (user management)
    - product_images (image storage)
    - product_image_associations (image-product links)
    - order_settings (order configuration)
    - push_subscriptions (notification management)
    - product_schedules (product scheduling)

  3. Access Permissions
    - Full CRUD operations for admin tables
    - Read access for customer/transaction data
    - Sequence usage permissions
    - Function execution permissions
*/

-- Enable RLS on admin tables
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

-- Drop existing conflicting policies if they exist
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

-- Create permissive policies for admin panel access

-- Delivery Products
CREATE POLICY "delivery_products_admin_access"
  ON delivery_products
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Delivery Neighborhoods
CREATE POLICY "delivery_neighborhoods_admin_access"
  ON delivery_neighborhoods
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Store Hours
CREATE POLICY "store_hours_admin_access"
  ON store_hours
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Store Settings
CREATE POLICY "store_settings_admin_access"
  ON store_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Promotions
CREATE POLICY "promotions_admin_access"
  ON promotions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Attendance Users
CREATE POLICY "attendance_users_admin_access"
  ON attendance_users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Product Images
CREATE POLICY "product_images_admin_access"
  ON product_images
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Product Image Associations
CREATE POLICY "product_image_associations_admin_access"
  ON product_image_associations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Order Settings
CREATE POLICY "order_settings_admin_access"
  ON order_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Push Subscriptions
CREATE POLICY "push_subscriptions_admin_access"
  ON push_subscriptions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Product Schedules
CREATE POLICY "product_schedules_admin_access"
  ON product_schedules
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant sequence permissions for auto-increment fields
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure customers and transactions tables have read access for cashback management
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