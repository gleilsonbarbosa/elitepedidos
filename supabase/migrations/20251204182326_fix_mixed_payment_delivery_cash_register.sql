/*
  # Corrigir registro de pagamentos mistos de delivery no controle de caixa

  ## Alterações
  - Atualizar trigger `link_delivery_order_to_cash_register` para processar pagamentos mistos
  - Quando payment_method='mixed', extrair e registrar apenas a parte em dinheiro no caixa
  - Verificar o campo mixed_payment_details para obter informações dos pagamentos

  ## Detalhes
  - mixed_payment_details deve conter um array JSON com cada método de pagamento e valor
  - Formato esperado: [{"method":"money","method_display":"Dinheiro","amount":50}]
  - Apenas valores com method="money" são registrados no caixa físico
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_link_delivery_order_to_cash_register ON orders;

-- Update trigger function to handle mixed payments
CREATE OR REPLACE FUNCTION link_delivery_order_to_cash_register()
RETURNS TRIGGER AS $$
DECLARE
  active_register_id uuid;
  payment_method text;
  cash_amount decimal(10,2);
  payment_detail jsonb;
BEGIN
  cash_amount := 0;
  
  -- Determine cash amount based on payment method
  IF NEW.payment_method = 'money' THEN
    -- All amount is cash
    cash_amount := NEW.total_price;
    payment_method := 'dinheiro';
  ELSIF NEW.payment_method = 'mixed' AND NEW.mixed_payment_details IS NOT NULL THEN
    -- Extract cash amount from mixed payment details
    payment_method := 'dinheiro';
    FOR payment_detail IN SELECT * FROM jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(NEW.mixed_payment_details) = 'string' 
        THEN (NEW.mixed_payment_details::text)::jsonb
        ELSE NEW.mixed_payment_details
      END
    )
    LOOP
      IF payment_detail->>'method' = 'money' THEN
        cash_amount := cash_amount + (payment_detail->>'amount')::decimal(10,2);
      END IF;
    END LOOP;
  ELSE
    -- For other payment methods, map appropriately
    CASE NEW.payment_method
      WHEN 'pix' THEN payment_method := 'pix';
      WHEN 'card' THEN payment_method := 'cartao_credito';
      ELSE payment_method := 'outros';
    END CASE;
    -- Non-cash payments don't go into cash register
    cash_amount := 0;
  END IF;
  
  -- Only register if there's cash involved
  IF cash_amount > 0 THEN
    -- Get active cash register
    active_register_id := get_active_cash_register();
    
    -- If there's an active register, create a cash entry
    IF active_register_id IS NOT NULL THEN
      -- Log the cash portion as an income entry in the cash register
      INSERT INTO pdv_cash_entries (
        register_id,
        type,
        amount,
        description,
        payment_method,
        created_at
      ) VALUES (
        active_register_id,
        'income',
        cash_amount,
        'Delivery #' || substring(NEW.id::text, 1, 8) || CASE 
          WHEN NEW.payment_method = 'mixed' THEN ' (parte em dinheiro)'
          ELSE ''
        END,
        payment_method,
        NEW.created_at
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trg_link_delivery_order_to_cash_register
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION link_delivery_order_to_cash_register();