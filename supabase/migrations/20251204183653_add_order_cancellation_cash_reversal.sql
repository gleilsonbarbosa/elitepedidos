/*
  # Estornar valor do caixa quando pedido é cancelado

  ## Problema
  - Quando um pedido é cancelado, o valor em dinheiro permanece no caixa
  - Isso causa diferença no fechamento do caixa

  ## Solução
  - Criar trigger que detecta cancelamento de pedidos
  - Buscar entrada de caixa relacionada ao pedido
  - Criar entrada de saída (expense) para estornar o valor
*/

-- Function to reverse cash entry when order is cancelled
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_order_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  order_ref text;
BEGIN
  -- Only act when status changes to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- Build order reference pattern
    order_ref := 'Delivery #' || substring(NEW.id::text, 1, 8);
    
    -- Find the cash entry for this order
    SELECT * INTO cash_entry_record
    FROM pdv_cash_entries
    WHERE description LIKE order_ref || '%'
      AND type = 'income'
      AND register_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If found, create a reversal entry
    IF FOUND THEN
      INSERT INTO pdv_cash_entries (
        register_id,
        type,
        amount,
        description,
        payment_method,
        created_at
      ) VALUES (
        cash_entry_record.register_id,
        'expense',
        cash_entry_record.amount,
        'Estorno: ' || cash_entry_record.description || ' (pedido cancelado)',
        cash_entry_record.payment_method,
        NOW()
      );
      
      RAISE NOTICE 'Estornado R$ % do caixa para pedido cancelado %', cash_entry_record.amount, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order cancellation
DROP TRIGGER IF EXISTS trg_reverse_cash_on_order_cancel ON orders;
CREATE TRIGGER trg_reverse_cash_on_order_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_order_cancel();

-- Add comment
COMMENT ON FUNCTION reverse_cash_entry_on_order_cancel() IS 'Estorna automaticamente valores do caixa quando um pedido é cancelado';