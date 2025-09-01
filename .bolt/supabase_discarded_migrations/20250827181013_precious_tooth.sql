/*
  # Create delivery_products table

  1. New Tables
    - `delivery_products`
      - `id` (text, primary key) - Product identifier
      - `name` (text, not null) - Product name
      - `category` (text, not null) - Product category
      - `price` (numeric) - Base price
      - `original_price` (numeric) - Original price before discount
      - `price_per_gram` (numeric) - Price per gram for weighable items
      - `description` (text) - Product description
      - `image_url` (text) - Product image URL
      - `is_active` (boolean) - Whether product is active
      - `is_weighable` (boolean) - Whether product is sold by weight
      - `complement_groups` (jsonb) - Product complement groups configuration
      - `sizes` (jsonb) - Available sizes for the product
      - `availability_type` (text) - Type of availability scheduling
      - `scheduled_days` (jsonb) - Days when product is available
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp

  2. Security
    - Enable RLS on `delivery_products` table
    - Add policy for public read access

  This fixes the error: "Could not find the table 'public.delivery_products' in the schema cache"
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  price numeric(10,2) NOT NULL DEFAULT 0,
  original_price numeric(10,2),
  price_per_gram numeric(10,4),
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_weighable boolean NOT NULL DEFAULT false,
  complement_groups jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  availability_type text,
  scheduled_days jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since it's a delivery menu)
CREATE POLICY "Allow public read access to delivery_products"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_products_active 
ON delivery_products(is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_products_category 
ON delivery_products(category);

CREATE INDEX IF NOT EXISTS idx_delivery_products_name 
ON delivery_products(name);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_delivery_products_updated_at
    BEFORE UPDATE ON delivery_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default products to populate the table
INSERT INTO delivery_products (id, name, category, price, description, image_url, is_active) 
VALUES 
  ('acai-300g', 'Açaí 300g', 'acai', 13.99, 'Açaí tradicional 300g com complementos', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true),
  ('acai-500g', 'Açaí 500g', 'acai', 22.99, 'Açaí tradicional 500g com complementos', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true),
  ('milkshake-400ml', 'Milkshake 400ml', 'bebidas', 11.99, 'Milkshake cremoso 400ml', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true)
ON CONFLICT (id) DO NOTHING;