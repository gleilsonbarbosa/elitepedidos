/*
  # Create RLS policies for AI suggestions settings

  1. Security
    - Enable RLS on order_settings table (if not already enabled)
    - Add policies for AI suggestions access
    - Allow public read access to AI settings
    - Allow authenticated users to manage AI settings
    - Allow service role full access

  2. Policies Created
    - Public users can read AI settings
    - Authenticated users can update AI settings
    - Service role has full access
*/

-- Ensure RLS is enabled on order_settings table
ALTER TABLE order_settings ENABLE ROW LEVEL SECURITY;

-- Policy for public users to read AI settings (needed for delivery page)
CREATE POLICY IF NOT EXISTS "Public users can read AI settings"
  ON order_settings
  FOR SELECT
  TO public
  USING (true);

-- Policy for anonymous users to read AI settings
CREATE POLICY IF NOT EXISTS "Anonymous users can read AI settings"
  ON order_settings
  FOR SELECT
  TO anon
  USING (true);

-- Policy for authenticated users to read AI settings
CREATE POLICY IF NOT EXISTS "Authenticated users can read AI settings"
  ON order_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to update AI settings
CREATE POLICY IF NOT EXISTS "Authenticated users can update AI settings"
  ON order_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to insert AI settings
CREATE POLICY IF NOT EXISTS "Authenticated users can insert AI settings"
  ON order_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for service role to have full access
CREATE POLICY IF NOT EXISTS "Service role full access to AI settings"
  ON order_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to public role
GRANT SELECT ON order_settings TO public;
GRANT SELECT ON order_settings TO anon;

-- Grant full permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON order_settings TO authenticated;

-- Ensure the default record exists with AI settings
INSERT INTO order_settings (
  id,
  ai_suggestions_enabled,
  ai_max_suggestions,
  ai_social_proof_enabled,
  ai_urgency_enabled,
  ai_affinity_enabled,
  ai_value_based_enabled,
  ai_complement_suggestions_enabled,
  ai_upsell_threshold,
  ai_show_in_cart,
  ai_show_in_checkout,
  ai_auto_rotate_interval,
  ai_confidence_threshold,
  created_at,
  updated_at
) VALUES (
  'default',
  true,
  2,
  true,
  true,
  true,
  true,
  true,
  25.00,
  true,
  true,
  8,
  0.6,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  ai_suggestions_enabled = COALESCE(order_settings.ai_suggestions_enabled, EXCLUDED.ai_suggestions_enabled),
  ai_max_suggestions = COALESCE(order_settings.ai_max_suggestions, EXCLUDED.ai_max_suggestions),
  ai_social_proof_enabled = COALESCE(order_settings.ai_social_proof_enabled, EXCLUDED.ai_social_proof_enabled),
  ai_urgency_enabled = COALESCE(order_settings.ai_urgency_enabled, EXCLUDED.ai_urgency_enabled),
  ai_affinity_enabled = COALESCE(order_settings.ai_affinity_enabled, EXCLUDED.ai_affinity_enabled),
  ai_value_based_enabled = COALESCE(order_settings.ai_value_based_enabled, EXCLUDED.ai_value_based_enabled),
  ai_complement_suggestions_enabled = COALESCE(order_settings.ai_complement_suggestions_enabled, EXCLUDED.ai_complement_suggestions_enabled),
  ai_upsell_threshold = COALESCE(order_settings.ai_upsell_threshold, EXCLUDED.ai_upsell_threshold),
  ai_show_in_cart = COALESCE(order_settings.ai_show_in_cart, EXCLUDED.ai_show_in_cart),
  ai_show_in_checkout = COALESCE(order_settings.ai_show_in_checkout, EXCLUDED.ai_show_in_checkout),
  ai_auto_rotate_interval = COALESCE(order_settings.ai_auto_rotate_interval, EXCLUDED.ai_auto_rotate_interval),
  ai_confidence_threshold = COALESCE(order_settings.ai_confidence_threshold, EXCLUDED.ai_confidence_threshold),
  updated_at = now();