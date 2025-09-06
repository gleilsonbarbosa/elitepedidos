/*
  # Create promotions table

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to delivery_products)
      - `product_name` (text, cached product name)
      - `original_price` (numeric, original product price)
      - `promotional_price` (numeric, discounted price)
      - `start_time` (timestamptz, when promotion starts)
      - `end_time` (timestamptz, when promotion ends)
      - `title` (text, promotion title)
      - `description` (text, optional description)
      - `is_active` (boolean, whether promotion is enabled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `promotions` table
    - Add policies for authenticated users to manage promotions
    - Add policy for public users to read active promotions

  3. Indexes
    - Index on product_id for fast lookups
    - Index on start_time and end_time for time-based queries
    - Index on is_active for filtering active promotions
*/

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  original_price numeric(10,2) NOT NULL,
  promotional_price numeric(10,2) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE promotions 
ADD CONSTRAINT promotions_price_check 
CHECK (promotional_price > 0 AND promotional_price < original_price);

ALTER TABLE promotions 
ADD CONSTRAINT promotions_time_check 
CHECK (end_time > start_time);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_time_range ON promotions(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_current ON promotions(start_time, end_time, is_active) 
WHERE is_active = true AND start_time <= now() AND end_time >= now();

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "promotions_authenticated_all"
  ON promotions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "promotions_public_read"
  ON promotions
  FOR SELECT
  TO public
  USING (is_active = true);

-- Function to automatically deactivate expired promotions
CREATE OR REPLACE FUNCTION deactivate_expired_promotions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE promotions 
  SET is_active = false, updated_at = now()
  WHERE is_active = true 
    AND end_time < now();
END;
$$;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();