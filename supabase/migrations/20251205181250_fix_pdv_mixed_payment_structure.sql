/*
  # Corrigir estrutura de payment_details para pagamento misto

  ## Problema
  - PDVSalesScreen envia payment_details como: {"mixed_payments": [...]}
  - Trigger espera payment_details como um array direto: [...]
  
  ## Solução
  - Atualizar trigger para acessar payment_details->>'mixed_payments'
*/

CREATE OR REPLACE FUNCTION link_sale_to_cash_register()
RETURNS TRIGGER AS $$
DECLARE
  active_register_id uuid;
  cash_amount decimal(10,2);
  payment_detail jsonb;
  mixed_payments_array jsonb;
BEGIN
  cash_amount := 0;

  -- Determine cash amount based on payment type
  IF NEW.payment_type = 'dinheiro' THEN
    -- All amount is cash
    cash_amount := NEW.total_amount;
  ELSIF NEW.payment_type = 'misto' AND NEW.payment_details IS NOT NULL THEN
    -- Extract mixed_payments array from payment_details
    -- Format: {"mixed_payments": [{"method": "dinheiro", "amount": 50}]}
    mixed_payments_array := NEW.payment_details->'mixed_payments';
    
    -- If mixed_payments exists and is an array, process it
    IF mixed_payments_array IS NOT NULL AND jsonb_typeof(mixed_payments_array) = 'array' THEN
      FOR payment_detail IN SELECT * FROM jsonb_array_elements(mixed_payments_array)
      LOOP
        IF payment_detail->>'method' = 'dinheiro' THEN
          cash_amount := cash_amount + (payment_detail->>'amount')::decimal(10,2);
        END IF;
      END LOOP;
    END IF;
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
        'Venda #' || NEW.sale_number || CASE 
          WHEN NEW.payment_type = 'misto' THEN ' (parte em dinheiro)'
          ELSE ''
        END,
        'dinheiro',
        NEW.created_at
      );
    ELSE
      -- Log warning if no active register
      PERFORM log_pdv_error('No active cash register for sale', jsonb_build_object(
        'sale_id', NEW.id,
        'sale_number', NEW.sale_number,
        'total_amount', NEW.total_amount,
        'cash_amount', cash_amount,
        'payment_type', NEW.payment_type
      ));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;