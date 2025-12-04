/*
  # Adicionar Forma de Pagamento ao Fluxo de Caixa

  1. Mudanças na Estrutura
    - Adicionar coluna `forma_pagamento` à tabela `financeiro_fluxo`
    - Valores possíveis: dinheiro, cartao_credito, cartao_debito, pix, voucher, misto

  2. Atualização de Triggers
    - Atualizar trigger de vendas PDV para incluir forma de pagamento
    - Atualizar trigger de pedidos Delivery para incluir forma de pagamento
    - Suporte para pagamentos mistos

  3. Notas
    - Vendas com dinheiro continuarão aparecendo normalmente
    - Vendas com cartão, PIX, voucher e misto agora serão registradas corretamente
*/

-- Adicionar coluna forma_pagamento se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financeiro_fluxo' AND column_name = 'forma_pagamento'
  ) THEN
    ALTER TABLE financeiro_fluxo ADD COLUMN forma_pagamento text DEFAULT 'dinheiro';
  END IF;
END $$;

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

  -- Mapear tipo de pagamento
  payment_method := CASE NEW.payment_type
    WHEN 'cash' THEN 'dinheiro'
    WHEN 'credit_card' THEN 'cartao_credito'
    WHEN 'debit_card' THEN 'cartao_debito'
    WHEN 'pix' THEN 'pix'
    WHEN 'voucher' THEN 'voucher'
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

  -- Mapear forma de pagamento
  payment_method := CASE 
    WHEN NEW.payment_method = 'cash' THEN 'dinheiro'
    WHEN NEW.payment_method = 'credit_card' THEN 'cartao_credito'
    WHEN NEW.payment_method = 'debit_card' THEN 'cartao_debito'
    WHEN NEW.payment_method = 'pix' THEN 'pix'
    WHEN NEW.payment_method = 'voucher' THEN 'voucher'
    WHEN NEW.payment_method = 'mixed' THEN 'misto'
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

-- Atualizar entradas existentes sem forma de pagamento
UPDATE financeiro_fluxo
SET forma_pagamento = CASE
  WHEN descricao LIKE '%PIX%' THEN 'pix'
  WHEN descricao LIKE '%Cartão Crédito%' THEN 'cartao_credito'
  WHEN descricao LIKE '%Cartão Débito%' THEN 'cartao_debito'
  WHEN descricao LIKE '%Pagamento Misto%' THEN 'misto'
  WHEN descricao LIKE '%Voucher%' THEN 'voucher'
  ELSE 'dinheiro'
END
WHERE forma_pagamento IS NULL OR forma_pagamento = 'dinheiro';