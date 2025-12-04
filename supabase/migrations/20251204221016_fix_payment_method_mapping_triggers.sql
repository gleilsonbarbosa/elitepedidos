/*
  # Corrigir Mapeamento de Formas de Pagamento nos Triggers

  1. Problema Identificado
    - Triggers estão esperando valores em inglês (cash, credit_card, etc.)
    - Banco está usando valores em português (dinheiro, pix, cartao_credito, etc.)
    - Resultado: vendas não estão sendo registradas no fluxo de caixa

  2. Solução
    - Atualizar função do trigger para aceitar valores em português
    - Mapear corretamente: dinheiro, pix, cartao_credito, cartao_debito, voucher, misto

  3. Notas
    - Isso corrigirá o registro de vendas PDV e Delivery no fluxo de caixa
*/

-- Atualizar função para registrar venda do PDV no fluxo de caixa
CREATE OR REPLACE FUNCTION register_pdv_sale_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
  payment_method text;
BEGIN
  -- Identificar a loja
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM pdv_cash_registers cr
  LEFT JOIN stores s ON cr.store_id = s.id
  WHERE cr.id = NEW.cash_register_id;
  
  IF store_code IS NULL THEN
    store_code := 'loja1';
  END IF;

  -- Mapear tipo de pagamento (já está em português no banco)
  payment_method := CASE NEW.payment_type
    WHEN 'dinheiro' THEN 'dinheiro'
    WHEN 'pix' THEN 'pix'
    WHEN 'cartao_credito' THEN 'cartao_credito'
    WHEN 'cartao_debito' THEN 'cartao_debito'
    WHEN 'voucher' THEN 'voucher'
    WHEN 'misto' THEN 'misto'
    -- Fallback para valores antigos em inglês (se existirem)
    WHEN 'cash' THEN 'dinheiro'
    WHEN 'credit_card' THEN 'cartao_credito'
    WHEN 'debit_card' THEN 'cartao_debito'
    WHEN 'mixed' THEN 'misto'
    ELSE 'dinheiro'
  END;

  -- Registrar a venda no fluxo de caixa
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
    'Venda PDV #' || NEW.sale_number || ' - ' || COALESCE(NEW.customer_name, 'Cliente não identificado'),
    NEW.total_amount,
    payment_method,
    store_code,
    'Sistema PDV - Venda #' || NEW.sale_number
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  -- Mapear forma de pagamento (já está em português no banco)
  payment_method := CASE NEW.payment_method
    WHEN 'dinheiro' THEN 'dinheiro'
    WHEN 'pix' THEN 'pix'
    WHEN 'cartao_credito' THEN 'cartao_credito'
    WHEN 'cartao_debito' THEN 'cartao_debito'
    WHEN 'voucher' THEN 'voucher'
    WHEN 'misto' THEN 'misto'
    -- Fallback para valores antigos em inglês (se existirem)
    WHEN 'cash' THEN 'dinheiro'
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

-- Comentário: Os triggers agora mapeiam corretamente os valores em português