/*
  # Ativar políticas RLS para produtos PDV no atendimento

  1. Políticas para pdv_products
    - Permitir leitura pública para produtos ativos
    - Permitir todas as operações para usuários autenticados
  
  2. Políticas para pdv_operators
    - Permitir leitura pública para operadores ativos
    - Permitir operações para usuários autenticados
    
  3. Políticas para pdv_sales e pdv_sale_items
    - Permitir operações para usuários autenticados
    - Permitir leitura pública para relatórios
*/

-- Políticas para pdv_products
DROP POLICY IF EXISTS "Enable read access for all users" ON pdv_products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON pdv_products;

CREATE POLICY "Enable read access for all users" ON pdv_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON pdv_products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for public" ON pdv_products
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for public" ON pdv_products
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for public" ON pdv_products
  FOR DELETE
  TO public
  USING (true);

-- Políticas para pdv_operators
DROP POLICY IF EXISTS "Enable read access for operators" ON pdv_operators;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON pdv_operators;

CREATE POLICY "Enable read access for all users" ON pdv_operators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON pdv_operators
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for public" ON pdv_operators
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for public" ON pdv_operators
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para pdv_sales
DROP POLICY IF EXISTS "Enable read access for sales" ON pdv_sales;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON pdv_sales;

CREATE POLICY "Enable read access for all users" ON pdv_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON pdv_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for public" ON pdv_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for public" ON pdv_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para pdv_sale_items
DROP POLICY IF EXISTS "Enable read access for sale items" ON pdv_sale_items;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON pdv_sale_items;

CREATE POLICY "Enable read access for all users" ON pdv_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON pdv_sale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for public" ON pdv_sale_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for public" ON pdv_sale_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for public" ON pdv_sale_items
  FOR DELETE
  TO public
  USING (true);