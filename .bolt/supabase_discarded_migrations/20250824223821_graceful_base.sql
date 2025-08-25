/*
  # Forçar renumeração das mesas para sequência correta

  1. Correções
    - Renumerar Mesa 15 para Mesa 2 (number = 2, name = "Mesa2")
    - Renumerar Mesa 16 para Mesa 3 (number = 3, name = "Mesa3")
    - Garantir sequência Mesa1, Mesa2, Mesa3

  2. Segurança
    - Verificar se as mesas existem antes de alterar
    - Usar transação para garantir consistência
    - Aplicar para ambas as lojas
*/

-- Atualizar store1_tables
DO $$
BEGIN
  -- Verificar e atualizar Mesa 15 para Mesa 2
  IF EXISTS (
    SELECT 1 FROM store1_tables WHERE number = 15
  ) THEN
    -- Se Mesa 2 já existe, deletar Mesa 15
    IF EXISTS (SELECT 1 FROM store1_tables WHERE number = 2) THEN
      DELETE FROM store1_tables WHERE number = 15;
    ELSE
      -- Senão, renumerar Mesa 15 para Mesa 2
      UPDATE store1_tables 
      SET number = 2, name = 'Mesa2', updated_at = now()
      WHERE number = 15;
    END IF;
  END IF;

  -- Verificar e atualizar Mesa 16 para Mesa 3
  IF EXISTS (
    SELECT 1 FROM store1_tables WHERE number = 16
  ) THEN
    -- Se Mesa 3 já existe, deletar Mesa 16
    IF EXISTS (SELECT 1 FROM store1_tables WHERE number = 3) THEN
      DELETE FROM store1_tables WHERE number = 16;
    ELSE
      -- Senão, renumerar Mesa 16 para Mesa 3
      UPDATE store1_tables 
      SET number = 3, name = 'Mesa3', updated_at = now()
      WHERE number = 16;
    END IF;
  END IF;

  -- Garantir que Mesa 1 tenha o nome correto
  UPDATE store1_tables 
  SET name = 'Mesa1', updated_at = now()
  WHERE number = 1 AND name != 'Mesa1';

  -- Criar Mesa 2 se não existir
  IF NOT EXISTS (SELECT 1 FROM store1_tables WHERE number = 2) THEN
    INSERT INTO store1_tables (number, name, capacity, status, is_active)
    VALUES (2, 'Mesa2', 4, 'livre', true);
  END IF;

  -- Criar Mesa 3 se não existir
  IF NOT EXISTS (SELECT 1 FROM store1_tables WHERE number = 3) THEN
    INSERT INTO store1_tables (number, name, capacity, status, is_active)
    VALUES (3, 'Mesa3', 4, 'livre', true);
  END IF;
END $$;

-- Atualizar store2_tables
DO $$
BEGIN
  -- Verificar e atualizar Mesa 15 para Mesa 2
  IF EXISTS (
    SELECT 1 FROM store2_tables WHERE number = 15
  ) THEN
    -- Se Mesa 2 já existe, deletar Mesa 15
    IF EXISTS (SELECT 1 FROM store2_tables WHERE number = 2) THEN
      DELETE FROM store2_tables WHERE number = 15;
    ELSE
      -- Senão, renumerar Mesa 15 para Mesa 2
      UPDATE store2_tables 
      SET number = 2, name = 'Mesa2', updated_at = now()
      WHERE number = 15;
    END IF;
  END IF;

  -- Verificar e atualizar Mesa 16 para Mesa 3
  IF EXISTS (
    SELECT 1 FROM store2_tables WHERE number = 16
  ) THEN
    -- Se Mesa 3 já existe, deletar Mesa 16
    IF EXISTS (SELECT 1 FROM store2_tables WHERE number = 3) THEN
      DELETE FROM store2_tables WHERE number = 16;
    ELSE
      -- Senão, renumerar Mesa 16 para Mesa 3
      UPDATE store2_tables 
      SET number = 3, name = 'Mesa3', updated_at = now()
      WHERE number = 16;
    END IF;
  END IF;

  -- Garantir que Mesa 1 tenha o nome correto
  UPDATE store2_tables 
  SET name = 'Mesa1', updated_at = now()
  WHERE number = 1 AND name != 'Mesa1';

  -- Criar Mesa 2 se não existir
  IF NOT EXISTS (SELECT 1 FROM store2_tables WHERE number = 2) THEN
    INSERT INTO store2_tables (number, name, capacity, status, is_active)
    VALUES (2, 'Mesa2', 4, 'livre', true);
  END IF;

  -- Criar Mesa 3 se não existir
  IF NOT EXISTS (SELECT 1 FROM store2_tables WHERE number = 3) THEN
    INSERT INTO store2_tables (number, name, capacity, status, is_active)
    VALUES (3, 'Mesa3', 4, 'livre', true);
  END IF;
END $$;