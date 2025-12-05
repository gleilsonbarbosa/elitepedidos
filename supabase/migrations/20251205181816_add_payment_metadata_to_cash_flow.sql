/*
  # Adicionar metadata de pagamento ao fluxo de caixa

  ## Alterações
  - Adicionar coluna metadata_pagamento para armazenar detalhes de pagamentos mistos
  - Permite exibir informações detalhadas sobre cada forma de pagamento utilizada
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financeiro_fluxo' 
    AND column_name = 'metadata_pagamento'
  ) THEN
    ALTER TABLE financeiro_fluxo ADD COLUMN metadata_pagamento jsonb;
  END IF;
END $$;

COMMENT ON COLUMN financeiro_fluxo.metadata_pagamento IS 'Detalhes adicionais do pagamento, especialmente para pagamento misto. Formato: {"formas": [{"metodo": "dinheiro", "valor": 50}, {"metodo": "pix", "valor": 30}]}';