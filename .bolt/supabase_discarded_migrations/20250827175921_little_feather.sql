/*
  # Create PDV Sales Related Tables

  1. New Tables
     - `pdv_sales`
       - Complete sales transaction records
     - `pdv_sale_items`
       - Individual items within sales
     - `pdv_products`
       - Products available in PDV system
     - `pdv_settings`
       - PDV system configuration

  2. Security
     - Enable RLS on all tables
     - Add policies for public access (demo mode)

  3. Foreign Keys
     - Proper relationships between tables

  4. Indexes
     - Performance indexes for common queries
*/

-- PDV Products Table
CREATE TABLE IF NOT EXISTS pdv_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'acai',
  is_weighable boolean DEFAULT false,
  unit_price numeric(10,2),
  price_per_gram numeric(10,4),
  image_url text,
  stock_quantity numeric(10,3) DEFAULT 0,
  min_stock numeric(10,3) DEFAULT 0,
  is_active boolean DEFAULT true,
  barcode text,
  description text,
  display_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDV Sales Table
CREATE TABLE IF NOT EXISTS pdv_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number serial,
  operator_id uuid,
  customer_name text,
  customer_phone text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0.00,
  discount_amount numeric(10,2) DEFAULT 0.00,
  discount_percentage numeric(5,2) DEFAULT 0.00,
  total_amount numeric(10,2) NOT NULL,
  payment_type text NOT NULL DEFAULT 'dinheiro',
  payment_details jsonb,
  change_amount numeric(10,2) DEFAULT 0.00,
  notes text,
  is_cancelled boolean DEFAULT false,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text,
  cash_register_id uuid,
  channel text DEFAULT 'pdv',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PDV Sale Items Table
CREATE TABLE IF NOT EXISTS pdv_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid,
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity integer DEFAULT 1,
  weight_kg numeric(10,3),
  unit_price numeric(10,2),
  price_per_gram numeric(10,4),
  discount_amount numeric(10,2) DEFAULT 0.00,
  subtotal numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PDV Settings Table
CREATE TABLE IF NOT EXISTS pdv_settings (
  id text PRIMARY KEY DEFAULT 'loja1',
  store_name text DEFAULT 'Elite Açaí - Loja 1',
  printer_enabled boolean DEFAULT true,
  scale_enabled boolean DEFAULT true,
  auto_print boolean DEFAULT false,
  sound_enabled boolean DEFAULT true,
  paper_width text DEFAULT '80mm',
  font_size integer DEFAULT 14,
  scale_port text DEFAULT 'COM1',
  scale_baud_rate integer DEFAULT 4800,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE pdv_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations
CREATE POLICY "Allow all operations on pdv_products"
  ON pdv_products FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on pdv_sales"
  ON pdv_sales FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on pdv_sale_items"
  ON pdv_sale_items FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on pdv_settings"
  ON pdv_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- Add foreign key constraints
DO $$
BEGIN
  -- pdv_sales foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pdv_operators') THEN
    ALTER TABLE pdv_sales ADD CONSTRAINT fk_pdv_sales_operator_id 
    FOREIGN KEY (operator_id) REFERENCES pdv_operators(id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pdv_cash_registers') THEN
    ALTER TABLE pdv_sales ADD CONSTRAINT fk_pdv_sales_cash_register_id 
    FOREIGN KEY (cash_register_id) REFERENCES pdv_cash_registers(id);
  END IF;
  
  -- pdv_sale_items foreign keys
  ALTER TABLE pdv_sale_items ADD CONSTRAINT fk_pdv_sale_items_sale_id 
  FOREIGN KEY (sale_id) REFERENCES pdv_sales(id) ON DELETE CASCADE;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pdv_products') THEN
    ALTER TABLE pdv_sale_items ADD CONSTRAINT fk_pdv_sale_items_product_id 
    FOREIGN KEY (product_id) REFERENCES pdv_products(id);
  END IF;
END $$;

-- Add constraints
ALTER TABLE pdv_sales 
ADD CONSTRAINT pdv_sales_payment_type_check 
CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto'));

ALTER TABLE pdv_products 
ADD CONSTRAINT pdv_products_category_check 
CHECK (category IN ('acai', 'bebidas', 'complementos', 'sobremesas', 'outros', 'sorvetes'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pdv_products_category ON pdv_products(category);
CREATE INDEX IF NOT EXISTS idx_pdv_products_active ON pdv_products(is_active);
CREATE INDEX IF NOT EXISTS idx_pdv_products_weighable ON pdv_products(is_weighable);

CREATE INDEX IF NOT EXISTS idx_pdv_sales_operator_id ON pdv_sales(operator_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sales_created_at ON pdv_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_pdv_sales_cancelled ON pdv_sales(is_cancelled);

CREATE INDEX IF NOT EXISTS idx_pdv_sale_items_sale_id ON pdv_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sale_items_product_id ON pdv_sale_items(product_id);

-- Insert default PDV settings
INSERT INTO pdv_settings (id, store_name) VALUES ('loja1', 'Elite Açaí - Loja 1') 
ON CONFLICT (id) DO NOTHING;

-- Insert some sample PDV products
INSERT INTO pdv_products (code, name, category, unit_price, is_active, description) VALUES
('ACAI300', 'Açaí 300ml', 'acai', 13.99, true, 'Açaí tradicional 300ml'),
('ACAI500', 'Açaí 500ml', 'acai', 22.99, true, 'Açaí tradicional 500ml'),
('BEBIDA001', 'Água 500ml', 'bebidas', 3.00, true, 'Água mineral 500ml'),
('BEBIDA002', 'Refrigerante 350ml', 'bebidas', 5.00, true, 'Refrigerante 350ml')
ON CONFLICT (code) DO NOTHING;