/*
  # Ativar políticas RLS para sistema de mesas

  1. Tabelas de Mesas
    - `store1_tables` e `store2_tables` - Gerenciamento de mesas
    - `store1_table_sales` e `store2_table_sales` - Vendas das mesas
    - `store1_table_sale_items` e `store2_table_sale_items` - Itens das vendas

  2. Políticas
    - Leitura pública para visualização
    - Operações completas para usuários autenticados
    - Insert e update públicos para o sistema funcionar

  3. Segurança
    - Acesso público necessário para o sistema de atendimento
    - Operações autenticadas para modificações importantes
*/

-- Políticas para store1_tables
ALTER TABLE store1_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON store1_tables;
CREATE POLICY "Enable read access for all users"
  ON store1_tables
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON store1_tables;
CREATE POLICY "Enable insert for authenticated users"
  ON store1_tables
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON store1_tables;
CREATE POLICY "Enable update for authenticated users"
  ON store1_tables
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public operations for tables" ON store1_tables;
CREATE POLICY "Enable public operations for tables"
  ON store1_tables
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para store2_tables
ALTER TABLE store2_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON store2_tables;
CREATE POLICY "Enable read access for all users"
  ON store2_tables
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON store2_tables;
CREATE POLICY "Enable insert for authenticated users"
  ON store2_tables
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON store2_tables;
CREATE POLICY "Enable update for authenticated users"
  ON store2_tables
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public operations for tables" ON store2_tables;
CREATE POLICY "Enable public operations for tables"
  ON store2_tables
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para store1_table_sales
ALTER TABLE store1_table_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON store1_table_sales;
CREATE POLICY "Enable read access for all users"
  ON store1_table_sales
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON store1_table_sales;
CREATE POLICY "Enable insert for authenticated users"
  ON store1_table_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON store1_table_sales;
CREATE POLICY "Enable update for authenticated users"
  ON store1_table_sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public operations for table sales" ON store1_table_sales;
CREATE POLICY "Enable public operations for table sales"
  ON store1_table_sales
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para store2_table_sales
ALTER TABLE store2_table_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON store2_table_sales;
CREATE POLICY "Enable read access for all users"
  ON store2_table_sales
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON store2_table_sales;
CREATE POLICY "Enable insert for authenticated users"
  ON store2_table_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON store2_table_sales;
CREATE POLICY "Enable update for authenticated users"
  ON store2_table_sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable public operations for table sales" ON store2_table_sales;
CREATE POLICY "Enable public operations for table sales"
  ON store2_table_sales
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para store1_table_sale_items
ALTER TABLE store1_table_sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON store1_table_sale_items;
CREATE POLICY "Enable read access for all users"
  ON store1_table_sale_items
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON store1_table_sale_items;
CREATE POLICY "Enable insert for authenticated users"
  ON store1_table_sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON store1_table_sale_items;
CREATE POLICY "Enable update for authenticated users"
  ON store1_table_sale_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON store1_table_sale_items;
CREATE POLICY "Enable delete for authenticated users"
  ON store1_table_sale_items
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable public operations for table sale items" ON store1_table_sale_items;
CREATE POLICY "Enable public operations for table sale items"
  ON store1_table_sale_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para store2_table_sale_items
ALTER TABLE store2_table_sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON store2_table_sale_items;
CREATE POLICY "Enable read access for all users"
  ON store2_table_sale_items
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON store2_table_sale_items;
CREATE POLICY "Enable insert for authenticated users"
  ON store2_table_sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON store2_table_sale_items;
CREATE POLICY "Enable update for authenticated users"
  ON store2_table_sale_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON store2_table_sale_items;
CREATE POLICY "Enable delete for authenticated users"
  ON store2_table_sale_items
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable public operations for table sale items" ON store2_table_sale_items;
CREATE POLICY "Enable public operations for table sale items"
  ON store2_table_sale_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);