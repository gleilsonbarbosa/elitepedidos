/*
  # Create RLS policies for promotions table

  1. Security
    - Enable RLS on `promotions` table
    - Add policy for public read access to active promotions
    - Add policy for authenticated users to manage promotions
    - Add policy for anonymous users to view active promotions

  2. Access Control
    - Public users can only view active promotions within valid time period
    - Authenticated users can perform all operations
    - Anonymous users can view promotions for delivery system
*/

-- Enable RLS on promotions table
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to active promotions
CREATE POLICY "Public can view active promotions"
  ON promotions
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND start_time <= now() 
    AND end_time >= now()
  );

-- Policy for anonymous users to view active promotions
CREATE POLICY "Anonymous can view active promotions"
  ON promotions
  FOR SELECT
  TO anon
  USING (
    is_active = true 
    AND start_time <= now() 
    AND end_time >= now()
  );

-- Policy for authenticated users to manage all promotions
CREATE POLICY "Authenticated users can manage promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to view all promotions (including inactive)
CREATE POLICY "Authenticated can view all promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for service role to have full access
CREATE POLICY "Service role full access to promotions"
  ON promotions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);