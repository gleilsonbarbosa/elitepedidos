/*
  # Create customer reviews table

  1. New Tables
    - `customer_reviews`
      - `id` (uuid, primary key)
      - `customer_name` (text, required)
      - `customer_phone` (text, optional)
      - `rating` (integer, 1-5 stars)
      - `comment` (text, required)
      - `order_id` (text, optional)
      - `created_at` (timestamp)
      - `is_approved` (boolean, default false)
      - `is_featured` (boolean, default false)

  2. Security
    - Enable RLS on `customer_reviews` table
    - Add policy for public to read approved reviews
    - Add policy for authenticated users to insert reviews
    - Add policy for authenticated users to manage reviews
*/

CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  order_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_approved boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL
);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public to read approved reviews
CREATE POLICY "Allow public read access to approved reviews"
  ON customer_reviews
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Allow authenticated insert access"
  ON customer_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to manage all reviews (for admin panel)
CREATE POLICY "Allow authenticated full access"
  ON customer_reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_reviews_approved ON customer_reviews (is_approved);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_featured ON customer_reviews (is_featured);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON customer_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created_at ON customer_reviews (created_at DESC);