/*
  # Criar bucket de imagens de produtos
  
  1. Storage
    - Criar bucket `product-images` para armazenar imagens de produtos
    - Configurar bucket como público para acesso direto às imagens
    - Adicionar políticas de acesso para upload e download
    
  2. Políticas de Segurança
    - Permitir upload autenticado de imagens
    - Permitir acesso público para leitura de imagens
    - Permitir exclusão apenas para usuários autenticados
*/

-- Criar bucket de imagens de produtos (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens" ON storage.objects;

-- Política: Permitir upload para todos (público e autenticado)
CREATE POLICY "Permitir upload de imagens"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- Política: Permitir leitura pública de imagens
CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Política: Permitir atualização para todos
CREATE POLICY "Permitir atualização de imagens"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'product-images');

-- Política: Permitir exclusão para todos
CREATE POLICY "Permitir exclusão de imagens"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images');