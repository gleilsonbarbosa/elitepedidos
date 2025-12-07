/*
  # Adicionar Trigger para Atualizar Fluxo Financeiro Quando Entrada do Caixa é Editada

  1. Problema Identificado
    - Quando uma entrada de caixa (pdv_cash_entries) tem sua forma de pagamento ou valores editados,
      o registro correspondente no financeiro_fluxo não é atualizado
    - Isso causa inconsistência entre o saldo do caixa e o histórico de movimentações
    - O trigger existente só cobre INSERT e DELETE, não UPDATE

  2. Solução
    - Criar trigger AFTER UPDATE para sincronizar mudanças em pdv_cash_entries com financeiro_fluxo
    - Atualizar forma de pagamento, valor e descrição quando uma entrada é modificada
    - Manter integridade entre as duas tabelas

  3. Funcionalidades
    - Atualização automática ao editar entrada manual do caixa
    - Sincronização de payment_method, amount e description
    - Apenas para entradas manuais (não vendas automáticas)
*/

-- Função para atualizar entrada manual do caixa no fluxo financeiro
CREATE OR REPLACE FUNCTION update_cash_entry_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  entry_type_old text;
  entry_type_new text;
BEGIN
  -- Mapear tipo de entrada/saída antigo
  IF OLD.type = 'income' THEN
    entry_type_old := 'receita';
  ELSIF OLD.type = 'expense' THEN
    entry_type_old := 'despesa';
  ELSE
    entry_type_old := OLD.type;
  END IF;

  -- Mapear tipo de entrada/saída novo
  IF NEW.type = 'income' THEN
    entry_type_new := 'receita';
  ELSIF NEW.type = 'expense' THEN
    entry_type_new := 'despesa';
  ELSE
    entry_type_new := NEW.type;
  END IF;

  -- Atualizar entrada no fluxo de caixa
  UPDATE financeiro_fluxo
  SET
    tipo = entry_type_new,
    descricao = NEW.description,
    valor = NEW.amount,
    forma_pagamento = NEW.payment_method,
    criado_por = 'Operador Caixa - ' || entry_type_new
  WHERE tipo = entry_type_old
    AND descricao = OLD.description
    AND valor = OLD.amount
    AND criado_por = 'Operador Caixa - ' || entry_type_old
    AND data = OLD.created_at::date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_update_cash_entry_in_flow ON pdv_cash_entries;

-- Criar trigger para atualizar entradas manuais do caixa
CREATE TRIGGER trg_update_cash_entry_in_flow
  AFTER UPDATE ON pdv_cash_entries
  FOR EACH ROW
  WHEN (
    OLD.description NOT LIKE 'Venda #%' AND
    OLD.description NOT LIKE 'Delivery #%' AND
    (
      OLD.payment_method IS DISTINCT FROM NEW.payment_method OR
      OLD.amount IS DISTINCT FROM NEW.amount OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.type IS DISTINCT FROM NEW.type
    )
  )
  EXECUTE FUNCTION update_cash_entry_in_cash_flow();

-- Comentário: O trigger está ativo e atualizará automaticamente:
-- 1. Forma de pagamento ao editar entrada manual
-- 2. Valor ao editar entrada manual
-- 3. Descrição ao editar entrada manual
-- 4. Tipo (receita/despesa) ao editar entrada manual
--
-- IMPORTANTE: Apenas entradas manuais serão atualizadas.
-- Vendas automáticas (Venda #XX e Delivery #XX) são ignoradas.
