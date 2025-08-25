import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadResult {
  url: string;
  path: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadImage = async (file: File): Promise<UploadResult> => {
    setUploading(true);
    
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo deve ter no máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Salvar metadata no banco
      const { data: imageData, error: dbError } = await supabase
        .from('product_images')
        .insert({
          file_name: fileName,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          public_url: urlData.publicUrl,
          original_name: file.name
        })
        .select()
        .single();

      if (dbError) {
        // Se falhou ao salvar no banco, remover do storage
        await supabase.storage
          .from('product-images')
          .remove([filePath]);
        throw dbError;
      }

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (err) {
      console.error('Erro no upload:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imagePath: string): Promise<void> => {
    setDeleting(true);
    
    try {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([imagePath]);

      if (storageError) {
        throw storageError;
      }

      // Remover do banco
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('file_path', imagePath);

      if (dbError) {
        throw dbError;
      }
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const getProductImage = async (productId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('product_image_associations')
        .select('image_id, product_images(public_url)')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar imagem do produto:', error);
        return null;
      }

      if (!data || !data.product_images) {
        return null;
      }

      return (data.product_images as any).public_url;
    } catch (err) {
      console.error('Erro ao buscar imagem:', err);
      return null;
    }
  };

  const associateImageWithProduct = async (productId: string, imageId: string): Promise<void> => {
    try {
      // Primeiro, remover associação existente se houver
      await supabase
        .from('product_image_associations')
        .delete()
        .eq('product_id', productId);

      // Criar nova associação
      const { error } = await supabase
        .from('product_image_associations')
        .insert({
          product_id: productId,
          image_id: imageId
        });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Erro ao associar imagem:', err);
      throw err;
    }
  };

  return {
    uploadImage,
    deleteImage,
    getProductImage,
    associateImageWithProduct,
    uploading,
    deleting
  };
};