/*
  # Adicionar campos de mensagem de fechamento temporário

  1. Modificações nas Tabelas
    - `store_hours`: Adicionar campo `temporary_closure_message` (opcional)
    - `store_settings`: Adicionar campo `global_closure_message` (opcional)
    
  2. Funcionalidades
    - Mensagem específica por dia da semana
    - Mensagem global para fechamento manual
    - Exibição destacada no delivery quando loja fechada
    
  3. Casos de Uso
    - Fechamento para manutenção
    - Fechamento por falta de energia
    - Fechamento por motivos especiais
    - Comunicação clara com clientes
*/

-- Adicionar campo de mensagem de fechamento temporário na tabela store_hours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_hours' AND column_name = 'temporary_closure_message'
  ) THEN
    ALTER TABLE store_hours ADD COLUMN temporary_closure_message TEXT;
  END IF;
END $$;

-- Adicionar campo de mensagem global de fechamento na tabela store_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'global_closure_message'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN global_closure_message TEXT;
  END IF;
END $$;

-- Adicionar comentários para documentar os novos campos
COMMENT ON COLUMN store_hours.temporary_closure_message IS 'Mensagem opcional exibida quando a loja está fechada neste dia específico';
COMMENT ON COLUMN store_settings.global_closure_message IS 'Mensagem global exibida quando a loja está fechada manualmente (is_open_now = false)';