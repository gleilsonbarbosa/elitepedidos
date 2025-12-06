/*
  # Adicionar badge "Mais Pedido" aos produtos

  1. Alterações
    - Adiciona coluna `is_most_ordered` à tabela `delivery_products`
    - Define valor padrão como `false`
    - Marca o produto AÇAÍ DE 17,60 (400G) como "Mais Pedido"

  2. Notas
    - O badge será exibido no card do produto quando `is_most_ordered` for true
    - Apenas produtos marcados especificamente terão o badge
*/

-- Adicionar coluna para marcar produtos como "Mais Pedido"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_products' AND column_name = 'is_most_ordered'
  ) THEN
    ALTER TABLE delivery_products 
    ADD COLUMN is_most_ordered boolean DEFAULT false;
  END IF;
END $$;

-- Marcar o produto AÇAÍ DE 17,60 (400G) como "Mais Pedido"
UPDATE delivery_products 
SET is_most_ordered = true 
WHERE id = '2ebdfcd4-397a-43d6-98fa-c33a4153a7ae';