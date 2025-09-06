/*
  # Create RLS policies for order_settings table

  1. Security
    - Enable RLS on `order_settings` table
    - Add policy for public read access
    - Add policy for authenticated users full access
    - Add policy for public full access (admin panel)

  2. Permissions
    - Public users can read order settings
    - Authenticated users can manage all settings
    - Public users can manage settings (for admin panel access)
*/

-- Enable RLS on order_settings table
ALTER TABLE order_settings ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Allow public read access to order settings"
  ON order_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy for authenticated users full access
CREATE POLICY "Allow authenticated users full access to order settings"
  ON order_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for public full access (admin panel)
CREATE POLICY "Allow public full access to order settings"
  ON order_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy for anonymous users full access
CREATE POLICY "Allow anonymous users full access to order settings"
  ON order_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);