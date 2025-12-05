/*
  # Permitir Leitura Anônima de Promoções

  1. Problema Identificado
    - Política de SELECT na tabela promotions só permite role "authenticated"
    - Página de delivery precisa mostrar promoções para usuários não logados
    - Promoções podem não aparecer no VPS
    
  2. Solução
    - Adicionar role "anon" à política de leitura de promoções
    - Permite que clientes vejam promoções antes de fazer login
*/

-- Remover política antiga de leitura de promoções
DROP POLICY IF EXISTS "Authenticated can view all promotions" ON promotions;

-- Criar nova política permitindo leitura para anon e authenticated
CREATE POLICY "Allow read access for all users"
  ON promotions
  FOR SELECT
  TO anon, authenticated
  USING (true);