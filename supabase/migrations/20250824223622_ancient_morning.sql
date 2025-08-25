/*
  # Corrigir numeração das mesas

  1. Alterações
     - Mesa 15 → Mesa 2 (number = 15 → number = 2, name = "Mesa15" → name = "Mesa2")
     - Mesa 16 → Mesa 3 (number = 16 → number = 3, name = "Mesa16" → name = "Mesa3")

  2. Tabelas Afetadas
     - `store1_tables` - Mesas da Loja 1
     - `store2_tables` - Mesas da Loja 2

  3. Segurança
     - Verifica se as mesas 2 e 3 já existem antes de fazer a alteração
     - Só atualiza se as mesas 15 e 16 existirem
*/

-- Atualizar Loja 1 (store1_tables)
DO $$
BEGIN
  -- Verificar se Mesa 15 existe e Mesa 2 não existe
  IF EXISTS (SELECT 1 FROM store1_tables WHERE number = 15) AND 
     NOT EXISTS (SELECT 1 FROM store1_tables WHERE number = 2) THEN
    UPDATE store1_tables 
    SET number = 2, name = 'Mesa2', updated_at = now()
    WHERE number = 15;
    
    RAISE NOTICE 'Loja 1: Mesa 15 renomeada para Mesa 2';
  END IF;
  
  -- Verificar se Mesa 16 existe e Mesa 3 não existe
  IF EXISTS (SELECT 1 FROM store1_tables WHERE number = 16) AND 
     NOT EXISTS (SELECT 1 FROM store1_tables WHERE number = 3) THEN
    UPDATE store1_tables 
    SET number = 3, name = 'Mesa3', updated_at = now()
    WHERE number = 16;
    
    RAISE NOTICE 'Loja 1: Mesa 16 renomeada para Mesa 3';
  END IF;
END $$;

-- Atualizar Loja 2 (store2_tables)
DO $$
BEGIN
  -- Verificar se Mesa 15 existe e Mesa 2 não existe
  IF EXISTS (SELECT 1 FROM store2_tables WHERE number = 15) AND 
     NOT EXISTS (SELECT 1 FROM store2_tables WHERE number = 2) THEN
    UPDATE store2_tables 
    SET number = 2, name = 'Mesa2', updated_at = now()
    WHERE number = 15;
    
    RAISE NOTICE 'Loja 2: Mesa 15 renomeada para Mesa 2';
  END IF;
  
  -- Verificar se Mesa 16 existe e Mesa 3 não existe
  IF EXISTS (SELECT 1 FROM store2_tables WHERE number = 16) AND 
     NOT EXISTS (SELECT 1 FROM store2_tables WHERE number = 3) THEN
    UPDATE store2_tables 
    SET number = 3, name = 'Mesa3', updated_at = now()
    WHERE number = 16;
    
    RAISE NOTICE 'Loja 2: Mesa 16 renomeada para Mesa 3';
  END IF;
END $$;