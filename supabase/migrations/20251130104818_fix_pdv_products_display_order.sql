/*
  # Corrigir ordem de exibição dos produtos PDV

  1. Atualização
    - Renumera todos os produtos PDV para ter display_order sequencial único
    - Ordena por display_order existente, depois por created_at para manter ordem lógica
  
  2. Objetivo
    - Garantir que cada produto tenha um display_order único
    - Permitir reordenação correta dos produtos no painel de administração
*/

-- Renumerar todos os produtos PDV com display_order sequencial
WITH ranked_products AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY display_order, created_at) as new_order
  FROM pdv_products
)
UPDATE pdv_products
SET display_order = ranked_products.new_order
FROM ranked_products
WHERE pdv_products.id = ranked_products.id;