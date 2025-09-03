/*
  # Ativar políticas RLS para sistema de caixas no atendimento

  1. Políticas para pdv_cash_registers
    - Leitura pública para verificar status
    - Operações autenticadas para abrir/fechar caixa
    - Operações públicas para o sistema funcionar

  2. Políticas para pdv_cash_entries
    - Leitura pública para relatórios
    - Operações autenticadas para movimentações
    - Insert público para vendas automáticas

  3. Políticas para pdv2_cash_registers (Loja 2)
    - Mesmas permissões da Loja 1

  4. Políticas para pdv2_cash_entries (Loja 2)
    - Mesmas permissões da Loja 1
*/

-- Políticas para pdv_cash_registers (Loja 1)
DROP POLICY IF EXISTS "Allow public read access to pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv_cash_registers" ON pdv_cash_registers;
DROP POLICY IF EXISTS "Allow public operations on pdv_cash_registers" ON pdv_cash_registers;

CREATE POLICY "Allow public read access to pdv_cash_registers"
  ON pdv_cash_registers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated operations on pdv_cash_registers"
  ON pdv_cash_registers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public operations on pdv_cash_registers"
  ON pdv_cash_registers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para pdv_cash_entries (Loja 1)
DROP POLICY IF EXISTS "Allow public read access to pdv_cash_entries" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv_cash_entries" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow public insert on pdv_cash_entries" ON pdv_cash_entries;
DROP POLICY IF EXISTS "Allow public operations on pdv_cash_entries" ON pdv_cash_entries;

CREATE POLICY "Allow public read access to pdv_cash_entries"
  ON pdv_cash_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated operations on pdv_cash_entries"
  ON pdv_cash_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert on pdv_cash_entries"
  ON pdv_cash_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public operations on pdv_cash_entries"
  ON pdv_cash_entries
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para pdv2_cash_registers (Loja 2)
DROP POLICY IF EXISTS "Allow public read access to pdv2_cash_registers" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv2_cash_registers" ON pdv2_cash_registers;
DROP POLICY IF EXISTS "Allow public operations on pdv2_cash_registers" ON pdv2_cash_registers;

CREATE POLICY "Allow public read access to pdv2_cash_registers"
  ON pdv2_cash_registers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated operations on pdv2_cash_registers"
  ON pdv2_cash_registers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public operations on pdv2_cash_registers"
  ON pdv2_cash_registers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para pdv2_cash_entries (Loja 2)
DROP POLICY IF EXISTS "Allow public read access to pdv2_cash_entries" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow authenticated operations on pdv2_cash_entries" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow public insert on pdv2_cash_entries" ON pdv2_cash_entries;
DROP POLICY IF EXISTS "Allow public operations on pdv2_cash_entries" ON pdv2_cash_entries;

CREATE POLICY "Allow public read access to pdv2_cash_entries"
  ON pdv2_cash_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated operations on pdv2_cash_entries"
  ON pdv2_cash_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert on pdv2_cash_entries"
  ON pdv2_cash_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public operations on pdv2_cash_entries"
  ON pdv2_cash_entries
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE pdv_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv2_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv2_cash_entries ENABLE ROW LEVEL SECURITY;