/*
  # Atualizar nomes das mesas

  1. Alterações
     - Atualizar nomes das mesas da Loja 1 para Mesa1, Mesa2, Mesa3, etc.
     - Atualizar nomes das mesas da Loja 2 para Mesa1, Mesa2, Mesa3, etc.
     - Manter numeração sequencial baseada no campo `number`

  2. Segurança
     - Usar UPDATE seguro para preservar dados existentes
     - Aplicar apenas se as mesas existirem
*/

-- Atualizar nomes das mesas da Loja 1 (store1_tables)
UPDATE store1_tables 
SET name = 'Mesa' || number::text
WHERE name != 'Mesa' || number::text;

-- Atualizar nomes das mesas da Loja 2 (store2_tables)  
UPDATE store2_tables
SET name = 'Mesa' || number::text
WHERE name != 'Mesa' || number::text;