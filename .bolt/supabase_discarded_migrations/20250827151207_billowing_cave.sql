-- SCRIPT COMPLETO PARA CONFIGURAR BANCO DA NOVA LOJA
-- Execute este script no SQL Editor do Supabase da nova loja

-- ================================================================
-- STEP 1: CREATE ENUM TYPES
-- ================================================================

-- Create enum types
CREATE TYPE IF NOT EXISTS stripe_subscription_status AS ENUM ('active','canceled','incomplete','incomplete_expired','not_started','past_due','paused','trialing','unpaid');
CREATE TYPE IF NOT EXISTS stripe_order_status AS ENUM ('canceled','completed','pending');
CREATE TYPE IF NOT EXISTS table_status AS ENUM ('aguardando_conta','limpeza','livre','ocupada');
CREATE TYPE IF NOT EXISTS table_sale_status AS ENUM ('aberta','cancelada','fechada');
CREATE TYPE IF NOT EXISTS table_payment_type AS ENUM ('cartao_credito','cartao_debito','dinheiro','misto','pix','voucher');
CREATE TYPE IF NOT EXISTS pdv_product_category AS ENUM ('acai','bebidas','complementos','outros','sobremesas','sorvetes');
CREATE TYPE IF NOT EXISTS pdv_payment_type AS ENUM ('cartao_credito','cartao_debito','dinheiro','misto','pix','voucher');
CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('adjustment','purchase','redemption');
CREATE TYPE IF NOT EXISTS product_category AS ENUM ('acai','bebidas','combo','complementos','milkshake','outros','sobremesas','sorvetes','vitamina');
CREATE TYPE IF NOT EXISTS payment_type_enum AS ENUM ('cartao_credito','cartao_debito','dinheiro','pix','voucher');
CREATE TYPE IF NOT EXISTS payment_status_enum AS ENUM ('cancelled','confirmed','pending');

-- ================================================================
-- STEP 2: CREATE CORE TABLES
-- ================================================================

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  password_hash TEXT DEFAULT '',
  last_login TIMESTAMPTZ,
  date_of_birth DATE,
  email TEXT,
  whatsapp_consent BOOLEAN DEFAULT FALSE
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  has_delivery BOOLEAN DEFAULT FALSE,
  has_pos_sales BOOLEAN DEFAULT TRUE,
  is_main_store BOOLEAN DEFAULT FALSE,
  address TEXT,
  phone TEXT
);

-- ================================================================
-- STEP 3: CREATE DELIVERY SYSTEM TABLES
-- ================================================================

-- Delivery neighborhoods
CREATE TABLE IF NOT EXISTS delivery_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0.00,
  delivery_time INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery products
CREATE TABLE IF NOT EXISTS delivery_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category product_category NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_weighable BOOLEAN DEFAULT FALSE,
  price_per_gram NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  has_complements BOOLEAN DEFAULT FALSE,
  complement_groups JSONB,
  sizes JSONB,
  scheduled_days JSONB,
  availability_type TEXT DEFAULT 'always'
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_neighborhood TEXT NOT NULL,
  customer_complement TEXT,
  payment_method TEXT NOT NULL,
  change_for NUMERIC(10,2),
  items JSONB NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  neighborhood_id UUID,
  delivery_fee NUMERIC(10,2) DEFAULT 0.00,
  estimated_delivery_minutes INTEGER DEFAULT 50,
  customer_id UUID,
  channel TEXT DEFAULT 'delivery',
  cash_register_id UUID,
  store_id UUID
);

-- ================================================================
-- STEP 4: CREATE PDV SYSTEM TABLES  
-- ================================================================

-- PDV Operators
CREATE TABLE IF NOT EXISTS pdv_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{
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
    "can_view_cash_register": false
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- PDV Products
CREATE TABLE IF NOT EXISTS pdv_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category pdv_product_category DEFAULT 'outros',
  is_weighable BOOLEAN DEFAULT FALSE,
  unit_price NUMERIC(10,2),
  price_per_gram NUMERIC(10,4),
  image_url TEXT,
  stock_quantity NUMERIC(10,3) DEFAULT 0,
  min_stock NUMERIC(10,3) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  barcode TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INTEGER DEFAULT 1
);

