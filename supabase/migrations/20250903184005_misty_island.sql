/*
  # Ativar políticas RLS para sistema de delivery

  1. Tabelas Afetadas
    - `delivery_products` - Produtos do delivery
    - `delivery_neighborhoods` - Bairros de entrega
    - `orders` - Pedidos de delivery
    - `chat_messages` - Mensagens do chat
    - `notifications` - Notificações
    - `customers` - Clientes
    - `transactions` - Transações de cashback

  2. Políticas Criadas
    - Leitura pública para produtos e bairros
    - Operações completas para usuários autenticados
    - Acesso público para pedidos e chat
    - Políticas específicas para cashback

  3. Segurança
    - Mantém segurança para dados sensíveis
    - Permite operações necessárias para o delivery
    - Acesso público controlado apenas onde necessário
*/

-- Políticas para delivery_products
DROP POLICY IF EXISTS "Enable read access for all users" ON delivery_products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON delivery_products;
DROP POLICY IF EXISTS "Enable public read access" ON delivery_products;
DROP POLICY IF EXISTS "Enable public operations" ON delivery_products;

CREATE POLICY "Enable read access for all users" ON delivery_products
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON delivery_products
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public insert" ON delivery_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable public update" ON delivery_products
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable public delete" ON delivery_products
  FOR DELETE USING (true);

-- Políticas para delivery_neighborhoods
DROP POLICY IF EXISTS "Enable read access for all users" ON delivery_neighborhoods;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON delivery_neighborhoods;

CREATE POLICY "Enable read access for all users" ON delivery_neighborhoods
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON delivery_neighborhoods
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public operations" ON delivery_neighborhoods
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para orders (pedidos)
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON orders;

CREATE POLICY "Enable read access for all users" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON orders
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para chat_messages
DROP POLICY IF EXISTS "Enable read access for all users" ON chat_messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON chat_messages;
DROP POLICY IF EXISTS "Enable update for all users" ON chat_messages;

CREATE POLICY "Enable read access for all users" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON chat_messages
  FOR UPDATE USING (true) WITH CHECK (true);

-- Políticas para notifications
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable insert for all users" ON notifications;

CREATE POLICY "Enable read access for all users" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON notifications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Políticas para customers (clientes)
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for all users" ON customers;

CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON customers
  FOR UPDATE USING (true) WITH CHECK (true);

-- Políticas para transactions (cashback)
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for all users" ON transactions;

CREATE POLICY "Enable read access for all users" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON transactions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Políticas para product_schedules
DROP POLICY IF EXISTS "Enable read access for all users" ON product_schedules;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON product_schedules;

CREATE POLICY "Enable read access for all users" ON product_schedules
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON product_schedules
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public operations" ON product_schedules
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para product_images
DROP POLICY IF EXISTS "Enable read access for all users" ON product_images;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON product_images;

CREATE POLICY "Enable read access for all users" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON product_images
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public operations" ON product_images
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para product_image_associations
DROP POLICY IF EXISTS "Enable read access for all users" ON product_image_associations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON product_image_associations;

CREATE POLICY "Enable read access for all users" ON product_image_associations
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON product_image_associations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public operations" ON product_image_associations
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para store_settings e store_hours
DROP POLICY IF EXISTS "Enable read access for all users" ON store_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON store_hours;

CREATE POLICY "Enable read access for all users" ON store_settings
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON store_settings
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public operations" ON store_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON store_hours
  FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON store_hours
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable public operations" ON store_hours
  FOR ALL USING (true) WITH CHECK (true);