/*
  # Fix RLS policies for order_settings table

  1. Security
    - Enable RLS on order_settings table
    - Add policy for public users to read order settings
    - Add policy for authenticated users to manage order settings
    - Add policy for public users to upsert order settings (for admin panel access)

  2. Changes
    - Allow SELECT for public role (reading settings)
    - Allow INSERT/UPDATE for authenticated role (admin operations)
    - Allow INSERT/UPDATE for public role (fallback for admin panel)
*/

-- Enable RLS on order_settings table
ALTER TABLE order_settings ENABLE ROW LEVEL SECURITY;

-- Allow public users to read order settings
CREATE POLICY "Allow public users to read order settings"
  ON order_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to manage order settings
CREATE POLICY "Allow authenticated users to manage order settings"
  ON order_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public users to insert/update order settings (for admin panel)
CREATE POLICY "Allow public users to manage order settings"
  ON order_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);