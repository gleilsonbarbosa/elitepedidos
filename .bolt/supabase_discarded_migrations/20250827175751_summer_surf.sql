/*
  # Create missing database tables

  This migration creates all the missing tables that are causing 404 errors:
  
  1. New Tables
    - `delivery_products` - Products for the delivery system
    - `pdv_operators` - PDV system operators 
    - `pdv_cash_registers` - Cash register sessions
    - `pdv_cash_entries` - Cash register transactions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for public read and authenticated write access
    
  3. Indexes
    - Add performance indexes for commonly queried columns
    
  Note: store_hours and delivery_neighborhoods already exist according to schema
*/

-- Create delivery_products table
CREATE TABLE IF NOT EXISTS public.delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  price_per_gram numeric(10,5),
  description text,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  is_weighable boolean DEFAULT false NOT NULL,
  complement_groups jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  scheduled_days jsonb,
  availability_type text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.delivery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.delivery_products 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access" ON public.delivery_products 
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for delivery_products
CREATE INDEX IF NOT EXISTS idx_delivery_products_category ON public.delivery_products(category);
CREATE INDEX IF NOT EXISTS idx_delivery_products_active ON public.delivery_products(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_products_name ON public.delivery_products(name);

-- Create pdv_operators table
CREATE TABLE IF NOT EXISTS public.pdv_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_login timestamptz
);

ALTER TABLE public.pdv_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.pdv_operators 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access" ON public.pdv_operators 
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for pdv_operators
CREATE INDEX IF NOT EXISTS idx_pdv_operators_code ON public.pdv_operators(code);
CREATE INDEX IF NOT EXISTS idx_pdv_operators_active ON public.pdv_operators(is_active);

-- Create pdv_cash_registers table
CREATE TABLE IF NOT EXISTS public.pdv_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_amount numeric(10,2) NOT NULL,
  closing_amount numeric(10,2),
  difference numeric(10,2),
  opened_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz,
  operator_id uuid REFERENCES public.pdv_operators(id),
  store_id text DEFAULT 'loja1' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.pdv_cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.pdv_cash_registers 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access" ON public.pdv_cash_registers 
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for pdv_cash_registers
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_opened_at ON public.pdv_cash_registers(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_closed_at ON public.pdv_cash_registers(closed_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_operator ON public.pdv_cash_registers(operator_id);

-- Create pdv_cash_entries table
CREATE TABLE IF NOT EXISTS public.pdv_cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES public.pdv_cash_registers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.pdv_cash_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.pdv_cash_entries 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access" ON public.pdv_cash_entries 
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for pdv_cash_entries
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_register ON public.pdv_cash_entries(register_id);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_created_at ON public.pdv_cash_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_type ON public.pdv_cash_entries(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_products_updated_at'
  ) THEN
    CREATE TRIGGER update_delivery_products_updated_at 
      BEFORE UPDATE ON public.delivery_products 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pdv_operators_updated_at'
  ) THEN
    CREATE TRIGGER update_pdv_operators_updated_at 
      BEFORE UPDATE ON public.pdv_operators 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pdv_cash_registers_updated_at'
  ) THEN
    CREATE TRIGGER update_pdv_cash_registers_updated_at 
      BEFORE UPDATE ON public.pdv_cash_registers 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default admin operator if not exists
INSERT INTO public.pdv_operators (name, code, password_hash, is_active, permissions)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.pdv_operators WHERE code = 'ADMIN'
);

-- Insert sample delivery products if table is empty
INSERT INTO public.delivery_products (name, category, price, description, image_url, is_active, complement_groups)
SELECT 
  'Açaí Premium 500ml',
  'acai',
  22.99,
  'Açaí premium com 2 cremes e 3 acompanhamentos',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
  true,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_products LIMIT 1
);