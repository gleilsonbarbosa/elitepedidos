/*
  # Adicionar logs detalhados para debug de estorno de caixa

  ## Problema
  - Difícil entender se o estorno está funcionando corretamente
  - Precisamos de mais logs para debug

  ## Solução
  - Adicionar logs detalhados nas funções de estorno
  - Mostrar exatamente o que está sendo estornado e por quê
*/

-- Function to reverse cash entry when order is cancelled (with detailed logging)
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_order_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  order_ref text;
  cash_amount numeric;
BEGIN
  -- Only act when status changes to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    RAISE NOTICE '🚫 PEDIDO CANCELADO DETECTADO - ID: %, Método: %, Total: R$ %', 
      NEW.id, NEW.payment_method, NEW.total_price;
    
    -- Build order reference pattern
    order_ref := 'Delivery #' || substring(NEW.id::text, 1, 8);
    
    -- Determine cash amount based on payment method
    IF NEW.payment_method = 'Dinheiro' THEN
      cash_amount := NEW.total_price;
      RAISE NOTICE '💵 Pagamento em DINHEIRO - Valor a estornar: R$ %', cash_amount;
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
      RAISE NOTICE '💳💵 Pagamento MISTO - Parte em dinheiro: R$ %', cash_amount;
    ELSE
      -- No cash to reverse for card/pix payments
      cash_amount := 0;
      RAISE NOTICE '�� Pagamento NÃO-DINHEIRO (%) - SEM ESTORNO', NEW.payment_method;
    END IF;
    
    -- Only proceed if there's cash to reverse
    IF cash_amount > 0 THEN
      
      RAISE NOTICE '🔍 Buscando entrada de caixa com padrão: %', order_ref;
      
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
        RAISE NOTICE '✅ ENTRADA ENCONTRADA - Registro: %, Valor original: R$ %', 
          cash_entry_record.register_id, cash_entry_record.amount;
        
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
        
        RAISE NOTICE '💰 ESTORNO CRIADO - R$ % estornado do caixa %', 
          cash_amount, cash_entry_record.register_id;
      ELSE
        RAISE WARNING '⚠️ ENTRADA NÃO ENCONTRADA - Padrão: %, método: dinheiro', order_ref;
      END IF;
    ELSE
      RAISE NOTICE 'ℹ️ Nenhum valor em dinheiro para estornar';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reverse cash entry when PDV sale is cancelled (with detailed logging)
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_pdv_sale_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  sale_ref text;
  cash_amount numeric;
BEGIN
  -- Only act when is_cancelled changes to true
  IF NEW.is_cancelled = true AND (OLD.is_cancelled = false OR OLD.is_cancelled IS NULL) THEN
    
    RAISE NOTICE '🚫 VENDA PDV CANCELADA - #%, Tipo: %, Total: R$ %', 
      NEW.sale_number, NEW.payment_type, NEW.total_amount;
    
    -- Build sale reference pattern
    sale_ref := 'Venda #' || NEW.sale_number;
    
    -- Determine cash amount based on payment type
    IF NEW.payment_type = 'dinheiro' THEN
      cash_amount := NEW.total_amount;
      RAISE NOTICE '💵 Pagamento em DINHEIRO - Valor a estornar: R$ %', cash_amount;
    ELSIF NEW.payment_type = 'misto' THEN
      -- Extract cash amount from payment_details JSON
      cash_amount := COALESCE(
        (
          SELECT SUM((detail->>'amount')::numeric)
          FROM jsonb_array_elements(NEW.payment_details) AS detail
          WHERE detail->>'method' = 'dinheiro'
        ),
        0
      );
      RAISE NOTICE '💳💵 Pagamento MISTO - Parte em dinheiro: R$ %', cash_amount;
    ELSE
      -- No cash to reverse for card/pix/voucher payments
      cash_amount := 0;
      RAISE NOTICE '💳 Pagamento NÃO-DINHEIRO (%) - SEM ESTORNO', NEW.payment_type;
    END IF;
    
    -- Only proceed if there's cash to reverse
    IF cash_amount > 0 AND NEW.cash_register_id IS NOT NULL THEN
      
      RAISE NOTICE '🔍 Buscando entrada de caixa com padrão: %', sale_ref;
      
      -- Find the cash entry for this sale
      SELECT * INTO cash_entry_record
      FROM pdv_cash_entries
      WHERE description LIKE sale_ref || '%'
        AND type = 'income'
        AND register_id = NEW.cash_register_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      -- If found, create a reversal entry
      IF FOUND THEN
        RAISE NOTICE '✅ ENTRADA ENCONTRADA - Registro: %, Valor original: R$ %', 
          cash_entry_record.register_id, cash_entry_record.amount;
        
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
          'Estorno: ' || cash_entry_record.description || ' (venda cancelada)',
          'dinheiro',
          NOW()
        );
        
        RAISE NOTICE '💰 ESTORNO CRIADO - R$ % estornado do caixa %', 
          cash_amount, cash_entry_record.register_id;
      ELSE
        RAISE WARNING '⚠️ ENTRADA NÃO ENCONTRADA - Padrão: %', sale_ref;
      END IF;
    ELSE
      IF cash_amount = 0 THEN
        RAISE NOTICE 'ℹ️ Nenhum valor em dinheiro para estornar';
      ELSE
        RAISE WARNING '⚠️ cash_register_id não definido - não é possível estornar';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
DROP TRIGGER IF EXISTS trg_reverse_cash_on_order_cancel ON orders;
CREATE TRIGGER trg_reverse_cash_on_order_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_order_cancel();

DROP TRIGGER IF EXISTS trg_reverse_cash_on_pdv_sale_cancel ON pdv_sales;
CREATE TRIGGER trg_reverse_cash_on_pdv_sale_cancel
  AFTER UPDATE ON pdv_sales
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_pdv_sale_cancel();
