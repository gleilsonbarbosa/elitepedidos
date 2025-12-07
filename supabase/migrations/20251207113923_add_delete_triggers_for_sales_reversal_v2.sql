/*
  # Adicionar triggers para estorno quando vendas são DELETADAS
  
  ## Problema
  Quando uma venda ou pedido é DELETADO (não apenas cancelado), 
  o estorno não estava sendo feito automaticamente.
  
  ## Solução
  Adicionar triggers de DELETE para:
  1. pdv_sales - vendas PDV
  2. orders - pedidos delivery
  3. store2_sales - vendas loja 2
*/

-- Função para estornar entrada quando venda PDV é deletada
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_pdv_sale_delete()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  sale_ref text;
  cash_amount numeric;
BEGIN
  RAISE NOTICE '🗑️ VENDA PDV DELETADA - #%, Tipo: %, Total: R$ %', 
    OLD.sale_number, OLD.payment_type, OLD.total_amount;
  
  sale_ref := 'Venda #' || OLD.sale_number;
  
  -- Determinar valor em dinheiro
  IF OLD.payment_type = 'dinheiro' THEN
    cash_amount := OLD.total_amount;
    RAISE NOTICE '💵 Pagamento em DINHEIRO - Valor a estornar: R$ %', cash_amount;
  ELSIF OLD.payment_type = 'misto' AND OLD.payment_details IS NOT NULL THEN
    cash_amount := COALESCE(
      (
        SELECT SUM((detail->>'amount')::numeric)
        FROM jsonb_array_elements(OLD.payment_details) AS detail
        WHERE detail->>'method' = 'dinheiro'
      ),
      0
    );
    RAISE NOTICE '💳💵 Pagamento MISTO - Parte em dinheiro: R$ %', cash_amount;
  ELSE
    cash_amount := 0;
    RAISE NOTICE '💳 Pagamento NÃO-DINHEIRO (%) - SEM ESTORNO', OLD.payment_type;
  END IF;
  
  -- Apenas processar se houver valor em dinheiro
  IF cash_amount > 0 AND OLD.cash_register_id IS NOT NULL THEN
    
    RAISE NOTICE '🔍 Buscando entrada de caixa: %', sale_ref;
    
    SELECT * INTO cash_entry_record
    FROM pdv_cash_entries
    WHERE description LIKE sale_ref || '%'
      AND type = 'income'
      AND register_id = OLD.cash_register_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      RAISE NOTICE '✅ ENTRADA ENCONTRADA - Caixa: %', cash_entry_record.register_id;
      
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
        'Estorno: ' || cash_entry_record.description || ' (venda deletada)',
        'dinheiro',
        NOW()
      );
      
      RAISE NOTICE '💰 ESTORNO CRIADO - R$ % estornado', cash_amount;
    ELSE
      RAISE WARNING '⚠️ ENTRADA NÃO ENCONTRADA - Padrão: %', sale_ref;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Função para estornar entrada quando pedido delivery é deletado
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_order_delete()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  order_ref text;
  cash_amount numeric;
BEGIN
  RAISE NOTICE '🗑️ PEDIDO DELETADO - ID: %, Método: %, Total: R$ %', 
    OLD.id, OLD.payment_method, OLD.total_price;
  
  order_ref := 'Delivery #' || substring(OLD.id::text, 1, 8);
  
  IF OLD.payment_method = 'Dinheiro' THEN
    cash_amount := OLD.total_price;
    RAISE NOTICE '💵 Pagamento em DINHEIRO - Valor a estornar: R$ %', cash_amount;
  ELSIF OLD.payment_method = 'Misto' AND OLD.mixed_payment_details IS NOT NULL THEN
    cash_amount := COALESCE(
      (
        SELECT SUM((detail->>'amount')::numeric)
        FROM jsonb_array_elements(OLD.mixed_payment_details) AS detail
        WHERE detail->>'method' = 'Dinheiro'
      ),
      0
    );
    RAISE NOTICE '💳💵 Pagamento MISTO - Parte em dinheiro: R$ %', cash_amount;
  ELSE
    cash_amount := 0;
    RAISE NOTICE '💳 Pagamento NÃO-DINHEIRO (%) - SEM ESTORNO', OLD.payment_method;
  END IF;
  
  IF cash_amount > 0 THEN
    
    RAISE NOTICE '🔍 Buscando entrada de caixa: %', order_ref;
    
    SELECT * INTO cash_entry_record
    FROM pdv_cash_entries
    WHERE description LIKE order_ref || '%'
      AND type = 'income'
      AND payment_method = 'dinheiro'
      AND register_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      RAISE NOTICE '✅ ENTRADA ENCONTRADA - Caixa: %', cash_entry_record.register_id;
      
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
        'Estorno: ' || cash_entry_record.description || ' (pedido deletado)',
        'dinheiro',
        NOW()
      );
      
      RAISE NOTICE '💰 ESTORNO CRIADO - R$ % estornado', cash_amount;
    ELSE
      RAISE WARNING '⚠️ ENTRADA NÃO ENCONTRADA - Padrão: %', order_ref;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Função para estornar venda loja 2 deletada
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_store2_sale_delete()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  sale_ref text;
  cash_amount numeric;
  cash_register_table text;
