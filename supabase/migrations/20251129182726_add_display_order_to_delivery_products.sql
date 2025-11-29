/*
  # Adicionar ordem de exibição aos produtos de delivery

  1. Alterações
    - Adiciona coluna `display_order` na tabela `delivery_products`
    - Define valor padrão como 999 (produtos sem ordem definida ficam no final)
    - Atualiza produtos existentes com ordem baseada no ID

  2. Motivo
    - Permitir que administradores organizem a ordem de exibição dos produtos
    - Facilitar destaque de produtos específicos na página de delivery
*/

-- Adicionar coluna display_order se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE delivery_products 
    ADD COLUMN display_order integer DEFAULT 999;
  END IF;
END $$;

-- Atualizar produtos existentes com ordem sequencial baseada no created_at
UPDATE delivery_products
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM delivery_products
) AS subquery
WHERE delivery_products.id = subquery.id
  AND delivery_products.display_order = 999;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX IF NOT EXISTS idx_delivery_products_display_order 
ON delivery_products(display_order, is_active);