/*
  # Create PDV Cash Registers Table

  1. New Tables
     - `pdv_cash_registers`
       - `id` (uuid, primary key)
       - `opening_amount` (numeric, initial cash amount)
       - `closing_amount` (numeric, nullable, final cash amount)
       - `difference` (numeric, nullable, difference between expected and actual)
       - `opened_at` (timestamp, when register was opened)
       - `closed_at` (timestamp, nullable, when register was closed)
       - `operator_id` (uuid, foreign key to pdv_operators)
       - `store_id` (text, store identifier)
       - `created_at` (timestamp)
       - `updated_at` (timestamp)

  2. Security
     - Enable RLS on `pdv_cash_registers` table
     - Add policy for public access (demo mode)

  3. Foreign Keys
     - Reference to pdv_operators table

  4. Indexes
     - Index on operator_id for queries
     - Index on opened_at for date filtering
     - Index on store_id for multi-store support
*/

CREATE TABLE IF NOT EXISTS pdv_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  closing_amount numeric(10,2),
  difference numeric(10,2),
  opened_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz,
  operator_id uuid,
  store_id text DEFAULT 'loja1',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE pdv_cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on pdv_cash_registers"
  ON pdv_cash_registers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add foreign key constraint (only if pdv_operators table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'pdv_operators'
  ) THEN
    ALTER TABLE pdv_cash_registers 
    ADD CONSTRAINT fk_pdv_cash_registers_operator_id 
    FOREIGN KEY (operator_id) REFERENCES pdv_operators(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_operator_id ON pdv_cash_registers(operator_id);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_opened_at ON pdv_cash_registers(opened_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_store_id ON pdv_cash_registers(store_id);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_closed_at ON pdv_cash_registers(closed_at);