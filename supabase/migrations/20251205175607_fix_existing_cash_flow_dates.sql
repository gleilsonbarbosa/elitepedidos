/*
  # Corrigir Datas Existentes no Fluxo de Caixa

  1. Problema
    - Vendas feitas entre 21:00 e 23:59 (horário BR) foram registradas com a data do dia seguinte
    - Exemplo: Venda às 21:30 do dia 04/12 foi salva como 05/12

  2. Solução
    - Recalcular o campo `data` usando o timezone correto
    - Atualizar todos os registros existentes no financeiro_fluxo
    - Usar: (criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date

  3. Segurança
    - Apenas atualiza registros onde a data está incorreta
    - Não afeta registros já corretos
*/

-- Recalcular a data correta para todos os registros no fluxo de caixa
UPDATE financeiro_fluxo
SET data = (criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
WHERE data != (criado_em AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date;