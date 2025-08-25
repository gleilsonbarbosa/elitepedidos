/*
  # Adicionar duas novas mesas ao sistema

  1. New Tables
    - Adiciona Mesa 11 e Mesa 12 na tabela store1_tables
    - Configura capacidade e localização das mesas
    - Define status inicial como 'livre'

  2. Security
    - Utiliza tabela existente com RLS já configurado
    - Mantém políticas de segurança existentes
*/

-- Adicionar Mesa 11
INSERT INTO store1_tables (number, name, capacity, status, location, is_active)
VALUES (11, 'Mesa 11', 4, 'livre', 'Área Principal', true)
ON CONFLICT (number) DO NOTHING;

-- Adicionar Mesa 12
INSERT INTO store1_tables (number, name, capacity, status, location, is_active)
VALUES (12, 'Mesa 12', 6, 'livre', 'Área Principal', true)
ON CONFLICT (number) DO NOTHING;