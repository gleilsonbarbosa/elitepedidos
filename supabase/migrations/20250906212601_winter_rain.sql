/*
  # Create push subscriptions table

  1. New Tables
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `customer_phone` (text, optional)
      - `customer_name` (text, optional)
      - `subscription_data` (jsonb, required) - dados da subscription do navegador
      - `user_agent` (text, optional) - informações do navegador
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `push_subscriptions` table
    - Add policies for public access (delivery system)

  3. Indexes
    - Index on customer_phone for fast lookups
    - Index on is_active for filtering active subscriptions
    - Index on created_at for ordering
*/

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text,
  customer_name text,
  subscription_data jsonb NOT NULL,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (delivery system needs this)
CREATE POLICY "Allow public read access to push subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to push subscriptions"
  ON push_subscriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer_phone 
  ON push_subscriptions(customer_phone) 
  WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
  ON push_subscriptions(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at 
  ON push_subscriptions(created_at DESC);

-- Create unique constraint on customer_phone to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_phone_unique 
  ON push_subscriptions(customer_phone) 
  WHERE customer_phone IS NOT NULL AND is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();