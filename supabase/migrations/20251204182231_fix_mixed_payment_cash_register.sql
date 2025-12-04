/*
  # Corrigir registro de pagamentos mistos no controle de caixa

  ## Alterações
  - Atualizar trigger `link_sale_to_cash_register` para processar pagamentos mistos
  - Quando payment_type='misto', extrair e registrar apenas a parte em dinheiro no caixa
  - Verificar o campo payment_details para obter informações dos pagamentos

  ## Detalhes
  - payment_details deve conter um array JSON com cada método de pagamento e valor
  - Formato esperado: [{"method":"money","method_display":"Dinheiro","amount":50}]
  - Apenas valores com method="money" são registrados no caixa físico
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_link_sale_to_cash_register ON pdv_sales;

-- Update trigger function to handle mixed payments
CREATE OR REPLACE FUNCTION link_sale_to_cash_register()
RETURNS TRIGGER AS $$
DECLARE
  active_register_id uuid;
  cash_amount decimal(10,2);
  payment_detail jsonb;
BEGIN
  cash_amount := 0;
  
  -- Determine cash amount based on payment type
  IF NEW.payment_type = 'dinheiro' THEN
    -- All amount is cash
    cash_amount := NEW.total_amount;
  ELSIF NEW.payment_type = 'misto' AND NEW.payment_details IS NOT NULL THEN
    -- Extract cash amount from mixed payment details
    FOR payment_detail IN SELECT * FROM jsonb_array_elements(NEW.payment_details)
    LOOP
      IF payment_detail->>'method' = 'money' THEN
        cash_amount := cash_amount + (payment_detail->>'amount')::decimal(10,2);
      END IF;
    END LOOP;
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

-- Recreate trigger
CREATE TRIGGER trg_link_sale_to_cash_register
  AFTER INSERT ON pdv_sales
  FOR EACH ROW
  EXECUTE FUNCTION link_sale_to_cash_register();