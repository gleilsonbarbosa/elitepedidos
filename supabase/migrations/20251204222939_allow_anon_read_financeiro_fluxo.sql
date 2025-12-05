/*
  # Permitir Leitura Anônima do Fluxo Financeiro

  1. Problema Identificado
    - Política de SELECT na tabela financeiro_fluxo só permite role "authenticated"
    - Frontend usa VITE_SUPABASE_ANON_KEY (role "anon")
    - Histórico de movimentações não carrega no VPS
    
  2. Solução
    - Adicionar role "anon" à política de leitura
    - Manter segurança: anon pode ler, mas não modificar sem autenticação
*/

-- Remover política antiga de leitura
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON financeiro_fluxo;

-- Criar nova política permitindo leitura para anon e authenticated
CREATE POLICY "Allow read access for all users"
  ON financeiro_fluxo
  FOR SELECT
  TO anon, authenticated
  USING (true);