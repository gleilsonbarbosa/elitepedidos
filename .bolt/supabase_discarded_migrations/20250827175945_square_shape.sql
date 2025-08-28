/*
  # Create Support Tables for Complete System

  1. New Tables
     - `customers` - Customer information for cashback system
     - `cashback_transactions` - Cashback transaction records
     - `attendance_users` - Users for attendance system
     - `store1_tables` - Restaurant tables for store 1
     - `store1_table_sales` - Table sales for store 1
     - `store1_table_sale_items` - Items in table sales

  2. Security
     - Enable RLS on all tables
     - Add policies for public access (demo mode)

  3. Relationships
     - Proper foreign keys between related tables
*/

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text UNIQUE NOT NULL,
  email text,
  date_of_birth date,
  whatsapp_consent boolean DEFAULT true,
  balance numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Cashback Transactions Table
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  cashback_amount numeric(10,2) NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'approved',
  comment text,
  order_id uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendance Users Table
CREATE TABLE IF NOT EXISTS attendance_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'attendant',
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '{
    "can_chat": true,
    "can_view_orders": true,
    "can_print_orders": true,
    "can_update_status": true,
    "can_create_manual_orders": true,
    "can_view_cash_register": false,
    "can_view_sales": false,
    "can_view_reports": false,
    "can_view_cash_report": false,
    "can_view_sales_report": false,
    "can_manage_products": false,
    "can_view_operators": false,
    "can_view_attendance": false,
    "can_manage_settings": false,
    "can_use_scale": false,
    "can_discount": false,
    "can_cancel": false,
    "can_view_expected_balance": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Store 1 Tables
CREATE TABLE IF NOT EXISTS store1_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL,
  name text NOT NULL,
  capacity integer DEFAULT 4,
  status text DEFAULT 'livre',
  current_sale_id uuid,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Store 1 Table Sales
CREATE TABLE IF NOT EXISTS store1_table_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL,
  sale_number serial,
  operator_name text,
  customer_name text,
  customer_count integer DEFAULT 1,
  subtotal numeric(10,2) DEFAULT 0.00,
  discount_amount numeric(10,2) DEFAULT 0.00,
  total_amount numeric(10,2) DEFAULT 0.00,
  payment_type text,
  change_amount numeric(10,2) DEFAULT 0.00,
  status text DEFAULT 'aberta',
  cash_register_id uuid,
  notes text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Store 1 Table Sale Items
CREATE TABLE IF NOT EXISTS store1_table_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity integer DEFAULT 1,
  weight_kg numeric(10,3),
  unit_price numeric(10,2),
  price_per_gram numeric(10,4),
  discount_amount numeric(10,2) DEFAULT 0.00,
  subtotal numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations
CREATE POLICY "Allow all operations on customers"
  ON customers FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on cashback_transactions"
  ON cashback_transactions FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance_users"
  ON attendance_users FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on store1_tables"
  ON store1_tables FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on store1_table_sales"
  ON store1_table_sales FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on store1_table_sale_items"
  ON store1_table_sale_items FOR ALL TO public USING (true) WITH CHECK (true);

-- Add constraints
ALTER TABLE cashback_transactions 
ADD CONSTRAINT cashback_transactions_type_check 
CHECK (type IN ('purchase', 'redemption', 'adjustment'));

ALTER TABLE cashback_transactions 
ADD CONSTRAINT cashback_transactions_status_check 
CHECK (status IN ('approved', 'pending', 'rejected', 'used'));

ALTER TABLE attendance_users 
ADD CONSTRAINT attendance_users_role_check 
CHECK (role IN ('attendant', 'admin'));

ALTER TABLE store1_tables 
ADD CONSTRAINT store1_tables_status_check 
CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza'));

ALTER TABLE store1_table_sales 
ADD CONSTRAINT store1_table_sales_status_check 
CHECK (status IN ('aberta', 'fechada', 'cancelada'));

-- Add foreign key constraints
ALTER TABLE cashback_transactions 
ADD CONSTRAINT fk_cashback_transactions_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE store1_table_sales 
ADD CONSTRAINT fk_store1_table_sales_table_id 
FOREIGN KEY (table_id) REFERENCES store1_tables(id);

ALTER TABLE store1_table_sale_items 
ADD CONSTRAINT fk_store1_table_sale_items_sale_id 
FOREIGN KEY (sale_id) REFERENCES store1_table_sales(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_customer_id ON cashback_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_users_username ON attendance_users(username);
CREATE INDEX IF NOT EXISTS idx_store1_tables_status ON store1_tables(status);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_table_id ON store1_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store1_table_sale_items_sale_id ON store1_table_sale_items(sale_id);

-- Insert default attendance user
INSERT INTO attendance_users (username, password_hash, name, role, is_active, permissions) VALUES (
  'admin',
  'elite2024',
  'Administrador',
  'admin',
  true,
  '{
    "can_chat": true,
    "can_view_orders": true,
    "can_print_orders": true,
    "can_update_status": true,
    "can_create_manual_orders": true,
    "can_view_cash_register": true,
    "can_view_sales": true,
    "can_view_reports": true,
    "can_view_cash_report": true,
    "can_view_sales_report": true,
    "can_manage_products": true,
    "can_view_operators": true,
    "can_view_attendance": true,
    "can_manage_settings": true,
    "can_use_scale": true,
    "can_discount": true,
    "can_cancel": true,
    "can_view_expected_balance": true
  }'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- Insert default tables for store 1
INSERT INTO store1_tables (number, name, capacity, status) VALUES
(1, 'Mesa 1', 4, 'livre'),
(2, 'Mesa 2', 4, 'livre'),
(3, 'Mesa 3', 6, 'livre'),
(4, 'Mesa 4', 2, 'livre')
ON CONFLICT (number) DO NOTHING;

-- Insert default PDV settings
INSERT INTO pdv_settings (id, store_name) VALUES ('loja1', 'Elite Açaí - Loja 1') 
ON CONFLICT (id) DO NOTHING;