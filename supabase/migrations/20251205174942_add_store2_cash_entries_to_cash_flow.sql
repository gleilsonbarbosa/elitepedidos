/*
  # Registrar Entradas/Saídas Manuais da Loja 2 no Fluxo Financeiro

  1. Problema
    - Entradas e saídas manuais do caixa da Loja 2 (tabela pdv2_cash_entries) não aparecem no Histórico de Movimentações
    - A Loja 2 tem suas próprias tabelas separadas
    - Operadores da Loja 2 adicionam entradas/saídas manualmente mas não aparecem no fluxo

  2. Solução
    - Criar trigger para registrar entradas/saídas manuais da Loja 2 no financeiro_fluxo
    - Registrar com tipo 'entrada' ou 'saida' conforme o tipo da movimentação
    - Incluir método de pagamento quando disponível
    - Marcar como loja='loja2'
    - Remover automaticamente ao deletar entrada manual

  3. Funcionalidades
    - Registro automático ao criar entrada manual na Loja 2
    - Remoção automática ao deletar entrada manual da Loja 2
    - Identificação sempre como 'loja2'
    - Mapear forma de pagamento corretamente
*/

-- Função para registrar entrada manual do caixa da Loja 2 no fluxo de caixa
CREATE OR REPLACE FUNCTION register_store2_cash_entry_in_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  entry_type text;
BEGIN
  -- Mapear tipo de entrada/saída
  IF NEW.type = 'income' THEN
    entry_type := 'receita';
  ELSIF NEW.type = 'expense' THEN
    entry_type := 'despesa';
  ELSE
    entry_type := NEW.type;
  END IF;

  -- Registrar a entrada/saída no fluxo de caixa (sempre loja2)
  INSERT INTO financeiro_fluxo (
    data,
    tipo,
    descricao,
    valor,
    loja,
    criado_por,
    forma_pagamento
  ) VALUES (
    NEW.created_at::date,
    entry_type,
    NEW.description,
    NEW.amount,
    'loja2',
    'Operador Caixa Loja 2 - ' || entry_type,
    NEW.payment_method
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover entrada manual da Loja 2 do fluxo de caixa ao deletar
CREATE OR REPLACE FUNCTION remove_store2_cash_entry_from_cash_flow()
RETURNS TRIGGER AS $$
DECLARE
  entry_type text;
BEGIN
  -- Mapear tipo de entrada/saída
  IF OLD.type = 'income' THEN
    entry_type := 'receita';
  ELSIF OLD.type = 'expense' THEN
    entry_type := 'despesa';
  ELSE
    entry_type := OLD.type;
  END IF;

  -- Remover entrada do fluxo de caixa
  DELETE FROM financeiro_fluxo
  WHERE tipo = entry_type
    AND descricao = OLD.description
    AND valor = OLD.amount
    AND criado_por = 'Operador Caixa Loja 2 - ' || entry_type
    AND data = OLD.created_at::date
    AND loja = 'loja2';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trg_register_store2_cash_entry_in_flow ON pdv2_cash_entries;
DROP TRIGGER IF EXISTS trg_remove_store2_cash_entry_from_flow ON pdv2_cash_entries;

-- Criar triggers para entradas manuais do caixa da Loja 2
CREATE TRIGGER trg_register_store2_cash_entry_in_flow
  AFTER INSERT ON pdv2_cash_entries
  FOR EACH ROW
  WHEN (NEW.description NOT LIKE 'Venda #%' AND NEW.description NOT LIKE 'Delivery #%')
  EXECUTE FUNCTION register_store2_cash_entry_in_cash_flow();

CREATE TRIGGER trg_remove_store2_cash_entry_from_flow
  AFTER DELETE ON pdv2_cash_entries
  FOR EACH ROW
  WHEN (OLD.description NOT LIKE 'Venda #%' AND OLD.description NOT LIKE 'Delivery #%')
  EXECUTE FUNCTION remove_store2_cash_entry_from_cash_flow();

-- Comentário: Os triggers agora estão ativos e registrarão automaticamente:
-- 1. Entradas manuais adicionadas pelo operador de caixa da Loja 2
-- 2. Saídas manuais adicionadas pelo operador de caixa da Loja 2
-- 3. Removerão entradas ao deletar movimentações manuais da Loja 2
-- 
-- IMPORTANTE: Vendas automáticas (Venda #XX e Delivery #XX) são ignoradas
-- pois já possuem seus próprios triggers específicos.
