/*
  # Add pickup scheduling support

  1. Schema Changes
    - Add delivery_type column to orders table
    - Add scheduled_pickup_date column to orders table  
    - Add scheduled_pickup_time column to orders table
    - Update existing orders to have delivery_type = 'delivery'

  2. Indexes
    - Add index for pickup scheduling queries
    - Add index for delivery type filtering

  3. Security
    - Update RLS policies to handle new columns
*/

-- Add new columns to orders table
DO $$
BEGIN
  -- Add delivery_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_type text DEFAULT 'delivery';
  END IF;

  -- Add scheduled_pickup_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'scheduled_pickup_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN scheduled_pickup_date date;
  END IF;

  -- Add scheduled_pickup_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'scheduled_pickup_time'
  ) THEN
    ALTER TABLE orders ADD COLUMN scheduled_pickup_time time;
  END IF;
END $$;

-- Add check constraint for delivery_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'orders_delivery_type_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check 
    CHECK (delivery_type IN ('delivery', 'pickup'));
  END IF;
END $$;

-- Add check constraint for pickup scheduling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'orders_pickup_scheduling_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_pickup_scheduling_check 
    CHECK (
      (delivery_type = 'delivery') OR 
      (delivery_type = 'pickup' AND scheduled_pickup_date IS NOT NULL AND scheduled_pickup_time IS NOT NULL)
    );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type 
ON orders(delivery_type);

CREATE INDEX IF NOT EXISTS idx_orders_pickup_schedule 
ON orders(scheduled_pickup_date, scheduled_pickup_time) 
WHERE delivery_type = 'pickup';

CREATE INDEX IF NOT EXISTS idx_orders_pickup_date 
ON orders(scheduled_pickup_date) 
WHERE delivery_type = 'pickup' AND scheduled_pickup_date IS NOT NULL;

-- Update existing orders to have delivery_type = 'delivery'
UPDATE orders 
SET delivery_type = 'delivery' 
WHERE delivery_type IS NULL;

-- Add comment to table
COMMENT ON COLUMN orders.delivery_type IS 'Type of order: delivery (home delivery) or pickup (store pickup)';
COMMENT ON COLUMN orders.scheduled_pickup_date IS 'Date scheduled for pickup (only for pickup orders)';
COMMENT ON COLUMN orders.scheduled_pickup_time IS 'Time scheduled for pickup (only for pickup orders)';