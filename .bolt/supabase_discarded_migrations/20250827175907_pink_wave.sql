/*
  # Create Delivery Products Table

  1. New Tables
     - `delivery_products`
       - `id` (uuid, primary key)
       - `name` (text, product name)
       - `category` (text, product category)
       - `price` (numeric, base price)
       - `original_price` (numeric, nullable, original price for promotions)
       - `price_per_gram` (numeric, nullable, price per gram for weighable products)
       - `description` (text, product description)
       - `image_url` (text, product image URL)
       - `is_active` (boolean, product availability)
       - `is_weighable` (boolean, whether product is sold by weight)
       - `complement_groups` (jsonb, complement configuration)
       - `sizes` (jsonb, size options)
       - `availability_type` (text, availability type)
       - `scheduled_days` (jsonb, scheduled availability)
       - `created_at` (timestamp)
       - `updated_at` (timestamp)

  2. Security
     - Enable RLS on `delivery_products` table
     - Add policy for public read access

  3. Constraints
     - Check constraint for category values
     - Check constraint for availability_type values

  4. Indexes
     - Index on category for filtering
     - Index on is_active for filtering
     - Index on name for searching
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'acai',
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  original_price numeric(10,2),
  price_per_gram numeric(10,4),
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  is_weighable boolean DEFAULT false,
  complement_groups jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  availability_type text,
  scheduled_days jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to delivery_products"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to delivery_products"
  ON delivery_products
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to delivery_products"
  ON delivery_products
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to delivery_products"
  ON delivery_products
  FOR DELETE
  TO public
  USING (true);

-- Add constraints
ALTER TABLE delivery_products 
ADD CONSTRAINT delivery_products_category_check 
CHECK (category IN ('acai', 'combo', 'milkshake', 'vitamina', 'sorvetes', 'bebidas', 'complementos', 'sobremesas', 'outros'));

ALTER TABLE delivery_products 
ADD CONSTRAINT delivery_products_availability_type_check 
CHECK (availability_type IS NULL OR availability_type IN ('always', 'scheduled', 'specific_days'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_products_category ON delivery_products(category);
CREATE INDEX IF NOT EXISTS idx_delivery_products_active ON delivery_products(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_products_name ON delivery_products(name);
CREATE INDEX IF NOT EXISTS idx_delivery_products_weighable ON delivery_products(is_weighable);
CREATE INDEX IF NOT EXISTS idx_delivery_products_created_at ON delivery_products(created_at);

-- Insert some sample products for testing
INSERT INTO delivery_products (name, category, price, description, image_url, is_active, complement_groups) VALUES
(
  'Açaí Premium 300ml',
  'acai',
  13.99,
  'Açaí tradicional com 2 cremes e 3 complementos',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
  true,
  '[]'::jsonb
),
(
  'Açaí Premium 500ml',
  'acai',
  22.99,
  'Açaí tradicional com 2 cremes e 3 complementos',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
  true,
  '[]'::jsonb
),
(
  'Combo Casal 1kg',
  'combo',
  49.99,
  'Combo perfeito para casal: 1kg de açaí + milkshake 300g',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
  true,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;