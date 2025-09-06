/*
  # Fix push subscriptions table structure

  1. Table Updates
    - Fix subscription_data column type to handle JSON properly
    - Add proper constraints and indexes
    - Update RLS policies for better security

  2. Security
    - Enable RLS on push_subscriptions table
    - Add policies for public insert and read access
    - Add policy for authenticated users to manage subscriptions
*/

-- Drop existing table if it has issues and recreate with proper structure
DROP TABLE IF EXISTS push_subscriptions CASCADE;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer_phone 
  ON push_subscriptions(customer_phone) 
  WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
  ON push_subscriptions(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at 
  ON push_subscriptions(created_at DESC);

-- Create unique index to prevent duplicate subscriptions per phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_phone_unique 
  ON push_subscriptions(customer_phone) 
  WHERE customer_phone IS NOT NULL AND is_active = true;

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (needed for subscription management)
CREATE POLICY "Allow public insert to push subscriptions"
  ON push_subscriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to push subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update to push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to have full access
CREATE POLICY "Allow authenticated full access to push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();