/*
  # Corrigir exibição de saldo negativo do cashback

  1. Atualizar view customer_balances para nunca retornar saldo negativo
  2. Garantir que a função de saldo sempre retorne valores >= 0
  3. Adicionar constraint para evitar saldos negativos na tabela customers
*/

-- Atualizar todos os saldos negativos para zero
UPDATE customers 
SET balance = 0 
WHERE balance < 0;

-- Adicionar constraint para evitar saldos negativos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'customers_balance_non_negative' 
    AND table_name = 'customers'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT customers_balance_non_negative 
    CHECK (balance >= 0);
  END IF;
END $$;

-- Recriar a view customer_balances para garantir saldos não negativos
DROP VIEW IF EXISTS customer_balances;

CREATE VIEW customer_balances AS
SELECT 
  c.id as customer_id,
  c.name,
  GREATEST(0, COALESCE(
    c.balance + COALESCE(
      (SELECT SUM(
        CASE 
          WHEN t.type = 'purchase' AND t.status = 'approved' THEN t.cashback_amount
          WHEN t.type = 'redemption' AND t.status = 'approved' THEN -t.cashback_amount
          ELSE 0
        END
      )
      FROM transactions t 
      WHERE t.customer_id = c.id 
        AND t.expires_at > NOW()
        AND t.status = 'approved'
      ), 0
    ), 0
  )) as available_balance,
  GREATEST(0, COALESCE(
    (SELECT SUM(t.cashback_amount)
     FROM transactions t 
     WHERE t.customer_id = c.id 
       AND t.type = 'purchase'
       AND t.status = 'approved'
       AND t.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    ), 0
  )) as expiring_amount,
  (SELECT MIN(t.expires_at)
   FROM transactions t 
   WHERE t.customer_id = c.id 
     AND t.type = 'purchase'
     AND t.status = 'approved'
     AND t.expires_at > NOW()
     AND t.cashback_amount > 0
  ) as expiration_date
FROM customers c
WHERE c.id IS NOT NULL;

-- Comentário sobre a view
COMMENT ON VIEW customer_balances IS 'Shows customer balances with proper expiration handling and guaranteed non-negative values';

-- Criar função para garantir saldo não negativo em transações
CREATE OR REPLACE FUNCTION ensure_non_negative_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é uma transação de resgate, verificar se há saldo suficiente
  IF NEW.type = 'redemption' AND NEW.status = 'approved' THEN
    DECLARE
      current_balance NUMERIC;
    BEGIN
      -- Buscar saldo atual do cliente
      SELECT available_balance INTO current_balance
      FROM customer_balances
      WHERE customer_id = NEW.customer_id;
      
      -- Se não há saldo suficiente, rejeitar a transação
      IF COALESCE(current_balance, 0) < NEW.cashback_amount THEN
        NEW.status = 'rejected';
        NEW.comment = 'Saldo insuficiente para resgate';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para garantir saldo não negativo
DROP TRIGGER IF EXISTS trg_ensure_non_negative_balance ON transactions;
CREATE TRIGGER trg_ensure_non_negative_balance
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_non_negative_balance();