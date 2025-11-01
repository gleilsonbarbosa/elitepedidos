/*
  # Adicionar políticas de administração para anúncios
  
  ## Alterações
    - Adiciona políticas para INSERT, UPDATE e DELETE na tabela product_announcements
    - Permite que qualquer usuário autenticado gerencie anúncios (será controlado pelo painel admin)
    
  ## Segurança
    - INSERT: Usuários autenticados podem criar anúncios
    - UPDATE: Usuários autenticados podem editar anúncios
    - DELETE: Usuários autenticados podem excluir anúncios
    - SELECT: Público pode ler anúncios ativos (já existente)
*/

-- Política para INSERT
CREATE POLICY "Usuários autenticados podem criar anúncios"
  ON product_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Usuários autenticados podem atualizar anúncios"
  ON product_announcements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Usuários autenticados podem excluir anúncios"
  ON product_announcements
  FOR DELETE
  TO authenticated
  USING (true);

-- Política adicional para SELECT para usuários autenticados verem todos os anúncios
CREATE POLICY "Usuários autenticados podem ver todos anúncios"
  ON product_announcements
  FOR SELECT
  TO authenticated
  USING (true);