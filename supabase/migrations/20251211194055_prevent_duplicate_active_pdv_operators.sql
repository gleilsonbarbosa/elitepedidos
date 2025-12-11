/*
  # Prevenir duplicação de operadores PDV ativos
  
  ## Alterações
  - Remove constraint antiga de unicidade em code
  - Adiciona nova constraint que permite códigos duplicados apenas se inativos
  - Garante que apenas 1 operador com mesmo código pode estar ativo
  
  ## Segurança
  - Mantém integridade dos dados
  - Previne problemas de login por duplicação
*/

-- Primeiro, vamos garantir que não há duplicados ativos
-- Desativar quaisquer duplicados, mantendo apenas o mais antigo ativo
WITH duplicates AS (
  SELECT 
    UPPER(code) as upper_code,
    MIN(created_at) as first_created
  FROM pdv_operators
  WHERE is_active = true
  GROUP BY UPPER(code)
  HAVING COUNT(*) > 1
)
UPDATE pdv_operators op
SET is_active = false
FROM duplicates d
WHERE UPPER(op.code) = d.upper_code
  AND op.is_active = true
  AND op.created_at > d.first_created;

-- Remover a constraint antiga se existir
ALTER TABLE pdv_operators 
  DROP CONSTRAINT IF EXISTS pdv_operators_code_key;

-- Criar um índice único parcial que permite múltiplos códigos inativos
-- mas apenas 1 ativo por código (case-insensitive)
DROP INDEX IF EXISTS pdv_operators_unique_active_code;

CREATE UNIQUE INDEX pdv_operators_unique_active_code
  ON pdv_operators (UPPER(code))
  WHERE is_active = true;

-- Comentários
COMMENT ON INDEX pdv_operators_unique_active_code IS 
  'Garante que apenas um operador com o mesmo código pode estar ativo por vez (case-insensitive)';

-- Verificar resultado
SELECT 
  UPPER(code) as code, 
  COUNT(*) as total_active 
FROM pdv_operators 
WHERE is_active = true 
GROUP BY UPPER(code) 
HAVING COUNT(*) > 1;