BEGIN
  RAISE NOTICE '🗑️ VENDA LOJA 2 DELETADA - #%, Tipo: %, Total: R$ %', 
    OLD.sale_number, OLD.payment_type, OLD.total_amount;
  
  sale_ref := 'Venda Loja2 #' || OLD.sale_number;
  
  -- Verificar se existe tabela store2_cash_entries ou se usa pdv_cash_entries
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store2_cash_entries') THEN
    cash_register_table := 'store2_cash_entries';
  ELSE
    cash_register_table := 'pdv_cash_entries';
    RAISE NOTICE '⚠️ Usando pdv_cash_entries para loja 2';
  END IF;
  
  IF OLD.payment_type = 'dinheiro' THEN
    cash_amount := OLD.total_amount;
  ELSIF OLD.payment_type = 'misto' AND OLD.payment_details IS NOT NULL THEN
    cash_amount := COALESCE(
      (
        SELECT SUM((detail->>'amount')::numeric)
        FROM jsonb_array_elements(OLD.payment_details) AS detail
        WHERE detail->>'method' = 'dinheiro'
      ),
      0
    );
  ELSE
    cash_amount := 0;
  END IF;
  
  IF cash_amount > 0 AND OLD.cash_register_id IS NOT NULL THEN
    
    IF cash_register_table = 'store2_cash_entries' THEN
      SELECT * INTO cash_entry_record
      FROM store2_cash_entries
      WHERE description LIKE sale_ref || '%'
        AND type = 'income'
        AND register_id = OLD.cash_register_id
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO store2_cash_entries (
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
          'Estorno: ' || cash_entry_record.description || ' (venda deletada)',
          'dinheiro',
          NOW()
        );
        
        RAISE NOTICE '💰 ESTORNO LOJA 2 CRIADO - R$ %', cash_amount;
      END IF;
    ELSE
      -- Usar pdv_cash_entries
      SELECT * INTO cash_entry_record
      FROM pdv_cash_entries
      WHERE description LIKE sale_ref || '%'
        AND type = 'income'
        AND register_id = OLD.cash_register_id
      ORDER BY created_at DESC
      LIMIT 1;
      
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
          'Estorno: ' || cash_entry_record.description || ' (venda deletada)',
          'dinheiro',
          NOW()
        );
        
        RAISE NOTICE '💰 ESTORNO LOJA 2 CRIADO via pdv_cash_entries - R$ %', cash_amount;
      END IF;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers de DELETE
DROP TRIGGER IF EXISTS trg_reverse_cash_on_pdv_sale_delete ON pdv_sales;
CREATE TRIGGER trg_reverse_cash_on_pdv_sale_delete
  AFTER DELETE ON pdv_sales
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_pdv_sale_delete();

DROP TRIGGER IF EXISTS trg_reverse_cash_on_order_delete ON orders;
CREATE TRIGGER trg_reverse_cash_on_order_delete
  AFTER DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_order_delete();

DROP TRIGGER IF EXISTS trg_reverse_cash_on_store2_sale_delete ON store2_sales;
CREATE TRIGGER trg_reverse_cash_on_store2_sale_delete
  AFTER DELETE ON store2_sales
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_store2_sale_delete();

COMMENT ON FUNCTION reverse_cash_entry_on_pdv_sale_delete IS 'Estorna entrada de caixa quando venda PDV é DELETADA';
COMMENT ON FUNCTION reverse_cash_entry_on_order_delete IS 'Estorna entrada de caixa quando pedido delivery é DELETADO';
COMMENT ON FUNCTION reverse_cash_entry_on_store2_sale_delete IS 'Estorna entrada de caixa quando venda loja 2 é DELETADA';
