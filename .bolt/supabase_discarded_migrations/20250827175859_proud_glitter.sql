/*
  # Create PDV Cash Entries Table

  1. New Tables
     - `pdv_cash_entries`
       - `id` (uuid, primary key)
       - `register_id` (uuid, foreign key to pdv_cash_registers)
       - `type` (text, 'income' or 'expense')
       - `amount` (numeric, transaction amount)
       - `description` (text, transaction description)
       - `payment_method` (text, payment method used)
       - `created_at` (timestamp)
       - `updated_at` (timestamp)

  2. Security
     - Enable RLS on `pdv_cash_entries` table
     - Add policy for public access (demo mode)

  3. Foreign Keys
     - Reference to pdv_cash_registers table

  4. Constraints
     - Check constraint for type field
     - Check constraint for positive amounts

  5. Indexes
     - Index on register_id for queries
     - Index on type for filtering
     - Index on created_at for date ordering
*/

CREATE TABLE IF NOT EXISTS pdv_cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  payment_method text NOT NULL DEFAULT 'dinheiro',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE pdv_cash_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on pdv_cash_entries"
  ON pdv_cash_entries
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add foreign key constraint (only if pdv_cash_registers table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'pdv_cash_registers'
  ) THEN
    ALTER TABLE pdv_cash_entries 
    ADD CONSTRAINT fk_pdv_cash_entries_register_id 
    FOREIGN KEY (register_id) REFERENCES pdv_cash_registers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraints
ALTER TABLE pdv_cash_entries 
ADD CONSTRAINT pdv_cash_entries_type_check 
CHECK (type IN ('income', 'expense'));

ALTER TABLE pdv_cash_entries 
ADD CONSTRAINT pdv_cash_entries_amount_check 
CHECK (amount > 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_register_id ON pdv_cash_entries(register_id);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_type ON pdv_cash_entries(type);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_created_at ON pdv_cash_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_payment_method ON pdv_cash_entries(payment_method);