/*
  # Add AI Settings Columns to Order Settings

  1. New Columns
    - `ai_suggestions_enabled` (boolean, default true) - Enable/disable AI suggestions
    - `ai_max_suggestions` (integer, default 2) - Maximum number of suggestions to show
    - `ai_social_proof_enabled` (boolean, default true) - Enable social proof suggestions
    - `ai_urgency_enabled` (boolean, default true) - Enable urgency-based suggestions
    - `ai_affinity_enabled` (boolean, default true) - Enable affinity-based suggestions
    - `ai_value_based_enabled` (boolean, default true) - Enable value-based suggestions
    - `ai_complement_suggestions_enabled` (boolean, default true) - Enable complement suggestions
    - `ai_upsell_threshold` (numeric, default 25.00) - Minimum order value for upsell suggestions
    - `ai_show_in_cart` (boolean, default true) - Show suggestions in cart
    - `ai_show_in_checkout` (boolean, default true) - Show suggestions in checkout
    - `ai_auto_rotate_interval` (integer, default 8) - Auto-rotate interval in seconds
    - `ai_confidence_threshold` (numeric, default 0.6) - Minimum confidence threshold for suggestions

  2. Changes
    - Added AI-related configuration columns to order_settings table
    - All columns have appropriate default values for backward compatibility
*/

-- Add AI suggestions columns to order_settings table
DO $$
BEGIN
  -- Check if ai_suggestions_enabled column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_suggestions_enabled'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_suggestions_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_max_suggestions column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_max_suggestions'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_max_suggestions INTEGER DEFAULT 2;
  END IF;

  -- Check if ai_social_proof_enabled column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_social_proof_enabled'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_social_proof_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_urgency_enabled column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_urgency_enabled'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_urgency_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_affinity_enabled column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_affinity_enabled'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_affinity_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_value_based_enabled column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_value_based_enabled'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_value_based_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_complement_suggestions_enabled column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_complement_suggestions_enabled'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_complement_suggestions_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_upsell_threshold column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_upsell_threshold'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_upsell_threshold NUMERIC(10,2) DEFAULT 25.00;
  END IF;

  -- Check if ai_show_in_cart column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_show_in_cart'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_show_in_cart BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_show_in_checkout column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_show_in_checkout'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_show_in_checkout BOOLEAN DEFAULT true;
  END IF;

  -- Check if ai_auto_rotate_interval column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_auto_rotate_interval'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_auto_rotate_interval INTEGER DEFAULT 8;
  END IF;

  -- Check if ai_confidence_threshold column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_settings' AND column_name = 'ai_confidence_threshold'
  ) THEN
    ALTER TABLE order_settings ADD COLUMN ai_confidence_threshold NUMERIC(3,2) DEFAULT 0.6;
  END IF;
END $$;

-- Insert default record if it doesn't exist
INSERT INTO order_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;