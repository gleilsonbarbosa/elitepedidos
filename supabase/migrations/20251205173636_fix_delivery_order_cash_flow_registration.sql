/*
  # Corrigir Registro de Pedidos de Delivery no Fluxo de Caixa

  1. Problema Identificado
    - Pedidos são criados com status 'pending' (não registram no fluxo)
    - Quando status muda para 'confirmed', o trigger de INSERT não dispara
    - Resultado: pedidos confirmados não aparecem no fluxo de caixa
    
  2. Solução
    - Modificar função remove_delivery_order_from_cash_flow para também registrar
    - Quando status muda de 'pending' para status confirmado, registrar no fluxo
    - Manter lógica de remoção quando cancelar
*/

-- Atualizar função para registrar quando status muda de pending para confirmado
CREATE OR REPLACE FUNCTION remove_delivery_order_from_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  order_number text;
  store_code text;
BEGIN
  order_number := SUBSTRING(NEW.id::text FROM 1 FOR 8);
  
  -- Se o pedido foi cancelado, remover do fluxo de caixa
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    DELETE FROM financeiro_fluxo
    WHERE tipo = 'sistema_entrada'
      AND descricao LIKE 'Pedido Delivery #' || order_number || '%'
      AND criado_por = 'Sistema Delivery - Pedido #' || order_number;
  END IF;
  
  -- Se o status mudou de pending/cancelled para um status confirmado, registrar no fluxo
  IF NEW.status IN ('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered')
     AND OLD.status NOT IN ('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered') THEN
    
    -- Identificar a loja
    SELECT COALESCE(s.code, 'loja1') INTO store_code
    FROM stores s
    WHERE s.id = NEW.store_id;
    
    IF store_code IS NULL THEN
      store_code := 'loja1';
    END IF;
    
    -- Verificar se já não existe um registro (evitar duplicatas)
    IF NOT EXISTS (
      SELECT 1 FROM financeiro_fluxo
      WHERE tipo = 'sistema_entrada'
        AND descricao LIKE 'Pedido Delivery #' || order_number || '%'
        AND criado_por = 'Sistema Delivery - Pedido #' || order_number
    ) THEN
      -- Registrar no fluxo de caixa
      INSERT INTO financeiro_fluxo (
        data,
        tipo,
        descricao,
        valor,
        loja,
        criado_por
      ) VALUES (
        NEW.created_at::date,
        'sistema_entrada',
        'Pedido Delivery #' || order_number || ' - ' || NEW.customer_name,
        NEW.total_price,
        store_code,
        'Sistema Delivery - Pedido #' || order_number
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;