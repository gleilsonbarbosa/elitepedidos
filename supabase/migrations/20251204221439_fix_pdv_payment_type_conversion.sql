/*
  # Corrigir Conversão de Tipo de Pagamento na Função RPC do PDV

  1. Problema Identificado
    - Função process_pdv_sale faz cast direto: (sale_data->>'payment_type')::pdv_payment_type
    - Se receber valores em inglês (cash, card, etc.), falha
    
  2. Solução
    - Adicionar função auxiliar para mapear valores antes do cast
    - Aceitar valores em português E inglês
    - Converter tudo para português antes de salvar
*/

-- Criar função auxiliar para mapear payment_type
CREATE OR REPLACE FUNCTION map_payment_type(input_type text)
RETURNS pdv_payment_type AS $$
BEGIN
  RETURN CASE input_type
    -- Valores em português (corretos)
    WHEN 'dinheiro' THEN 'dinheiro'::pdv_payment_type
    WHEN 'pix' THEN 'pix'::pdv_payment_type
    WHEN 'cartao_credito' THEN 'cartao_credito'::pdv_payment_type
    WHEN 'cartao_debito' THEN 'cartao_debito'::pdv_payment_type
    WHEN 'voucher' THEN 'voucher'::pdv_payment_type
    WHEN 'misto' THEN 'misto'::pdv_payment_type
    -- Valores em inglês (suporte legado)
    WHEN 'cash' THEN 'dinheiro'::pdv_payment_type
    WHEN 'money' THEN 'dinheiro'::pdv_payment_type
    WHEN 'card' THEN 'cartao_credito'::pdv_payment_type
    WHEN 'credit_card' THEN 'cartao_credito'::pdv_payment_type
    WHEN 'debit_card' THEN 'cartao_debito'::pdv_payment_type
    WHEN 'mixed' THEN 'misto'::pdv_payment_type
    -- Valor padrão
    ELSE 'dinheiro'::pdv_payment_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar função process_pdv_sale para usar a conversão
CREATE OR REPLACE FUNCTION process_pdv_sale(sale_data jsonb, items_data jsonb)
RETURNS jsonb AS $$
DECLARE
  new_sale_id uuid;
  new_sale_number integer;
  operator_id uuid;
  active_register_id uuid;
  result jsonb;
BEGIN
  -- Check for active register for all payment types
  active_register_id := get_active_cash_register();
  
  IF active_register_id IS NULL THEN
    -- No active cash register
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não há caixa aberto. Por favor, abra o caixa antes de realizar vendas.',
      'error_code', 'NO_ACTIVE_REGISTER'
    );
  END IF;
  
  -- Get operator ID or use default
  IF sale_data->>'operator_id' = 'admin-id' OR sale_data->>'operator_id' IS NULL THEN
    operator_id := get_default_operator_id();
  ELSE
    BEGIN
      operator_id := (sale_data->>'operator_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      operator_id := get_default_operator_id();
    END;
  END IF;
  
  -- Insert the sale (usando map_payment_type)
  INSERT INTO pdv_sales (
    operator_id,
    customer_name,
    customer_phone,
    subtotal,
    discount_amount,
    discount_percentage,
    total_amount,
    payment_type,
    payment_details,
    change_amount,
    notes,
    is_cancelled,
    channel,
    cash_register_id
  ) VALUES (
    operator_id,
    sale_data->>'customer_name',
    sale_data->>'customer_phone',
    (sale_data->>'subtotal')::decimal,
    (sale_data->>'discount_amount')::decimal,
    (sale_data->>'discount_percentage')::decimal,
    (sale_data->>'total_amount')::decimal,
    map_payment_type(sale_data->>'payment_type'),
    sale_data->'payment_details',
    (sale_data->>'change_amount')::decimal,
    sale_data->>'notes',
    COALESCE((sale_data->>'is_cancelled')::boolean, false),
    COALESCE(sale_data->>'channel', 'pdv'),
    active_register_id
  )
  RETURNING id, sale_number INTO new_sale_id, new_sale_number;
  
  -- Insert sale items
  FOR i IN 0..jsonb_array_length(items_data) - 1 LOOP
    INSERT INTO pdv_sale_items (
      sale_id,
      product_id,
      product_code,
      product_name,
      quantity,
      weight_kg,
      unit_price,
      price_per_gram,
      discount_amount,
      subtotal
    ) VALUES (
      new_sale_id,
      (items_data->i->>'product_id')::uuid,
      items_data->i->>'product_code',
      items_data->i->>'product_name',
      (items_data->i->>'quantity')::decimal,
      (items_data->i->>'weight_kg')::decimal,
      (items_data->i->>'unit_price')::decimal,
      (items_data->i->>'price_per_gram')::decimal,
      (items_data->i->>'discount_amount')::decimal,
      (items_data->i->>'subtotal')::decimal
    );
  END LOOP;
  
  -- Return the result
  SELECT jsonb_build_object(
    'id', new_sale_id,
    'sale_number', new_sale_number,
    'success', true,
    'message', 'Sale created successfully'
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  PERFORM log_pdv_error(SQLERRM, jsonb_build_object(
    'sale_data', sale_data,
    'items_data', items_data,
    'error', SQLERRM,
    'context', 'process_pdv_sale function'
  ));
  
  -- Return error
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;