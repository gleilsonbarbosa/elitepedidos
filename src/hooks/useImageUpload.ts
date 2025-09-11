import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadResult {
  url: string;
  path: string;
}

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const uploadImage = async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
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

      setUploadProgress(25);
      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(50);
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setUploadProgress(75);
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

      setUploadProgress(100);
      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido no upload');
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getUploadedImages = async (): Promise<UploadedImage[]> => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(image => ({
        id: image.id,
        name: image.original_name,
        url: image.public_url,
        size: image.file_size,
        created_at: image.created_at
      }));
    } catch (err) {
      console.error('Erro ao buscar imagens:', err);
      throw err;
    }
  };

  const deleteImage = async (imagePath: string): Promise<void> => {
    setDeleting(true);
    setError(null);
    
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
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao deletar');
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const getProductImage = async (productId: string): Promise<string | null> => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - não é possível buscar imagens');
        return null;
      }

      // Verificar se Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado');
        return null;
      }

      // Add timeout and better error handling for fetch requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Request took too long')), 15000);
      });
      
      let data, error;
      try {
        const fetchPromise = supabase
          .from('product_image_associations')
          .select('image_id, product_images(public_url)')
          .eq('product_id', productId)
          .maybeSingle();
        
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      } catch (fetchError) {
        // Handle network errors silently
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError') || 
            errorMessage.includes('Timeout')) {
          console.warn('⚠️ Problema de conectividade com Supabase - imagens não disponíveis no momento');
          return null;
        }
        throw fetchError;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma imagem encontrada - isso é normal
          return null;
        }
        // Não logar erros de conectividade como erros críticos
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          console.warn('Problema de conectividade ao buscar imagem:', error.message);
        } else {
          console.warn('Error fetching product image:', error);
        }
        return null;
      }

      return data?.product_images?.public_url || null;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('Network error fetching image for product:', productId, '- using fallback');
        return null;
      }
      console.warn('Error in getProductImage:', err);
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
    getUploadedImages,
    deleteImage,
    getProductImage,
    associateImageWithProduct,
    uploading,
    uploadProgress,
    error,
    deleting
  };
};