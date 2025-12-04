/*
  # Add mixed_payment_details column to orders table

  ## Changes
  - Add `mixed_payment_details` column to orders table to store payment breakdown for mixed payments
  - Column type: text (stores JSON string)
  - Column is nullable (only used when payment_method is 'mixed')

  ## Notes
  - Used to store detailed breakdown of mixed payment methods
  - Format: JSON array with method, method_display, and amount for each payment
  - Example: [{"method":"money","method_display":"Dinheiro","amount":50},{"method":"card","method_display":"Cartão de Crédito","amount":30}]
*/

-- Add mixed_payment_details column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS mixed_payment_details text;

-- Add comment explaining the column
COMMENT ON COLUMN orders.mixed_payment_details IS 'JSON string containing breakdown of mixed payment methods. Format: [{"method":"money","method_display":"Dinheiro","amount":50}]';