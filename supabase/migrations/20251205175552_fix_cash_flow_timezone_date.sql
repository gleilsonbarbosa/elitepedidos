/*
  # Corrigir Timezone na Data do Fluxo de Caixa

  1. Problema
    - Vendas feitas às 21:30 do dia 04/12 estão sendo registradas como 05/12
    - O campo `data` está usando UTC ao invés do horário local do Brasil
    - Exemplo: Venda às 21:30 (BR) = 00:30 UTC do dia seguinte

  2. Solução
    - Converter timestamps para timezone 'America/Sao_Paulo' antes de extrair a data
    - Atualizar todos os triggers que inserem no financeiro_fluxo
    - Usar: (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date

  3. Triggers Afetados
    - register_pdv_sale_in_cash_flow (PDV Sales)
    - register_delivery_order_in_cash_flow (Delivery Orders)
    - register_pdv2_sale_in_cash_flow (Store 2 Sales)
    - register_pdv_cash_entry_in_cash_flow (PDV Cash Entries)
    - register_pdv2_cash_entry_in_cash_flow (Store 2 Cash Entries)
*/

-- ============================================
-- 1. Trigger para vendas do PDV (Loja 1)
-- ============================================
CREATE OR REPLACE FUNCTION register_pdv_sale_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
  payment_method_mapped text;
BEGIN
  -- Identificar a loja
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM pdv_cash_registers cr
  LEFT JOIN stores s ON cr.store_id = s.id
  WHERE cr.id = NEW.cash_register_id;

  -- Mapear forma de pagamento
  payment_method_mapped := CASE NEW.payment_type
    WHEN 'dinheiro' THEN 'dinheiro'
    WHEN 'cartao_credito' THEN 'cartao_credito'
    WHEN 'cartao_debito' THEN 'cartao_debito'
    WHEN 'pix' THEN 'pix'
    WHEN 'voucher' THEN 'voucher'
    WHEN 'misto' THEN 'misto'
    ELSE 'dinheiro'
  END;

  -- Registrar a venda no fluxo de caixa com data local do Brasil
  INSERT INTO financeiro_fluxo (
    data,
    tipo,
    descricao,
    valor,
    forma_pagamento,
    loja,
    criado_por
  ) VALUES (
    (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
    'sistema_entrada',
    'Venda PDV #' || NEW.sale_number || ' - ' || COALESCE(NEW.customer_name, 'Cliente não identificado'),
    NEW.total_amount,
    payment_method_mapped,
    COALESCE(store_code, 'loja1'),
    'Sistema PDV - Venda #' || NEW.sale_number
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Trigger para pedidos do Delivery
-- ============================================
CREATE OR REPLACE FUNCTION register_delivery_order_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  payment_method_mapped text;
BEGIN
  -- Mapear forma de pagamento
  payment_method_mapped := CASE NEW.payment_method
    WHEN 'dinheiro' THEN 'dinheiro'
    WHEN 'pix' THEN 'pix'
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
      (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
      'sistema_entrada',
      'Pedido Delivery #' || SUBSTRING(NEW.id::text, 1, 8) || ' - ' || NEW.customer_name || ' ',
      NEW.total,
      payment_method_mapped,
      'loja1',
      'Sistema Delivery - Pedido #' || SUBSTRING(NEW.id::text, 1, 8)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Trigger para vendas do PDV (Loja 2)
-- ============================================
CREATE OR REPLACE FUNCTION register_pdv2_sale_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  payment_method_mapped text;
BEGIN
  -- Mapear forma de pagamento
  payment_method_mapped := CASE NEW.payment_type
    WHEN 'dinheiro' THEN 'dinheiro'
    WHEN 'cartao_credito' THEN 'cartao_credito'
    WHEN 'cartao_debito' THEN 'cartao_debito'
    WHEN 'pix' THEN 'pix'
    WHEN 'voucher' THEN 'voucher'
    WHEN 'misto' THEN 'misto'
    ELSE 'dinheiro'
  END;

  -- Registrar a venda no fluxo de caixa com data local do Brasil
  INSERT INTO financeiro_fluxo (
    data,
    tipo,
    descricao,
    valor,
    forma_pagamento,
    loja,
    criado_por
  ) VALUES (
    (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
    'sistema_entrada',
    'Venda PDV Loja 2 #' || NEW.sale_number || ' - ' || COALESCE(NEW.customer_name, 'Cliente não identificado'),
    NEW.total_amount,
    payment_method_mapped,
    'loja2',
    'Sistema PDV Loja 2 - Venda #' || NEW.sale_number
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Trigger para entradas/saídas do caixa PDV (Loja 1)
-- ============================================
CREATE OR REPLACE FUNCTION register_pdv_cash_entry_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
BEGIN
  -- Identificar a loja
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM pdv_cash_registers cr
  LEFT JOIN stores s ON cr.store_id = s.id
  WHERE cr.id = NEW.cash_register_id;

  -- Registrar apenas entradas e saídas manuais (não abertura/fechamento)
  IF NEW.entry_type IN ('receita', 'despesa', 'entrada', 'saida') THEN
    INSERT INTO financeiro_fluxo (
      data,
      tipo,
      descricao,
      valor,
      forma_pagamento,
      loja,
      criado_por
    ) VALUES (
      (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
      NEW.entry_type,
      NEW.description,
      NEW.amount,
      NEW.payment_method,
      COALESCE(store_code, 'loja1'),
      NEW.created_by || ' - ' || NEW.entry_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Trigger para entradas/saídas do caixa PDV (Loja 2)
-- ============================================
CREATE OR REPLACE FUNCTION register_pdv2_cash_entry_in_cash_flow()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar apenas entradas e saídas manuais (não abertura/fechamento)
  IF NEW.entry_type IN ('receita', 'despesa', 'entrada', 'saida') THEN
    INSERT INTO financeiro_fluxo (
      data,
      tipo,
      descricao,
      valor,
      forma_pagamento,
      loja,
      criado_por
    ) VALUES (
      (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
      NEW.entry_type,
      NEW.description,
      NEW.amount,
      NEW.payment_method,
      'loja2',
      NEW.created_by || ' - ' || NEW.entry_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;