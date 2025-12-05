/*
  # Corrigir estorno de delivery para apenas pagamentos em dinheiro

  ## Problema
  - O trigger de estorno de delivery estava estornando qualquer pedido cancelado
  - Isso incluía pagamentos em cartão, PIX, etc que não afetam o caixa físico
  - Resultado: saldo esperado ficava errado

  ## Solução
  - Modificar o trigger para verificar a forma de pagamento
  - Só estornar quando o pagamento foi em dinheiro
  - Para pagamentos mistos, estornar apenas a parte em dinheiro
*/

-- Function to reverse cash entry when order is cancelled (ONLY CASH PAYMENTS)
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_order_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  order_ref text;
  cash_amount numeric;
BEGIN
  -- Only act when status changes to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- Build order reference pattern
    order_ref := 'Delivery #' || substring(NEW.id::text, 1, 8);
    
    -- Determine cash amount based on payment method
    IF NEW.payment_method = 'Dinheiro' THEN
      cash_amount := NEW.total_price;
    ELSIF NEW.payment_method = 'Misto' AND NEW.mixed_payment_details IS NOT NULL THEN
      -- Extract cash amount from mixed_payment_details JSON
      cash_amount := COALESCE(
        (
          SELECT SUM((detail->>'amount')::numeric)
          FROM jsonb_array_elements(NEW.mixed_payment_details) AS detail
          WHERE detail->>'method' = 'Dinheiro'
        ),
        0
      );
    ELSE
      -- No cash to reverse for card/pix payments
      cash_amount := 0;
    END IF;
    
    -- Only proceed if there's cash to reverse
    IF cash_amount > 0 THEN
      
      -- Find the cash entry for this order (only cash payments)
      SELECT * INTO cash_entry_record
      FROM pdv_cash_entries
      WHERE description LIKE order_ref || '%'
        AND type = 'income'
        AND payment_method = 'dinheiro'
        AND register_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1;
      
      -- If found, create a reversal entry with the exact cash amount
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
          cash_amount,
          'Estorno: ' || cash_entry_record.description || ' (pedido cancelado)',
          'dinheiro',
          NOW()
        );
        
        RAISE NOTICE 'Estornado R$ % em dinheiro do caixa para pedido cancelado %', cash_amount, NEW.id;
      END IF;
    ELSE
      RAISE NOTICE 'Pedido cancelado % não tinha pagamento em dinheiro - sem estorno necessário', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for order cancellation
DROP TRIGGER IF EXISTS trg_reverse_cash_on_order_cancel ON orders;
CREATE TRIGGER trg_reverse_cash_on_order_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_order_cancel();

-- Update comment
COMMENT ON FUNCTION reverse_cash_entry_on_order_cancel() IS 'Estorna automaticamente valores em dinheiro do caixa quando um pedido é cancelado (apenas pagamentos em dinheiro)';
