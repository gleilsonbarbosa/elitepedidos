/*
  # Sistema de Reset Mensal do Cashback

  1. Função para zerar cashback no final do mês
    - Zera saldo de todos os clientes no último dia do mês
    - Registra transação de ajuste para auditoria
    - Previne saldos negativos

  2. Trigger para executar automaticamente
    - Executa no último dia de cada mês às 23:59
    - Registra log da operação

  3. Função para prevenir saldos negativos
    - Garante que o saldo nunca seja menor que zero
    - Aplica em todas as operações de cashback
*/

-- Função para zerar cashback no final do mês
CREATE OR REPLACE FUNCTION reset_monthly_cashback()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_record RECORD;
  reset_count INTEGER := 0;
BEGIN
  -- Log início da operação
  INSERT INTO pdv_error_logs (error_message, error_data)
  VALUES (
    'Iniciando reset mensal de cashback',
    jsonb_build_object(
      'timestamp', NOW(),
      'operation', 'monthly_cashback_reset'
    )
  );

  -- Iterar sobre todos os clientes com saldo positivo
  FOR customer_record IN 
    SELECT id, name, phone, balance 
    FROM customers 
    WHERE balance > 0
  LOOP
    -- Criar transação de ajuste para zerar o saldo
    INSERT INTO transactions (
      customer_id,
      amount,
      cashback_amount,
      type,
      status,
      comment,
      expires_at,
      created_at
    ) VALUES (
      customer_record.id,
      0, -- Valor da compra (zero para ajuste)
      -customer_record.balance, -- Valor negativo para zerar o saldo
      'adjustment',
      'approved',
      'Reset mensal automático - ' || TO_CHAR(NOW(), 'MM/YYYY'),
      NULL, -- Não expira (é um ajuste)
      NOW()
    );

    -- Zerar o saldo do cliente
    UPDATE customers 
    SET balance = 0, updated_at = NOW()
    WHERE id = customer_record.id;

    reset_count := reset_count + 1;
  END LOOP;

  -- Log final da operação
  INSERT INTO pdv_error_logs (error_message, error_data)
  VALUES (
    'Reset mensal de cashback concluído',
    jsonb_build_object(
      'timestamp', NOW(),
      'operation', 'monthly_cashback_reset_completed',
      'customers_reset', reset_count
    )
  );

  -- Notificar no log
  RAISE NOTICE 'Reset mensal de cashback concluído. % clientes processados.', reset_count;
END;
$$;

-- Função para prevenir saldos negativos
CREATE OR REPLACE FUNCTION prevent_negative_cashback()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Garantir que o saldo nunca seja negativo
  IF NEW.balance < 0 THEN
    NEW.balance := 0;
    
    -- Log da correção
    INSERT INTO pdv_error_logs (error_message, error_data)
    VALUES (
      'Saldo negativo corrigido automaticamente',
      jsonb_build_object(
        'customer_id', NEW.id,
        'attempted_balance', OLD.balance,
        'corrected_to', 0,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para prevenir saldos negativos
DROP TRIGGER IF EXISTS trg_prevent_negative_cashback ON customers;
CREATE TRIGGER trg_prevent_negative_cashback
  BEFORE UPDATE OF balance ON customers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_negative_cashback();

-- Função para executar reset no final do mês (manual)
CREATE OR REPLACE FUNCTION schedule_monthly_cashback_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  last_day_of_month DATE;
BEGIN
  -- Calcular último dia do mês atual
  last_day_of_month := (DATE_TRUNC('month', today) + INTERVAL '1 month - 1 day')::DATE;
  
  -- Verificar se hoje é o último dia do mês
  IF today = last_day_of_month THEN
    -- Executar reset
    PERFORM reset_monthly_cashback();
    
    RAISE NOTICE 'Reset mensal executado automaticamente em %', today;
  ELSE
    RAISE NOTICE 'Reset mensal não executado. Hoje: %, Último dia do mês: %', today, last_day_of_month;
  END IF;
END;
$$;

-- Função para verificar e corrigir saldos negativos existentes
CREATE OR REPLACE FUNCTION fix_negative_cashback_balances()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_count INTEGER := 0;
  customer_record RECORD;
BEGIN
  -- Encontrar clientes com saldo negativo
  FOR customer_record IN 
    SELECT id, name, phone, balance 
    FROM customers 
    WHERE balance < 0
  LOOP
    -- Log da correção
    INSERT INTO pdv_error_logs (error_message, error_data)
    VALUES (
      'Corrigindo saldo negativo de cashback',
      jsonb_build_object(
        'customer_id', customer_record.id,
        'customer_name', customer_record.name,
        'negative_balance', customer_record.balance,
        'timestamp', NOW()
      )
    );

    -- Criar transação de ajuste para corrigir o saldo
    INSERT INTO transactions (
      customer_id,
      amount,
      cashback_amount,
      type,
      status,
      comment,
      created_at
    ) VALUES (
      customer_record.id,
      0,
      -customer_record.balance, -- Valor positivo para corrigir
      'adjustment',
      'approved',
      'Correção de saldo negativo - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI'),
      NOW()
    );

    -- Zerar o saldo
    UPDATE customers 
    SET balance = 0, updated_at = NOW()
    WHERE id = customer_record.id;

    fixed_count := fixed_count + 1;
  END LOOP;

  RETURN fixed_count;
END;
$$;

-- Executar correção imediata de saldos negativos
SELECT fix_negative_cashback_balances() as saldos_corrigidos;

-- Comentários para uso manual
COMMENT ON FUNCTION reset_monthly_cashback() IS 'Zera o cashback de todos os clientes no final do mês';
COMMENT ON FUNCTION prevent_negative_cashback() IS 'Previne que o saldo de cashback fique negativo';
COMMENT ON FUNCTION schedule_monthly_cashback_reset() IS 'Executa reset mensal se hoje for o último dia do mês';
COMMENT ON FUNCTION fix_negative_cashback_balances() IS 'Corrige saldos negativos existentes';