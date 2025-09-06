/*
  # Create promotions table

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `product_id` (text, references delivery products)
      - `product_name` (text, product name for display)
      - `original_price` (numeric, original product price)
      - `promotional_price` (numeric, discounted price)
      - `start_time` (timestamptz, when promotion starts)
      - `end_time` (timestamptz, when promotion ends)
      - `title` (text, promotion title)
      - `description` (text, optional description)
      - `is_active` (boolean, whether promotion is active)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `promotions` table
    - Add policy for public read access
    - Add policy for authenticated users to manage promotions

  3. Indexes
    - Index on product_id for faster lookups
    - Index on is_active for filtering active promotions
    - Index on start_time and end_time for time-based queries
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id text NOT NULL,
    product_name text NOT NULL,
    original_price numeric(10,2) NOT NULL,
    promotional_price numeric(10,2) NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    title text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for all users"
ON public.promotions FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to manage promotions"
ON public.promotions FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON public.promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_time_range ON public.promotions(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON public.promotions(created_at DESC);

-- Add constraints
ALTER TABLE public.promotions ADD CONSTRAINT promotions_price_check 
CHECK (promotional_price > 0 AND promotional_price < original_price);

ALTER TABLE public.promotions ADD CONSTRAINT promotions_time_check 
CHECK (end_time > start_time);