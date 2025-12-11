/*
  # Adicionar categoria Salgados
  
  ## Alterações
  - Adiciona 'salgados' ao enum product_category
  - Permite que produtos sejam categorizados como salgados
  
  ## Segurança
  - Mantém integridade dos dados existentes
  - Não afeta produtos já cadastrados
*/

-- Adicionar o valor 'salgados' ao enum product_category
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'salgados';

-- Comentário
COMMENT ON TYPE product_category IS 
  'Categorias de produtos disponíveis: acai, combo, milkshake, vitamina, salgados, sorvetes, bebidas';
