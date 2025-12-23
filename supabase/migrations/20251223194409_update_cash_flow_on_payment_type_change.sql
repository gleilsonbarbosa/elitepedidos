/*
  # Atualizar Fluxo de Caixa Quando Forma de Pagamento é Alterada

  ## Problema
  Quando uma venda tem sua forma de pagamento editada (ex: dinheiro → PIX):
  - O registro no financeiro_fluxo NÃO é atualizado
  - O valor continua sendo contabilizado como "dinheiro" no caixa
  - Causa inconsistência entre o saldo real e o registrado

  ## Solução
  Criar trigger AFTER UPDATE que:
  1. Detecta quando payment_type/payment_method muda
  2. Atualiza o registro correspondente no financeiro_fluxo
  3. Mantém integridade entre vendas e fluxo financeiro

  ## Tabelas Afetadas
  - pdv_sales
  - orders (delivery)
  - store2_sales

  ## Importante
  - Apenas vendas não canceladas são atualizadas
  - O valor permanece o mesmo, apenas a forma de pagamento muda
  - Identificação é feita pela descrição única (ex: "Venda #1234")
*/

-- ============================================
-- Função para atualizar forma de pagamento no fluxo (PDV)
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_method_in_cash_flow_pdv()
RETURNS TRIGGER AS $$
DECLARE
  old_payment_method text;
  new_payment_method text;
  sale_description text;
BEGIN
  -- Apenas processar se não estiver cancelada e forma de pagamento mudou
  IF NEW.is_cancelled = false AND OLD.payment_type IS DISTINCT FROM NEW.payment_type THEN

    -- Mapear forma de pagamento antiga
    old_payment_method := OLD.payment_type;

    -- Mapear forma de pagamento nova
    new_payment_method := NEW.payment_type;

    -- Criar descrição da venda
    sale_description := 'Venda #' || NEW.sale_number;

    RAISE NOTICE '💳 MUDANÇA DE PAGAMENTO - Venda #% | % → %',
      NEW.sale_number, old_payment_method, new_payment_method;

    -- Atualizar o registro no fluxo de caixa
    UPDATE financeiro_fluxo
    SET
      forma_pagamento = new_payment_method,
      updated_at = NOW()
    WHERE descricao = sale_description
      AND tipo = 'receita'
      AND ABS(valor - NEW.total_amount) < 0.01;

    IF FOUND THEN
      RAISE NOTICE '✅ FLUXO ATUALIZADO - Venda #% agora registrada como %',
        NEW.sale_number, new_payment_method;
    ELSE
      RAISE WARNING '⚠️ REGISTRO NÃO ENCONTRADO no fluxo para Venda #%', NEW.sale_number;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função para atualizar forma de pagamento no fluxo (Delivery)
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_method_in_cash_flow_delivery()
RETURNS TRIGGER AS $$
DECLARE
  old_payment_method text;
  new_payment_method text;
  order_ref text;
BEGIN
  -- Apenas processar se não estiver cancelado e forma de pagamento mudou
  IF NEW.status != 'cancelled' AND OLD.payment_method IS DISTINCT FROM NEW.payment_method THEN

    -- Mapear forma de pagamento antiga
    CASE OLD.payment_method
      WHEN 'money' THEN old_payment_method := 'dinheiro';
      WHEN 'pix' THEN old_payment_method := 'pix';
      WHEN 'card' THEN old_payment_method := 'cartao_credito';
      WHEN 'mixed' THEN old_payment_method := 'misto';
      ELSE old_payment_method := OLD.payment_method;
    END CASE;

    -- Mapear forma de pagamento nova
    CASE NEW.payment_method
      WHEN 'money' THEN new_payment_method := 'dinheiro';
      WHEN 'pix' THEN new_payment_method := 'pix';
      WHEN 'card' THEN new_payment_method := 'cartao_credito';
      WHEN 'mixed' THEN new_payment_method := 'misto';
      ELSE new_payment_method := NEW.payment_method;
    END CASE;

    -- Criar referência do pedido
    order_ref := 'Delivery #' || substring(NEW.id::text, 1, 8);

    RAISE NOTICE '💳 MUDANÇA DE PAGAMENTO - % | % → %',
      order_ref, old_payment_method, new_payment_method;

    -- Atualizar o registro no fluxo de caixa
    UPDATE financeiro_fluxo
    SET
      forma_pagamento = new_payment_method,
      updated_at = NOW()
    WHERE descricao LIKE order_ref || '%'
      AND tipo = 'receita'
      AND ABS(valor - NEW.total_price) < 0.01;

    IF FOUND THEN
      RAISE NOTICE '✅ FLUXO ATUALIZADO - % agora registrado como %',
        order_ref, new_payment_method;
    ELSE
      RAISE WARNING '⚠️ REGISTRO NÃO ENCONTRADO no fluxo para %', order_ref;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função para atualizar forma de pagamento no fluxo (Store 2)
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_method_in_cash_flow_store2()
RETURNS TRIGGER AS $$
DECLARE
  old_payment_method text;
  new_payment_method text;
  sale_description text;