-- PDV Cash Registers
CREATE TABLE IF NOT EXISTS pdv_cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_amount NUMERIC(10,2) NOT NULL,
  closing_amount NUMERIC(10,2),
  difference NUMERIC(10,2),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  operator_id UUID,
  store_id UUID
);

-- PDV Cash Entries
CREATE TABLE IF NOT EXISTS pdv_cash_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  payment_method TEXT DEFAULT 'dinheiro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDV Sales
CREATE TABLE IF NOT EXISTS pdv_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number SERIAL NOT NULL,
  operator_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_type pdv_payment_type NOT NULL,
  payment_details JSONB,
  change_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT DEFAULT 'pdv',
  cash_register_id UUID
);

-- PDV Sale Items
CREATE TABLE IF NOT EXISTS pdv_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID,
  product_id UUID,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,3) DEFAULT 1,
  weight_kg NUMERIC(10,3),
  unit_price NUMERIC(10,2),
  price_per_gram NUMERIC(10,4),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STEP 5: CREATE TABLE SALES SYSTEM
-- ================================================================

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS store1_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  status table_status DEFAULT 'livre',
  current_sale_id UUID,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Sales
CREATE TABLE IF NOT EXISTS store1_table_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL,
  sale_number SERIAL NOT NULL,
  operator_name TEXT,
  customer_name TEXT,
  customer_count INTEGER DEFAULT 1,
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  payment_type table_payment_type,
  change_amount NUMERIC(10,2) DEFAULT 0,
  status table_sale_status DEFAULT 'aberta',
  notes TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cash_register_id UUID
);

-- Table Sale Items
CREATE TABLE IF NOT EXISTS store1_table_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,3) DEFAULT 1,
  weight_kg NUMERIC(10,3),
  unit_price NUMERIC(10,2),
  price_per_gram NUMERIC(10,4),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  weight NUMERIC(10,3)
);

-- ================================================================
-- STEP 6: CREATE SETTINGS AND CONFIGURATION TABLES
-- ================================================================

-- Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT DEFAULT 'Elite Açaí',
  phone TEXT DEFAULT '(85) 98904-1010',
  address TEXT DEFAULT 'Rua das Frutas, 123 - Centro, Fortaleza/CE',
  delivery_fee NUMERIC(10,2) DEFAULT 5.00,
  min_order_value NUMERIC(10,2) DEFAULT 15.00,
  estimated_delivery_time INTEGER DEFAULT 35,
  is_open_now BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cnpj TEXT
);

-- Store Hours
CREATE TABLE IF NOT EXISTS store_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER UNIQUE NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME DEFAULT '08:00:00',
  close_time TIME DEFAULT '22:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDV Settings
