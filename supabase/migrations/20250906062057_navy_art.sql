/*
  # Create order settings table

  1. New Tables
    - `order_settings`
      - `id` (text, primary key) - Always 'default' for single configuration
      - `sound_enabled` (boolean) - Enable/disable sound notifications
      - `sound_type` (text) - Type of sound (classic, bell, chime, alert)
      - `sound_volume` (integer) - Volume percentage (0-100)
      - `auto_repeat` (boolean) - Enable auto-repeat for pending orders
      - `repeat_interval` (integer) - Interval in seconds for sound repeat
      - `channel_sounds` (jsonb) - Sound URLs for different channels
      - `popup_enabled` (boolean) - Enable popup notifications
      - `badge_animation` (text) - Badge animation type
      - `status_colors` (jsonb) - Colors for different order statuses
      - `auto_accept` (boolean) - Auto-accept orders
      - `default_prep_time` (integer) - Default preparation time in minutes
      - `auto_print` (boolean) - Auto-print orders
      - `selected_printer` (text) - Selected printer name
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `order_settings` table
    - Add policy for authenticated users to read and update settings
    - Add policy for public users to read settings (for sound notifications)
*/

CREATE TABLE IF NOT EXISTS order_settings (
  id text PRIMARY KEY DEFAULT 'default',
  sound_enabled boolean DEFAULT true,
  sound_type text DEFAULT 'classic',
  sound_volume integer DEFAULT 70,
  auto_repeat boolean DEFAULT false,
  repeat_interval integer DEFAULT 30,
  channel_sounds jsonb DEFAULT '{
    "delivery": "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    "attendance": "https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3",
    "pdv": "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
  }'::jsonb,
  popup_enabled boolean DEFAULT true,
  badge_animation text DEFAULT 'blink',
  status_colors jsonb DEFAULT '{
    "new": "#ef4444",
    "preparing": "#f59e0b",
    "ready": "#10b981",
    "delivered": "#6b7280"
  }'::jsonb,
  auto_accept boolean DEFAULT false,
  default_prep_time integer DEFAULT 30,
  auto_print boolean DEFAULT false,
  selected_printer text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE order_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage order settings"
  ON order_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public users to read order settings"
  ON order_settings
  FOR SELECT
  TO public
  USING (true);

-- Insert default settings
INSERT INTO order_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_order_settings_updated_at
  BEFORE UPDATE ON order_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_order_settings_updated_at();