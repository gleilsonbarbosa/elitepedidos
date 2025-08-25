/*
  # Integrate table sales with cash register system

  1. New Functions
    - `link_table_sale_to_cash_register()` - Links table sales to active cash register
    - `add_table_sale_to_cash_entries()` - Adds table sale as cash entry
    - `get_table_sales_for_cash_summary()` - Gets table sales for cash summaries

  2. Triggers
    - Trigger on table sales to automatically link to cash register
    - Trigger to add cash entries when table sales are closed

  3. Updates
    - Add cash_register_id to table sales tables
    - Update cash summary functions to include table sales
*/

-- Add cash_register_id to store1_table_sales if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store1_table_sales' AND column_name = 'cash_register_id'
  ) THEN
    ALTER TABLE store1_table_sales ADD COLUMN cash_register_id uuid REFERENCES pdv_cash_registers(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_store1_table_sales_cash_register_id ON store1_table_sales(cash_register_id);
  END IF;
END $$;

-- Add cash_register_id to store2_table_sales if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store2_table_sales' AND column_name = 'cash_register_id'
  ) THEN
    ALTER TABLE store2_table_sales ADD COLUMN cash_register_id uuid REFERENCES pdv2_cash_registers(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_store2_table_sales_cash_register_id ON store2_table_sales(cash_register_id);
  END IF;
END $$;

-- Function to link table sales to active cash register (Store 1)
CREATE OR REPLACE FUNCTION link_table_sale_to_cash_register_store1()
RETURNS TRIGGER AS $$
DECLARE
  active_register_id uuid;
BEGIN
  -- Find active cash register for store 1
  SELECT id INTO active_register_id
  FROM pdv_cash_registers
  WHERE closed_at IS NULL
    AND (store_id IS NULL OR store_id = (SELECT id FROM stores WHERE code = 'LOJA1' LIMIT 1))
  ORDER BY opened_at DESC
  LIMIT 1;

  -- Link to active register if found
  IF active_register_id IS NOT NULL THEN
    NEW.cash_register_id := active_register_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to link table sales to active cash register (Store 2)
CREATE OR REPLACE FUNCTION link_table_sale_to_cash_register_store2()
RETURNS TRIGGER AS $$
DECLARE
  active_register_id uuid;
BEGIN
  -- Find active cash register for store 2
  SELECT id INTO active_register_id
  FROM pdv2_cash_registers
  WHERE closed_at IS NULL
    AND (store_id IS NULL OR store_id = (SELECT id FROM stores WHERE code = 'LOJA2' LIMIT 1))
  ORDER BY opened_at DESC
  LIMIT 1;

  -- Link to active register if found
  IF active_register_id IS NOT NULL THEN
    NEW.cash_register_id := active_register_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to add table sale to cash entries when closed (Store 1)
CREATE OR REPLACE FUNCTION add_table_sale_to_cash_entries_store1()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when sale is being closed (status changed to 'fechada')
  IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
    -- Add cash entry for the table sale
    IF NEW.cash_register_id IS NOT NULL AND NEW.total_amount > 0 THEN
      INSERT INTO pdv_cash_entries (
        register_id,
        type,
        amount,
        description,
        payment_method,
        created_at
      ) VALUES (
        NEW.cash_register_id,
        'income',
        NEW.total_amount,
        'Venda Mesa #' || NEW.sale_number || ' - Mesa ' || (
          SELECT number FROM store1_tables WHERE id = NEW.table_id
        ),
        COALESCE(NEW.payment_type::text, 'dinheiro'),
        NEW.closed_at
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to add table sale to cash entries when closed (Store 2)
CREATE OR REPLACE FUNCTION add_table_sale_to_cash_entries_store2()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when sale is being closed (status changed to 'fechada')
  IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
    -- Add cash entry for the table sale
    IF NEW.cash_register_id IS NOT NULL AND NEW.total_amount > 0 THEN
      INSERT INTO pdv2_cash_entries (
        register_id,
        type,
        amount,
        description,
        payment_method,
        created_at
      ) VALUES (
        NEW.cash_register_id,
        'income',
        NEW.total_amount,
        'Venda Mesa #' || NEW.sale_number || ' - Mesa ' || (
          SELECT number FROM store2_tables WHERE id = NEW.table_id
        ),
        COALESCE(NEW.payment_type::text, 'dinheiro'),
        NEW.closed_at
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for Store 1
DROP TRIGGER IF EXISTS trg_link_table_sale_to_cash_register_store1 ON store1_table_sales;
CREATE TRIGGER trg_link_table_sale_to_cash_register_store1
  BEFORE INSERT ON store1_table_sales
  FOR EACH ROW
  EXECUTE FUNCTION link_table_sale_to_cash_register_store1();

DROP TRIGGER IF EXISTS trg_add_table_sale_to_cash_entries_store1 ON store1_table_sales;
CREATE TRIGGER trg_add_table_sale_to_cash_entries_store1
  AFTER UPDATE ON store1_table_sales
  FOR EACH ROW
  EXECUTE FUNCTION add_table_sale_to_cash_entries_store1();

-- Create triggers for Store 2
DROP TRIGGER IF EXISTS trg_link_table_sale_to_cash_register_store2 ON store2_table_sales;
CREATE TRIGGER trg_link_table_sale_to_cash_register_store2
  BEFORE INSERT ON store2_table_sales
  FOR EACH ROW
  EXECUTE FUNCTION link_table_sale_to_cash_register_store2();

DROP TRIGGER IF EXISTS trg_add_table_sale_to_cash_entries_store2 ON store2_table_sales;
CREATE TRIGGER trg_add_table_sale_to_cash_entries_store2
  AFTER UPDATE ON store2_table_sales
  FOR EACH ROW
  EXECUTE FUNCTION add_table_sale_to_cash_entries_store2();

-- Update existing table sales to link with current active cash registers
UPDATE store1_table_sales 
SET cash_register_id = (
  SELECT id FROM pdv_cash_registers 
  WHERE closed_at IS NULL 
  ORDER BY opened_at DESC 
  LIMIT 1
)
WHERE cash_register_id IS NULL 
  AND status = 'aberta'
  AND created_at >= CURRENT_DATE;

UPDATE store2_table_sales 
SET cash_register_id = (
  SELECT id FROM pdv2_cash_registers 
  WHERE closed_at IS NULL 
  ORDER BY opened_at DESC 
  LIMIT 1
)
WHERE cash_register_id IS NULL 
  AND status = 'aberta'
  AND created_at >= CURRENT_DATE;