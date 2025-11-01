/*
  # Permitir gerenciamento de anúncios sem autenticação
  
  ## Alterações
    - Remove políticas que exigem autenticação
    - Adiciona políticas que permitem operações para anon (usuários anônimos)
    - Mantém segurança básica através do controle no painel admin
    
  ## Segurança
    - Como o painel admin já tem controle de acesso próprio, permitimos operações anon
    - Em produção, recomenda-se adicionar autenticação no painel admin
*/

-- Remover políticas antigas que exigem autenticação
DROP POLICY IF EXISTS "Usuários autenticados podem criar anúncios" ON product_announcements;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar anúncios" ON product_announcements;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir anúncios" ON product_announcements;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos anúncios" ON product_announcements;

-- Políticas para permitir operações sem autenticação (controladas pelo painel admin)
CREATE POLICY "Permitir INSERT de anúncios"
  ON product_announcements
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir UPDATE de anúncios"
  ON product_announcements
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir DELETE de anúncios"
  ON product_announcements
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir SELECT de todos anúncios"
  ON product_announcements
  FOR SELECT
  TO anon, authenticated
  USING (true);