CREATE TABLE IF NOT EXISTS pdv_settings (
  id TEXT PRIMARY KEY DEFAULT 'loja1',
  store_name TEXT DEFAULT 'Elite Açaí - Loja 1',
  printer_enabled BOOLEAN DEFAULT TRUE,
  scale_enabled BOOLEAN DEFAULT TRUE,
  auto_print BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  paper_width TEXT DEFAULT '80mm',
  font_size INTEGER DEFAULT 14,
  scale_port TEXT DEFAULT 'COM1',
  scale_baud_rate INTEGER DEFAULT 4800,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STEP 7: CREATE ATTENDANCE AND CHAT SYSTEM
-- ================================================================

-- Attendance Users
CREATE TABLE IF NOT EXISTS attendance_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'attendant' CHECK (role IN ('attendant', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{
    "can_chat": true,
    "can_view_orders": true,
    "can_print_orders": true,
    "can_update_status": true,
    "can_create_manual_orders": false
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'attendant')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read_by_customer BOOLEAN DEFAULT FALSE,
  read_by_attendant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'new_message', 'status_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STEP 8: CREATE CASHBACK SYSTEM
-- ================================================================

-- Transactions table for cashback
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL,
  cashback_amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  receipt_url TEXT,
  store_id UUID,
  location JSONB,
  expires_at TIMESTAMPTZ,
  customer_id UUID,
  comment TEXT,
  attendant_name TEXT
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 10),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash')),
  stripe_session_id TEXT,
  pix_transaction_id TEXT
);

-- ================================================================
-- STEP 9: CREATE CONSTRAINTS AND RELATIONSHIPS
-- ================================================================

-- Add foreign key constraints
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE orders ADD CONSTRAINT orders_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES stores(id);

ALTER TABLE orders ADD CONSTRAINT orders_neighborhood_id_fkey 
  FOREIGN KEY (neighborhood_id) REFERENCES delivery_neighborhoods(id);

ALTER TABLE transactions ADD CONSTRAINT transactions_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE transactions ADD CONSTRAINT transactions_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES stores(id);

ALTER TABLE credits ADD CONSTRAINT credits_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE pdv_cash_entries ADD CONSTRAINT pdv_cash_entries_register_id_fkey 
  FOREIGN KEY (register_id) REFERENCES pdv_cash_registers(id) ON DELETE CASCADE;

ALTER TABLE pdv_cash_registers ADD CONSTRAINT pdv_cash_registers_operator_id_fkey 
  FOREIGN KEY (operator_id) REFERENCES pdv_operators(id);

ALTER TABLE pdv_cash_registers ADD CONSTRAINT pdv_cash_registers_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES stores(id);

ALTER TABLE pdv_sales ADD CONSTRAINT pdv_sales_operator_id_fkey 
  FOREIGN KEY (operator_id) REFERENCES pdv_operators(id);

ALTER TABLE pdv_sales ADD CONSTRAINT pdv_sales_cash_register_id_fkey 
  FOREIGN KEY (cash_register_id) REFERENCES pdv_cash_registers(id) ON DELETE SET NULL;

ALTER TABLE pdv_sale_items ADD CONSTRAINT pdv_sale_items_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES pdv_sales(id) ON DELETE CASCADE;

ALTER TABLE pdv_sale_items ADD CONSTRAINT pdv_sale_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES pdv_products(id);

ALTER TABLE store1_tables ADD CONSTRAINT store1_tables_current_sale_id_fkey 
  FOREIGN KEY (current_sale_id) REFERENCES store1_table_sales(id) ON DELETE SET NULL;

ALTER TABLE store1_table_sales ADD CONSTRAINT store1_table_sales_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES store1_tables(id);

ALTER TABLE store1_table_sales ADD CONSTRAINT store1_table_sales_cash_register_id_fkey 
  FOREIGN KEY (cash_register_id) REFERENCES pdv_cash_registers(id) ON DELETE SET NULL;

ALTER TABLE store1_table_sale_items ADD CONSTRAINT store1_table_sale_items_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES store1_table_sales(id) ON DELETE CASCADE;

ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT notifications_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- ================================================================
-- STEP 10: ENABLE ROW LEVEL SECURITY
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_settings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 11: CREATE RLS POLICIES
-- ================================================================

-- Public access policies for core functionality
CREATE POLICY "Enable public access" ON customers FOR ALL USING (true);
CREATE POLICY "Enable public access" ON stores FOR ALL USING (true);
CREATE POLICY "Enable public access" ON delivery_neighborhoods FOR ALL USING (true);
CREATE POLICY "Enable public access" ON delivery_products FOR ALL USING (true);
CREATE POLICY "Enable public access" ON orders FOR ALL USING (true);
CREATE POLICY "Enable public access" ON transactions FOR ALL USING (true);
CREATE POLICY "Enable public access" ON credits FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_operators FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_products FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_cash_registers FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_cash_entries FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_sales FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_sale_items FOR ALL USING (true);
CREATE POLICY "Enable public access" ON store1_tables FOR ALL USING (true);
CREATE POLICY "Enable public access" ON store1_table_sales FOR ALL USING (true);
CREATE POLICY "Enable public access" ON store1_table_sale_items FOR ALL USING (true);
CREATE POLICY "Enable public access" ON attendance_users FOR ALL USING (true);
CREATE POLICY "Enable public access" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Enable public access" ON notifications FOR ALL USING (true);
CREATE POLICY "Enable public access" ON store_settings FOR ALL USING (true);
CREATE POLICY "Enable public access" ON store_hours FOR ALL USING (true);
CREATE POLICY "Enable public access" ON pdv_settings FOR ALL USING (true);

-- ================================================================
-- STEP 12: INSERT DEFAULT DATA
-- ================================================================

-- Insert default admin operator
INSERT INTO pdv_operators (id, name, code, password_hash, is_active, permissions) VALUES
('admin-default', 'Administrador', 'ADMIN', 'elite2024', true, '{
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
  "can_view_cash_register": true
}'::JSONB)
ON CONFLICT (code) DO NOTHING;

-- Insert default store
INSERT INTO stores (id, name, code, password_hash, is_active, has_delivery, has_pos_sales, is_main_store, address, phone) VALUES
('store-main', 'Nova Loja Elite Açaí', 'NOVA_LOJA', 'elite2024', true, true, true, true, 'Endereço da Nova Loja', '(85) 99999-9999')
ON CONFLICT (code) DO NOTHING;

-- Insert default store settings
INSERT INTO store_settings (id, store_name, phone, address, cnpj) VALUES
('default', 'Nova Loja Elite Açaí', '(85) 99999-9999', 'Endereço da Nova Loja', '99.999.999/0001-99')
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  cnpj = EXCLUDED.cnpj;

-- Insert default store hours
INSERT INTO store_hours (day_of_week, is_open, open_time, close_time) VALUES
(0, true, '10:00', '20:00'), -- Domingo
(1, true, '08:00', '22:00'), -- Segunda
(2, true, '08:00', '22:00'), -- Terça
(3, true, '08:00', '22:00'), -- Quarta
(4, true, '08:00', '22:00'), -- Quinta
(5, true, '08:00', '22:00'), -- Sexta
(6, true, '08:00', '23:00')  -- Sábado
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert default attendance user
INSERT INTO attendance_users (username, password_hash, name, role, permissions) VALUES
('admin', 'elite2024', 'Administrador', 'admin', '{
  "can_chat": true,
  "can_view_orders": true,
  "can_print_orders": true,
  "can_update_status": true,
  "can_create_manual_orders": true
}'::JSONB)
ON CONFLICT (username) DO NOTHING;

-- Insert sample neighborhoods
INSERT INTO delivery_neighborhoods (name, delivery_fee, delivery_time, is_active) VALUES
('Centro', 5.00, 35, true),
('Aldeota', 7.00, 45, true),
('Meireles', 8.00, 50, true),
('Cocó', 6.00, 40, true)
ON CONFLICT DO NOTHING;

-- Insert sample tables
INSERT INTO store1_tables (number, name, capacity) VALUES
(1, 'Mesa 1', 4),
(2, 'Mesa 2', 4),
(3, 'Mesa 3', 6),
(4, 'Mesa 4', 2)
ON CONFLICT (number) DO NOTHING;

-- Insert sample products
INSERT INTO delivery_products (name, category, price, description, is_active, availability_type) VALUES
('Açaí 300g', 'acai', 13.99, 'Açaí tradicional 300g com complementos', true, 'always'),
('Açaí 500g', 'acai', 22.99, 'Açaí tradicional 500g com complementos', true, 'always'),
('Açaí 700g', 'acai', 31.99, 'Açaí tradicional 700g com complementos', true, 'always'),
('Milkshake 400ml', 'milkshake', 11.99, 'Milkshake cremoso 400ml', true, 'always'),
('Vitamina de Açaí 500ml', 'vitamina', 15.00, 'Vitamina natural de açaí', true, 'always')
ON CONFLICT DO NOTHING;

INSERT INTO pdv_products (code, name, category, unit_price, is_active) VALUES
('ACAI300', 'Açaí 300g', 'acai', 13.99, true),
('ACAI500', 'Açaí 500g', 'acai', 22.99, true),
('ACAI700', 'Açaí 700g', 'acai', 31.99, true),
('MILK400', 'Milkshake 400ml', 'bebidas', 11.99, true),
('VITA500', 'Vitamina Açaí 500ml', 'bebidas', 15.00, true)
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

SELECT 'Banco de dados configurado com sucesso para a nova loja!' as message;