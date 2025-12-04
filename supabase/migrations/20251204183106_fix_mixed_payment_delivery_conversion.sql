/*
  # Corrigir conversão de mixed_payment_details no trigger de delivery

  ## Problema
  - O campo mixed_payment_details é do tipo TEXT na tabela orders
  - O trigger estava tentando usar jsonb_typeof em um campo TEXT
  - Isso causava falha na conversão e o valor total era registrado ao invés da parte em dinheiro

  ## Solução
  - Converter diretamente mixed_payment_details::jsonb
  - Remover verificação de tipo desnecessária
*/

-- Update trigger function to properly convert TEXT to JSONB
CREATE OR REPLACE FUNCTION link_delivery_order_to_cash_register()
RETURNS TRIGGER AS $$
DECLARE
  active_register_id uuid;
  payment_method text;
  cash_amount decimal(10,2);
  payment_detail jsonb;
  payment_details_jsonb jsonb;
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
    
    -- Convert TEXT to JSONB (mixed_payment_details is stored as TEXT)
    BEGIN
      payment_details_jsonb := NEW.mixed_payment_details::jsonb;
      
      -- Loop through payment details and sum money amounts
      FOR payment_detail IN SELECT * FROM jsonb_array_elements(payment_details_jsonb)
      LOOP
        IF payment_detail->>'method' = 'money' THEN
          cash_amount := cash_amount + (payment_detail->>'amount')::decimal(10,2);
        END IF;
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, log error and skip cash registration
      RAISE WARNING 'Failed to parse mixed_payment_details for order %: %', NEW.id, SQLERRM;
      RETURN NEW;
    END;
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