/*
  # Create PDV Operators Table

  1. New Tables
     - `pdv_operators`
       - `id` (uuid, primary key)
       - `name` (text, operator name)
       - `code` (text, unique, operator code)
       - `password_hash` (text, password)
       - `is_active` (boolean, default true)
       - `permissions` (jsonb, operator permissions)
       - `created_at` (timestamp)
       - `updated_at` (timestamp)
       - `last_login` (timestamp, nullable)

  2. Security
     - Enable RLS on `pdv_operators` table
     - Add policy for public access (demo mode)

  3. Indexes
     - Unique index on code
     - Index on is_active for filtering
*/

CREATE TABLE IF NOT EXISTS pdv_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '{
    "can_cancel": false,
    "can_discount": false,
    "can_use_scale": false,
    "can_view_sales": false,
    "can_view_orders": false,
    "can_view_reports": false,
    "can_view_products": false,
    "can_view_operators": false,
    "can_manage_products": false,
    "can_manage_settings": false,
    "can_view_attendance": false,
    "can_view_cash_report": false,
    "can_view_sales_report": false,
    "can_view_cash_register": false,
    "can_view_expected_balance": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE pdv_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on pdv_operators"
  ON pdv_operators
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdv_operators_code ON pdv_operators(code);
CREATE INDEX IF NOT EXISTS idx_pdv_operators_active ON pdv_operators(is_active);

-- Insert default admin operator
INSERT INTO pdv_operators (name, code, password_hash, is_active, permissions) VALUES (
  'Administrador',
  'ADMIN',
  'elite2024',
  true,
  '{
    "can_cancel": true,
    "can_discount": true,
    "can_use_scale": true,
    "can_view_sales": true,
    "can_view_orders": true,
    "can_view_reports": true,
    "can_view_products": true,
    "can_view_operators": true,
    "can_manage_products": true,
    "can_manage_settings": true,
    "can_view_attendance": true,
    "can_view_cash_report": true,
    "can_view_sales_report": true,
    "can_view_cash_register": true,
    "can_view_expected_balance": true
  }'::jsonb
) ON CONFLICT (code) DO NOTHING;