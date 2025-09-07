/*
  # Ativar políticas RLS para sistema de caixas em produção

  1. Políticas para PDV Cash Registers
    - Leitura pública para verificar status
    - Operações autenticadas para abrir/fechar
    - Operações públicas para sistema automático

  2. Políticas para PDV Cash Entries
    - Leitura pública para movimentações
    - Inserção pública para vendas automáticas
    - Operações autenticadas para gerenciamento

  3. Políticas para PDV2 (Loja 2)
    - Mesmas permissões da Loja 1
    - Suporte completo para ambas as lojas

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas permissivas para produção
    - Acesso público necessário para funcionamento
*/

-- Ativar RLS nas tabelas de caixa se não estiver ativo
ALTER TABLE pdv_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv2_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv2_cash_entries ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA PDV_CASH_REGISTERS (Loja 1)
-- ========================================

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Enable read access for all users" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow public read access to pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow public operations on pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated insert to pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated select to pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated update to pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow public access to pdv_cash_registers" ON pdv_cash_registers;

-- Criar políticas para PDV Cash Registers
CREATE POLICY "Enable read access for all users"
  ON pdv_cash_registers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON pdv_cash_registers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for public users"
  ON pdv_cash_registers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON pdv_cash_registers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update for public users"
  ON pdv_cash_registers
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON pdv_cash_registers
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- POLÍTICAS PARA PDV_CASH_ENTRIES (Loja 1)
-- ========================================

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Enable read access for all users" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow public read access to pdv_cash_entries" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow public operations on pdv_cash_entries" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv_cash_entries" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow public insert on pdv_cash_entries" ON pdv_cash_entries;

-- Criar políticas para PDV Cash Entries
CREATE POLICY "Enable read access for all users"
  ON pdv_cash_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON pdv_cash_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for public users"
  ON pdv_cash_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON pdv_cash_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update for public users"
  ON pdv_cash_entries
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON pdv_cash_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- POLÍTICAS PARA PDV2_CASH_REGISTERS (Loja 2)
-- ========================================

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Enable read access for all users" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Allow public read access to pdv2_cash_registers" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Allow public operations on pdv2_cash_registers" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv2_cash_registers" ON pdv2_cash_registers;

-- Criar políticas para PDV2 Cash Registers
CREATE POLICY "Enable read access for all users"
  ON pdv2_cash_registers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON pdv2_cash_registers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for public users"
  ON pdv2_cash_registers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON pdv2_cash_registers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update for public users"
  ON pdv2_cash_registers
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON pdv2_cash_registers
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- POLÍTICAS PARA PDV2_CASH_ENTRIES (Loja 2)
-- ========================================

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Enable read access for all users" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow public read access to pdv2_cash_entries" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow public operations on pdv2_cash_entries" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv2_cash_entries" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow public insert on pdv2_cash_entries" ON pdv2_cash_entries;

-- Criar políticas para PDV2 Cash Entries
CREATE POLICY "Enable read access for all users"
  ON pdv2_cash_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON pdv2_cash_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for public users"
  ON pdv2_cash_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON pdv2_cash_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update for public users"
  ON pdv2_cash_entries
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON pdv2_cash_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- POLÍTICAS PARA OPERADORES
-- ========================================

-- Garantir que operadores tenham acesso
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
  ON pdv_operators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for public users"
  ON pdv_operators
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for public users"
  ON pdv_operators
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Mesmas políticas para PDV2 operators
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
  ON pdv2_operators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for public users"
  ON pdv2_operators
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for public users"
  ON pdv2_operators
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA VENDAS PDV
-- ========================================

-- Garantir que vendas PDV tenham acesso
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
  ON pdv_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for public users"
  ON pdv_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for public users"
  ON pdv_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Mesmas políticas para itens de venda
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
  ON pdv_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for public users"
  ON pdv_sale_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for public users"
  ON pdv_sale_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable delete for public users"
  ON pdv_sale_items
  FOR DELETE
  TO public
  USING (true);

-- ========================================
-- POLÍTICAS PARA PRODUTOS PDV
-- ========================================

-- Garantir que produtos PDV tenham acesso
CREATE POLICY IF NOT EXISTS "Enable read access for all users"
  ON pdv_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for public users"
  ON pdv_products
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for public users"
  ON pdv_products
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable delete for public users"
  ON pdv_products
  FOR DELETE
  TO public
  USING (true);