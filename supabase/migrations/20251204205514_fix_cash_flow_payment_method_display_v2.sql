/*
  # Correção: Incluir Método de Pagamento no Fluxo de Caixa

  1. Problema Identificado
    - Vendas em PIX, Cartão de Crédito e Débito não mostram o método de pagamento
    - A descrição em financeiro_fluxo não inclui como foi pago
    - Dificulta visualização de entradas por método de pagamento

  2. Solução
    - Atualizar função de registro para incluir método de pagamento na descrição
    - Formato: "Venda PDV #1234 - PIX - Cliente XYZ"
    - Formato: "Pedido Delivery #abcd1234 - Cartão Crédito - Cliente XYZ"

  3. Alterações
    - Modificar register_pdv_sale_in_cash_flow() para incluir payment_type
    - Modificar register_delivery_order_in_cash_flow() para incluir payment_method
*/

-- Função melhorada para formatar nome do método de pagamento
CREATE OR REPLACE FUNCTION format_payment_method(method text)
RETURNS text AS $$
BEGIN
  RETURN CASE method
    WHEN 'dinheiro' THEN 'Dinheiro'
    WHEN 'pix' THEN 'PIX'
    WHEN 'cartao_credito' THEN 'Cartão Crédito'
    WHEN 'cartao_debito' THEN 'Cartão Débito'
    WHEN 'misto' THEN 'Pagamento Misto'
    WHEN 'voucher' THEN 'Voucher'
    ELSE 'Outros'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar função para registrar venda do PDV no fluxo de caixa COM método de pagamento
CREATE OR REPLACE FUNCTION register_pdv_sale_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
  payment_method_label text;
BEGIN
  -- Identificar a loja pelo cash_register ou assumir loja1
  SELECT COALESCE(s.code, 'loja1') INTO store_code
  FROM pdv_cash_registers cr
  LEFT JOIN stores s ON cr.store_id = s.id
  WHERE cr.id = NEW.cash_register_id;
  
  IF store_code IS NULL THEN
    store_code := 'loja1';
  END IF;

  -- Formatar nome do método de pagamento (converter enum para text)
  payment_method_label := format_payment_method(NEW.payment_type::text);

  -- Registrar a venda no fluxo de caixa COM método de pagamento
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
    'Venda PDV #' || NEW.sale_number || ' - ' || payment_method_label || ' - ' || COALESCE(NEW.customer_name, 'Cliente não identificado'),
    NEW.total_amount,
    store_code,
    'Sistema PDV - Venda #' || NEW.sale_number
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função para registrar pedido do Delivery no fluxo de caixa COM método de pagamento
CREATE OR REPLACE FUNCTION register_delivery_order_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text;
  order_number text;
  payment_method_label text;
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

  -- Formatar nome do método de pagamento
  payment_method_label := format_payment_method(NEW.payment_method);

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
      'Pedido Delivery #' || order_number || ' - ' || payment_method_label || ' - ' || NEW.customer_name,
      NEW.total_price,
      store_code,
      'Sistema Delivery - Pedido #' || order_number
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar os triggers com as funções atualizadas
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

-- Atualizar registros existentes para incluir método de pagamento
-- VENDAS PDV
UPDATE financeiro_fluxo f
SET descricao = 
  'Venda PDV #' || s.sale_number || ' - ' || format_payment_method(s.payment_type::text) || ' - ' || COALESCE(s.customer_name, 'Cliente não identificado')
FROM pdv_sales s
WHERE f.tipo = 'sistema_entrada'
  AND f.descricao LIKE 'Venda PDV #' || s.sale_number || ' - ' || COALESCE(s.customer_name, 'Cliente não identificado')
  AND f.criado_por = 'Sistema PDV - Venda #' || s.sale_number
  AND s.is_cancelled = false;

-- PEDIDOS DELIVERY
UPDATE financeiro_fluxo f
SET descricao = 
  'Pedido Delivery #' || SUBSTRING(o.id::text FROM 1 FOR 8) || ' - ' || format_payment_method(o.payment_method) || ' - ' || o.customer_name
FROM orders o
WHERE f.tipo = 'sistema_entrada'
  AND f.descricao LIKE 'Pedido Delivery #' || SUBSTRING(o.id::text FROM 1 FOR 8) || ' - ' || o.customer_name
  AND f.criado_por = 'Sistema Delivery - Pedido #' || SUBSTRING(o.id::text FROM 1 FOR 8)
  AND o.status != 'cancelled';
