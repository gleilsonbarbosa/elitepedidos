/*
  # Corrigir Mapeamento de Formas de Pagamento do Delivery

  1. Problema Identificado
    - Pedidos do Delivery usam valores em inglês: money, card, pix, mixed
    - Trigger não estava mapeando corretamente

  2. Solução
    - Adicionar mapeamento para valores em inglês: money, card, mixed
    - Mapear corretamente para português no fluxo de caixa
*/

-- Atualizar função para registrar pedido do Delivery no fluxo de caixa
CREATE OR REPLACE FUNCTION register_delivery_order_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
  order_number text;
  payment_method text;
BEGIN
  -- Identificar a loja
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM stores s
  WHERE s.id = NEW.store_id;
  
  IF store_code IS NULL THEN
    store_code := 'loja1';
  END IF;

  -- Gerar identificador do pedido
  order_number := SUBSTRING(NEW.id::text FROM 1 FOR 8);

  -- Mapear forma de pagamento (suporta português e inglês)
  payment_method := CASE NEW.payment_method
    -- Valores em português
    WHEN 'dinheiro' THEN 'dinheiro'
    WHEN 'pix' THEN 'pix'
    WHEN 'cartao_credito' THEN 'cartao_credito'
    WHEN 'cartao_debito' THEN 'cartao_debito'
    WHEN 'voucher' THEN 'voucher'
    WHEN 'misto' THEN 'misto'
    -- Valores em inglês (sistema antigo)
    WHEN 'money' THEN 'dinheiro'
    WHEN 'cash' THEN 'dinheiro'
    WHEN 'card' THEN 'cartao_credito'
    WHEN 'credit_card' THEN 'cartao_credito'
    WHEN 'debit_card' THEN 'cartao_debito'
    WHEN 'mixed' THEN 'misto'
    ELSE 'dinheiro'
  END;

  -- Registrar o pedido no fluxo de caixa apenas se estiver confirmado
  IF NEW.status IN ('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered') THEN
    INSERT INTO financeiro_fluxo (
      data,
      tipo,
      descricao,
      valor,
      forma_pagamento,
      loja,
      criado_por
    ) VALUES (
      NEW.created_at::date,
      'sistema_entrada',
      'Pedido Delivery #' || order_number || ' - ' || NEW.customer_name,
      NEW.total_price,
      payment_method,
      store_code,
      'Sistema Delivery - Pedido #' || order_number
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;