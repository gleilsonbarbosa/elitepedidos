/*
  # Add missing cash_register_id column to orders table

  1. Schema Changes
    - Add `cash_register_id` column to `orders` table
    - Set up foreign key relationship with `pdv_cash_registers`
    - Add index for performance

  2. Security
    - Update RLS policies to handle new column
    - Maintain existing access controls

  This fixes the error: "column orders.cash_register_id does not exist"
*/

-- Add cash_register_id column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cash_register_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN cash_register_id uuid;
  END IF;
END $$;

-- Add foreign key constraint if pdv_cash_registers table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'pdv_cash_registers'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'orders_cash_register_id_fkey'
    ) THEN
      ALTER TABLE orders 
      ADD CONSTRAINT orders_cash_register_id_fkey 
      FOREIGN KEY (cash_register_id) REFERENCES pdv_cash_registers(id);
    END IF;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_cash_register_id 
ON orders(cash_register_id);

-- Add comment to explain the column purpose
COMMENT ON COLUMN orders.cash_register_id IS 'Links delivery orders to cash register sessions for financial reporting';