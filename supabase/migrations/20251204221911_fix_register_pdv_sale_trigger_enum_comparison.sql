/*
  # Corrigir Trigger register_pdv_sale_in_cash_flow

  1. Problema Identificado
    - Trigger tenta comparar enum pdv_payment_type com strings como 'cash'
    - NEW.payment_type já é um enum convertido, não pode comparar com valores inválidos
    - Erro: "invalid input value for enum pdv_payment_type: 'cash'"
    
  2. Solução
    - Remover comparações com valores em inglês do CASE
    - NEW.payment_type já vem convertido pela função map_payment_type
    - Apenas mapear valores válidos do enum para exibição
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

  -- NEW.payment_type já é um enum pdv_payment_type, apenas converter para text
  payment_method := NEW.payment_type::text;

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