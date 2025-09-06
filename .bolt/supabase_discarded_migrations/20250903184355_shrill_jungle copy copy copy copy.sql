/*
  # Ativar políticas RLS para sistema de pedidos no atendimento

  1. Tabelas Afetadas
    - `orders` - Pedidos de delivery
    - `chat_messages` - Mensagens do chat
    - `notifications` - Notificações do sistema

  2. Políticas Configuradas
    - Leitura pública para visualizar pedidos
    - Operações autenticadas para modificações
    - Operações públicas para funcionamento automático
    - Chat público entre clientes e atendentes

  3. Funcionalidades Habilitadas
    - Visualizar pedidos no painel de atendimento
    - Chat em tempo real
    - Atualização de status de pedidos
    - Criação de pedidos manuais
    - Notificações automáticas
*/

-- Ativar RLS nas tabelas se ainda não estiver ativo
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA ORDERS (PEDIDOS)
-- ========================================

-- Permitir leitura pública de pedidos
CREATE POLICY IF NOT EXISTS "Allow public read access to orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

-- Permitir inserção pública de pedidos (para criação automática)
CREATE POLICY IF NOT EXISTS "Allow public insert on orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir atualização pública de pedidos (para status)
CREATE POLICY IF NOT EXISTS "Allow public update on orders"
  ON orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Permitir operações autenticadas completas
CREATE POLICY IF NOT EXISTS "Allow authenticated operations on orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão para usuários autenticados
CREATE POLICY IF NOT EXISTS "Allow authenticated delete on orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- POLÍTICAS PARA CHAT_MESSAGES
-- ========================================

-- Permitir leitura pública de mensagens
CREATE POLICY IF NOT EXISTS "Allow public read access to chat_messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

-- Permitir inserção pública de mensagens (chat público)
CREATE POLICY IF NOT EXISTS "Allow public insert on chat_messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir atualização pública de mensagens (marcar como lida)
CREATE POLICY IF NOT EXISTS "Allow public update on chat_messages"
  ON chat_messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Permitir operações autenticadas completas
CREATE POLICY IF NOT EXISTS "Allow authenticated operations on chat_messages"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA NOTIFICATIONS
-- ========================================

-- Permitir leitura pública de notificações
CREATE POLICY IF NOT EXISTS "Allow public read access to notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (true);

-- Permitir inserção pública de notificações (sistema automático)
CREATE POLICY IF NOT EXISTS "Allow public insert on notifications"
  ON notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir atualização pública de notificações (marcar como lida)
CREATE POLICY IF NOT EXISTS "Allow public update on notifications"
  ON notifications
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Permitir operações autenticadas completas
CREATE POLICY IF NOT EXISTS "Allow authenticated operations on notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA DELIVERY_NEIGHBORHOODS
-- ========================================

-- Garantir que bairros estejam acessíveis
ALTER TABLE delivery_neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read access to delivery_neighborhoods"
  ON delivery_neighborhoods
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated operations on delivery_neighborhoods"
  ON delivery_neighborhoods
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA ATTENDANCE_USERS
-- ========================================

-- Garantir que usuários de atendimento estejam acessíveis
ALTER TABLE attendance_users ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública de usuários de atendimento
CREATE POLICY IF NOT EXISTS "Allow public read access to attendance_users"
  ON attendance_users
  FOR SELECT
  TO public
  USING (true);

-- Permitir operações autenticadas
CREATE POLICY IF NOT EXISTS "Allow authenticated operations on attendance_users"
  ON attendance_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir inserção quando tabela estiver vazia (primeiro usuário)
CREATE POLICY IF NOT EXISTS "Allow insert when table empty or authenticated"
  ON attendance_users
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT count(*) FROM attendance_users) = 0 OR 
    auth.uid() IS NOT NULL
  );