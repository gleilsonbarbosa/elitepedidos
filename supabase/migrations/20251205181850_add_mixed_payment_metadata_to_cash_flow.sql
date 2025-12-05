/*
  # Adicionar metadata de pagamento misto ao fluxo de caixa

  ## Alterações
  - Atualizar função register_pdv_sale_in_cash_flow para incluir metadata
  - Atualizar função register_delivery_cash_entries para incluir metadata
  - Metadata inclui detalhes de cada forma de pagamento no pagamento misto
*/

-- Atualizar função para vendas PDV
CREATE OR REPLACE FUNCTION register_pdv_sale_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  store_code text := 'loja1';
  payment_detail jsonb;
  mixed_payments_array jsonb;
  metadata_json jsonb;
BEGIN
  -- Identificar a loja
  IF NEW.channel = 'loja2' OR NEW.channel = 'store2' THEN
    store_code := 'loja2';
  END IF;

  -- Para pagamento misto, processar cada método
  IF NEW.payment_type = 'misto' AND NEW.payment_details IS NOT NULL THEN
    mixed_payments_array := NEW.payment_details->'mixed_payments';
    
    IF mixed_payments_array IS NOT NULL AND jsonb_typeof(mixed_payments_array) = 'array' THEN
      -- Criar metadata com detalhes de todas as formas de pagamento
      metadata_json := jsonb_build_object('formas', '[]'::jsonb);
      
      FOR payment_detail IN SELECT * FROM jsonb_array_elements(mixed_payments_array)
      LOOP
        -- Adicionar cada forma de pagamento ao metadata
        metadata_json := jsonb_set(
          metadata_json,
          '{formas}',
          (metadata_json->'formas') || jsonb_build_object(
            'metodo', payment_detail->>'method',
            'valor', (payment_detail->>'amount')::decimal(10,2)
          )
        );
      END LOOP;
      
      -- Registrar no fluxo de caixa com metadata
      INSERT INTO financeiro_fluxo (
        data,
        tipo,
        descricao,
        valor,
        forma_pagamento,
        metadata_pagamento,
        loja,
        criado_por
      ) VALUES (
        NEW.created_at::date,
        'sistema_entrada',
        'Venda PDV #' || NEW.sale_number || COALESCE(' - ' || NEW.customer_name, ''),
        NEW.total_amount,
        'misto',
        metadata_json,
        store_code,
        'Sistema PDV'
      );
    END IF;
  ELSE
    -- Para outros tipos de pagamento, registrar normalmente
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
      'Venda PDV #' || NEW.sale_number || COALESCE(' - ' || NEW.customer_name, ''),
      NEW.total_amount,
      NEW.payment_type::text,
      store_code,
      'Sistema PDV'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função para pedidos delivery com pagamento misto
CREATE OR REPLACE FUNCTION remove_delivery_order_from_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  order_number text;
  store_code text;
  payment_details_jsonb jsonb;
  payment_detail jsonb;
  metadata_json jsonb;
BEGIN
  order_number := SUBSTRING(NEW.id::text FROM 1 FOR 8);
  
  -- Se o pedido foi cancelado, remover do fluxo de caixa
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    DELETE FROM financeiro_fluxo
    WHERE tipo = 'sistema_entrada'
      AND descricao LIKE 'Pedido Delivery #' || order_number || '%'
      AND criado_por = 'Sistema Delivery - Pedido #' || order_number;
  END IF;
  
  -- Se o status mudou de pending/cancelled para um status confirmado, registrar no fluxo
  IF NEW.status IN ('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered')
     AND OLD.status NOT IN ('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered') THEN
    
    -- Identificar a loja
    SELECT COALESCE(s.code, 'loja1') INTO store_code
    FROM stores s
    WHERE s.id = NEW.store_id;
    
    IF store_code IS NULL THEN
      store_code := 'loja1';
    END IF;
    
    -- Verificar se já não existe um registro (evitar duplicatas)
    IF NOT EXISTS (
      SELECT 1 FROM financeiro_fluxo
      WHERE tipo = 'sistema_entrada'
        AND descricao LIKE 'Pedido Delivery #' || order_number || '%'
        AND criado_por = 'Sistema Delivery - Pedido #' || order_number
    ) THEN
      -- Para pagamento misto, incluir metadata
      IF NEW.payment_method = 'mixed' AND NEW.mixed_payment_details IS NOT NULL THEN
        BEGIN
          payment_details_jsonb := NEW.mixed_payment_details::jsonb;
          metadata_json := jsonb_build_object('formas', '[]'::jsonb);
          
          FOR payment_detail IN SELECT * FROM jsonb_array_elements(payment_details_jsonb)
          LOOP
            metadata_json := jsonb_set(
              metadata_json,
              '{formas}',
              (metadata_json->'formas') || jsonb_build_object(
                'metodo', payment_detail->>'method',
                'valor', (payment_detail->>'amount')::decimal(10,2)
              )
            );
          END LOOP;
          
          -- Registrar no fluxo de caixa com metadata
          INSERT INTO financeiro_fluxo (
            data,
            tipo,
            descricao,
            valor,
            forma_pagamento,
            metadata_pagamento,
            loja,
            criado_por
          ) VALUES (
            NEW.created_at::date,
            'sistema_entrada',
            'Pedido Delivery #' || order_number || ' - ' || NEW.customer_name,
            NEW.total_price,
            'misto',
            metadata_json,
            store_code,
            'Sistema Delivery - Pedido #' || order_number
          );
        EXCEPTION WHEN OTHERS THEN
          -- Se falhar ao processar metadata, registrar sem ela
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
            'misto',
            store_code,
            'Sistema Delivery - Pedido #' || order_number
          );
        END;
      ELSE
        -- Registrar no fluxo de caixa normalmente
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
          COALESCE(NEW.payment_method, 'dinheiro'),
          store_code,
          'Sistema Delivery - Pedido #' || order_number
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;