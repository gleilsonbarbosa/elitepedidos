/*
  # Registro Automático de Vendas no Fluxo de Caixa

  1. Problema Identificado
    - Vendas do PDV (1.803 vendas = R$ 37.843,45) não estão no fluxo de caixa
    - Pedidos do Delivery (936 pedidos = R$ 25.531,47) não estão no fluxo de caixa
    - Total de R$ 63.374,92 não registrados nas movimentações

  2. Solução
    - Criar trigger para registrar vendas do PDV automaticamente
    - Criar trigger para registrar pedidos do Delivery automaticamente
    - Registrar com tipo 'sistema_entrada' para identificar origem automática

  3. Funcionalidades
    - Registro automático ao criar venda/pedido
    - Remoção automática ao cancelar venda/pedido
    - Identificação da loja (loja1 ou loja2)
    - Descrição detalhada com número da venda/pedido
*/

-- Função para registrar venda do PDV no fluxo de caixa
CREATE OR REPLACE FUNCTION register_pdv_sale_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
BEGIN
  -- Identificar a loja pelo cash_register ou assumir loja1
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM pdv_cash_registers cr
  LEFT JOIN stores s ON cr.store_id = s.id
  WHERE cr.id = NEW.cash_register_id;
  
  IF store_code IS NULL THEN
    store_code := 'loja1';
  END IF;

  -- Registrar a venda no fluxo de caixa
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
    'Venda PDV #' || NEW.sale_number || ' - ' || COALESCE(NEW.customer_name, 'Cliente não identificado'),
    NEW.total_amount,
    store_code,
    'Sistema PDV - Venda #' || NEW.sale_number
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover venda do PDV do fluxo de caixa ao cancelar
CREATE OR REPLACE FUNCTION remove_pdv_sale_from_cash_flow()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a venda foi cancelada, remover do fluxo de caixa
  IF NEW.is_cancelled = true AND OLD.is_cancelled = false THEN
    DELETE FROM financeiro_fluxo
    WHERE tipo = 'sistema_entrada'
      AND descricao LIKE 'Venda PDV #' || NEW.sale_number || '%'
      AND criado_por = 'Sistema PDV - Venda #' || NEW.sale_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar pedido do Delivery no fluxo de caixa
CREATE OR REPLACE FUNCTION register_delivery_order_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
  order_number text;
BEGIN
  -- Identificar a loja pelo store_id ou assumir loja1
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM stores s
  WHERE s.id = NEW.store_id;
  
  IF store_code IS NULL THEN
    store_code := 'loja1';
  END IF;

  -- Gerar identificador do pedido (últimos 8 caracteres)
  order_number := SUBSTRING(NEW.id::text FROM 1 FOR 8);

  -- Registrar o pedido no fluxo de caixa apenas se estiver confirmado
  IF NEW.status IN ('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered') THEN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover pedido do Delivery do fluxo de caixa ao cancelar
CREATE OR REPLACE FUNCTION remove_delivery_order_from_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  order_number text;
BEGIN
  -- Se o pedido foi cancelado, remover do fluxo de caixa
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    order_number := SUBSTRING(NEW.id::text FROM 1 FOR 8);
    
    DELETE FROM financeiro_fluxo
    WHERE tipo = 'sistema_entrada'
      AND descricao LIKE 'Pedido Delivery #' || order_number || '%'
      AND criado_por = 'Sistema Delivery - Pedido #' || order_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trg_register_pdv_sale_cash_flow ON pdv_sales;
DROP TRIGGER IF EXISTS trg_remove_pdv_sale_cash_flow ON pdv_sales;
DROP TRIGGER IF EXISTS trg_register_delivery_order_cash_flow ON orders;
DROP TRIGGER IF EXISTS trg_remove_delivery_order_cash_flow ON orders;

-- Criar triggers para vendas do PDV
CREATE TRIGGER trg_register_pdv_sale_cash_flow
  AFTER INSERT ON pdv_sales
  FOR EACH ROW
  WHEN (NEW.is_cancelled = false)
  EXECUTE FUNCTION register_pdv_sale_in_cash_flow();

CREATE TRIGGER trg_remove_pdv_sale_cash_flow
  AFTER UPDATE ON pdv_sales
  FOR EACH ROW
  EXECUTE FUNCTION remove_pdv_sale_from_cash_flow();

-- Criar triggers para pedidos do Delivery
CREATE TRIGGER trg_register_delivery_order_cash_flow
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION register_delivery_order_in_cash_flow();

CREATE TRIGGER trg_remove_delivery_order_cash_flow
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION remove_delivery_order_from_cash_flow();

-- Comentário: Os triggers agora estão ativos e registrarão automaticamente:
-- 1. Novas vendas do PDV no fluxo de caixa
-- 2. Novos pedidos do Delivery no fluxo de caixa
-- 3. Removerão entradas ao cancelar vendas/pedidos
-- 
-- NOTA: Vendas/pedidos antigos NÃO serão registrados automaticamente.
-- Para registrar vendas antigas, seria necessário executar uma migração de dados separada.
