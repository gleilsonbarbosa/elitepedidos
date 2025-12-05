/*
  # Adicionar trigger de estorno para Loja 2

  ## Problema
  - Vendas da Loja 2 não têm trigger de estorno
  - Apenas PDV principal e delivery tinham estorno

  ## Solução
  - Criar trigger específico para store2_sales
  - Estornar apenas pagamentos em dinheiro
*/

-- Function to reverse cash entry when Store 2 sale is cancelled
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_store2_sale_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  sale_ref text;
  cash_amount numeric;
BEGIN
  -- Only act when is_cancelled changes to true
  IF NEW.is_cancelled = true AND (OLD.is_cancelled = false OR OLD.is_cancelled IS NULL) THEN
    
    RAISE NOTICE '🚫 VENDA LOJA 2 CANCELADA - #%, Tipo: %, Total: R$ %', 
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
      
      RAISE NOTICE '🔍 Buscando entrada de caixa Loja 2 com padrão: %', sale_ref;
      
      -- Find the cash entry for this sale in pdv2_cash_entries
      SELECT * INTO cash_entry_record
      FROM pdv2_cash_entries
      WHERE description LIKE sale_ref || '%'
        AND type = 'income'
        AND register_id = NEW.cash_register_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      -- If found, create a reversal entry
      IF FOUND THEN
        RAISE NOTICE '✅ ENTRADA LOJA 2 ENCONTRADA - Registro: %, Valor original: R$ %', 
          cash_entry_record.register_id, cash_entry_record.amount;
        
        INSERT INTO pdv2_cash_entries (
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
        
        RAISE NOTICE '💰 ESTORNO LOJA 2 CRIADO - R$ % estornado do caixa %', 
          cash_amount, cash_entry_record.register_id;
      ELSE
        RAISE WARNING '⚠️ ENTRADA LOJA 2 NÃO ENCONTRADA - Padrão: %', sale_ref;
      END IF;
    ELSE
      IF cash_amount = 0 THEN
        RAISE NOTICE 'ℹ️ Nenhum valor em dinheiro para estornar (Loja 2)';
      ELSE
        RAISE WARNING '⚠️ cash_register_id não definido - não é possível estornar (Loja 2)';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Store 2 sale cancellation
DROP TRIGGER IF EXISTS trg_reverse_cash_on_store2_sale_cancel ON store2_sales;
CREATE TRIGGER trg_reverse_cash_on_store2_sale_cancel
  AFTER UPDATE ON store2_sales
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_store2_sale_cancel();

-- Add comment
COMMENT ON FUNCTION reverse_cash_entry_on_store2_sale_cancel() IS 'Estorna automaticamente valores em dinheiro do caixa quando uma venda da Loja 2 é cancelada';
