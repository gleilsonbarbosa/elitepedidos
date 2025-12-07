/*
  # Corrigir atualização do saldo do caixa em todas as operações
  
  ## Problema
  O saldo atual do caixa não está sendo atualizado quando:
  1. Uma venda ou pedido é excluído/cancelado
  2. A forma de pagamento é editada (ex: dinheiro → cartão)
  
  ## Causa
  - A função get_pdv_cash_summary calcula corretamente apenas vendas em DINHEIRO
  - Mas a UI não está forçando recálculo em todos os cenários
  - Triggers podem não estar notificando mudanças adequadamente
  
  ## Solução
  1. Adicionar função para notificar mudanças no caixa
  2. Atualizar triggers para usar essa função
  3. Garantir que DELETE em pdv_cash_entries também notifique
  4. Melhorar logs para debug
*/

-- Função para notificar mudanças no saldo do caixa
CREATE OR REPLACE FUNCTION notify_cash_register_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar que houve mudança no caixa para forçar atualização na UI
  PERFORM pg_notify('cash_register_changed', 
    json_build_object(
      'register_id', COALESCE(NEW.register_id, OLD.register_id),
      'operation', TG_OP,
      'table', TG_TABLE_NAME
    )::text
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para notificar em INSERT em pdv_cash_entries
DROP TRIGGER IF EXISTS trg_notify_cash_register_on_entry_insert ON pdv_cash_entries;
CREATE TRIGGER trg_notify_cash_register_on_entry_insert
  AFTER INSERT ON pdv_cash_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_cash_register_change();

-- Adicionar trigger para notificar em UPDATE em pdv_cash_entries
DROP TRIGGER IF EXISTS trg_notify_cash_register_on_entry_update ON pdv_cash_entries;
CREATE TRIGGER trg_notify_cash_register_on_entry_update
  AFTER UPDATE ON pdv_cash_entries
  FOR EACH ROW
  WHEN (
    OLD.payment_method IS DISTINCT FROM NEW.payment_method OR
    OLD.amount IS DISTINCT FROM NEW.amount OR
    OLD.type IS DISTINCT FROM NEW.type
  )
  EXECUTE FUNCTION notify_cash_register_change();

-- Adicionar trigger para notificar em DELETE em pdv_cash_entries
DROP TRIGGER IF EXISTS trg_notify_cash_register_on_entry_delete ON pdv_cash_entries;
CREATE TRIGGER trg_notify_cash_register_on_entry_delete
  AFTER DELETE ON pdv_cash_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_cash_register_change();

-- Função melhorada para estorno com logs mais detalhados e notificação
CREATE OR REPLACE FUNCTION reverse_cash_entry_on_order_cancel()
RETURNS TRIGGER AS $$
DECLARE
  cash_entry_record RECORD;
  order_ref text;
  cash_amount numeric;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    RAISE NOTICE '🚫 PEDIDO CANCELADO - ID: %, Método: %, Total: R$ %', 
      NEW.id, NEW.payment_method, NEW.total_price;
    
    order_ref := 'Delivery #' || substring(NEW.id::text, 1, 8);
    
    IF NEW.payment_method = 'Dinheiro' THEN
      cash_amount := NEW.total_price;
      RAISE NOTICE '💵 Pagamento em DINHEIRO - Valor a estornar: R$ %', cash_amount;
    ELSIF NEW.payment_method = 'Misto' AND NEW.mixed_payment_details IS NOT NULL THEN
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
      cash_amount := 0;
      RAISE NOTICE '💳 Pagamento NÃO-DINHEIRO (%) - SEM ESTORNO', NEW.payment_method;
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
        RAISE NOTICE '✅ ENTRADA ENCONTRADA - Caixa: %, Valor: R$ %', 
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
          'Estorno: ' || cash_entry_record.description || ' (cancelado)',
          'dinheiro',
          NOW()
        );
        
        RAISE NOTICE '💰 ESTORNO CRIADO - R$ % estornado', cash_amount;
        
        -- Notificar mudança
        PERFORM pg_notify('cash_register_changed', 
          json_build_object(
            'register_id', cash_entry_record.register_id,
            'operation', 'REVERSAL',
            'reason', 'order_cancelled'
          )::text
        );
      ELSE
        RAISE WARNING '⚠️ ENTRADA NÃO ENCONTRADA - Padrão: %', order_ref;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger de estorno de pedidos
DROP TRIGGER IF EXISTS trg_reverse_cash_on_order_cancel ON orders;
CREATE TRIGGER trg_reverse_cash_on_order_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reverse_cash_entry_on_order_cancel();

COMMENT ON FUNCTION notify_cash_register_change IS 'Notifica mudanças no caixa via pg_notify para forçar atualização em tempo real';
COMMENT ON FUNCTION reverse_cash_entry_on_order_cancel IS 'Estorna entrada de caixa quando pedido é cancelado, com notificação';
