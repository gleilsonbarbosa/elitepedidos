/*
  # Adicionar duas novas mesas para a Loja 1

  1. New Tables
    - Adiciona Mesa 11 (4 pessoas, Área Principal)
    - Adiciona Mesa 12 (6 pessoas, Área Principal)
  
  2. Security
    - Mesas criadas com status 'livre' (disponível)
    - Configuradas como ativas no sistema
*/

-- Adicionar Mesa 11
INSERT INTO store1_tables (number, name, capacity, status, location, is_active)
VALUES (11, 'Mesa 11', 4, 'livre', 'Área Principal', true)
ON CONFLICT (number) DO NOTHING;

-- Adicionar Mesa 12
INSERT INTO store1_tables (number, name, capacity, status, location, is_active)
VALUES (12, 'Mesa 12', 6, 'livre', 'Área Principal', true)
ON CONFLICT (number) DO NOTHING;