BEGIN
  -- Apenas processar se não estiver cancelada e forma de pagamento mudou
  IF NEW.is_cancelled = false AND OLD.payment_type IS DISTINCT FROM NEW.payment_type THEN

    -- Mapear forma de pagamento antiga
    old_payment_method := OLD.payment_type;

    -- Mapear forma de pagamento nova
    new_payment_method := NEW.payment_type;

    -- Criar descrição da venda
    sale_description := 'Venda #' || NEW.sale_number;

    RAISE NOTICE '💳 MUDANÇA DE PAGAMENTO LOJA 2 - Venda #% | % → %',
      NEW.sale_number, old_payment_method, new_payment_method;

    -- Atualizar o registro no fluxo de caixa
    UPDATE financeiro_fluxo
    SET
      forma_pagamento = new_payment_method,
      updated_at = NOW()
    WHERE descricao = sale_description
      AND tipo = 'receita'
      AND loja = 'loja2'
      AND ABS(valor - NEW.total_amount) < 0.01;

    IF FOUND THEN
      RAISE NOTICE '✅ FLUXO ATUALIZADO - Venda #% agora registrada como %',
        NEW.sale_number, new_payment_method;
    ELSE
      RAISE WARNING '⚠️ REGISTRO NÃO ENCONTRADO no fluxo para Venda #%', NEW.sale_number;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Criar triggers
-- ============================================

-- Trigger para vendas do PDV (Loja 1)
DROP TRIGGER IF EXISTS trg_update_payment_method_cash_flow_pdv ON pdv_sales;
CREATE TRIGGER trg_update_payment_method_cash_flow_pdv
  AFTER UPDATE ON pdv_sales
  FOR EACH ROW
  WHEN (
    NEW.is_cancelled = false AND
    OLD.payment_type IS DISTINCT FROM NEW.payment_type
  )
  EXECUTE FUNCTION update_payment_method_in_cash_flow_pdv();

-- Trigger para pedidos de delivery
DROP TRIGGER IF EXISTS trg_update_payment_method_cash_flow_delivery ON orders;
CREATE TRIGGER trg_update_payment_method_cash_flow_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (
    NEW.status != 'cancelled' AND
    OLD.payment_method IS DISTINCT FROM NEW.payment_method
  )
  EXECUTE FUNCTION update_payment_method_in_cash_flow_delivery();

-- Trigger para vendas da Loja 2
DROP TRIGGER IF EXISTS trg_update_payment_method_cash_flow_store2 ON store2_sales;
CREATE TRIGGER trg_update_payment_method_cash_flow_store2
  AFTER UPDATE ON store2_sales
  FOR EACH ROW
  WHEN (
    NEW.is_cancelled = false AND
    OLD.payment_type IS DISTINCT FROM NEW.payment_type
  )
  EXECUTE FUNCTION update_payment_method_in_cash_flow_store2();

-- ============================================
-- Comentários
-- ============================================
COMMENT ON FUNCTION update_payment_method_in_cash_flow_pdv IS 'Atualiza forma de pagamento no fluxo quando venda PDV é editada';
COMMENT ON FUNCTION update_payment_method_in_cash_flow_delivery IS 'Atualiza forma de pagamento no fluxo quando pedido delivery é editado';
COMMENT ON FUNCTION update_payment_method_in_cash_flow_store2 IS 'Atualiza forma de pagamento no fluxo quando venda Loja 2 é editada';
