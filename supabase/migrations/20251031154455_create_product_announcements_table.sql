/*
  # Criar tabela de anúncios de produtos
  
  ## Nova Tabela
    - `product_announcements`
      - `id` (uuid, primary key)
      - `product_name` (text) - Nome do produto/novidade
      - `message` (text) - Mensagem do anúncio
      - `is_active` (boolean) - Se o anúncio está ativo
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização
      
  ## Segurança
    - Habilita RLS na tabela
    - Política para leitura pública de anúncios ativos
    - Apenas administradores podem criar/editar anúncios
*/

-- Criar tabela de anúncios
CREATE TABLE IF NOT EXISTS product_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE product_announcements ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública de anúncios ativos
CREATE POLICY "Anúncios ativos são públicos"
  ON product_announcements
  FOR SELECT
  TO public
  USING (is_active = true);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_announcements_active 
  ON product_announcements(is_active, created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_product_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_product_announcements_updated_at ON product_announcements;
CREATE TRIGGER update_product_announcements_updated_at
  BEFORE UPDATE ON product_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_product_announcements_updated_at();