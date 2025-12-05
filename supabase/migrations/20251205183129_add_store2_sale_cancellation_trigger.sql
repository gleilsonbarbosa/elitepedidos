/*
  # Estornar valor do caixa quando venda da Loja 2 é cancelada

  ## Problema
  - Quando uma venda da Loja 2 é cancelada, o valor em dinheiro permanece no caixa
  - Isso causa diferença no fechamento do caixa
  - Não havia trigger para vendas da Loja 2

  ## Solução
  - Criar trigger que detecta cancelamento de vendas da Loja 2
  - Buscar entrada de caixa relacionada à venda
  - Criar entrada de saída (expense) para estornar o valor
*/

-- Function to reverse cash entry when Store2 sale is cancelled
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_store2_sale_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  sale_ref text;
  cash_amount numeric;
BEGIN
  -- Only act when is_cancelled changes to true
  IF NEW.is_cancelled = true AND (OLD.is_cancelled = false OR OLD.is_cancelled IS NULL) THEN
    
    -- Build sale reference pattern
    sale_ref := 'Venda #' || NEW.sale_number;
    
    -- Determine cash amount based on payment type
    IF NEW.payment_type = 'dinheiro' THEN
      cash_amount := NEW.total_amount;
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
    ELSE
      -- No cash to reverse for card/pix/voucher payments
      cash_amount := 0;
    END IF;
    
    -- Only proceed if there's cash to reverse
    IF cash_amount > 0 AND NEW.cash_register_id IS NOT NULL THEN
      
      -- Find the cash entry for this sale in Store 2
      SELECT * INTO cash_entry_record
      FROM pdv_cash_entries
      WHERE description LIKE sale_ref || '%'
        AND type = 'income'
        AND register_id = NEW.cash_register_id
        AND channel = 'loja2'
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
          channel,
          created_at
        ) VALUES (
          cash_entry_record.register_id,
          'expense',
          cash_entry_record.amount,
          'Estorno: ' || cash_entry_record.description || ' (venda cancelada)',
          cash_entry_record.payment_method,
          'loja2',
          NOW()
        );
        
        RAISE NOTICE 'Estornado R$ % do caixa Loja 2 para venda cancelada #%', cash_entry_record.amount, NEW.sale_number;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Store2 sale cancellation
DROP TRIGGER IF EXISTS trg_reverse_cash_on_store2_sale_cancel ON store2_sales;
CREATE TRIGGER trg_reverse_cash_on_store2_sale_cancel
  AFTER UPDATE ON store2_sales
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_store2_sale_cancel();

-- Add comment
COMMENT ON FUNCTION reverse_cash_entry_on_store2_sale_cancel() IS 'Estorna automaticamente valores do caixa quando uma venda da Loja 2 é cancelada';
