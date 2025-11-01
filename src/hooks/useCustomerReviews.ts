import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CustomerReview {
  id: string;
  customer_name: string;
  customer_phone?: string;
  rating: number;
  comment: string;
  order_id?: string;
  created_at: string;
  is_approved: boolean;
  is_featured: boolean;
}

export const useCustomerReviews = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = useCallback(async (reviewData: {
    rating: number;
    comment: string;
    customer_name: string;
    customer_phone: string;
    order_id: string;
  }): Promise<CustomerReview> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - salvando avaliação localmente');
        
        // Save to localStorage as fallback
        const newReview: CustomerReview = {
          ...reviewData,
          id: `review-${Date.now()}`,
          created_at: new Date().toISOString(),
          is_approved: false,
          is_featured: false
        };
        
        const existingReviews = JSON.parse(localStorage.getItem('customer_reviews') || '[]');
        existingReviews.push(newReview);
        localStorage.setItem('customer_reviews', JSON.stringify(existingReviews));
        
        return newReview;
      }

      // Save to database if Supabase is configured
      const { data, error } = await supabase
        .from('customer_reviews')
        .insert([{
          ...reviewData,
          is_approved: false, // Requires admin approval
          is_featured: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Avaliação salva no banco:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao enviar avaliação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar avaliação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getApprovedReviews = useCallback(async (): Promise<CustomerReview[]> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - carregando avaliações do localStorage');
        
        // Load from localStorage as fallback
        const localReviews = JSON.parse(localStorage.getItem('customer_reviews') || '[]');
        return localReviews.filter((review: CustomerReview) => review.is_approved);
      }

      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('❌ Erro ao carregar avaliações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliações');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingReviews = useCallback(async (): Promise<CustomerReview[]> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - carregando avaliações do localStorage');
        
        // Load from localStorage as fallback
        const localReviews = JSON.parse(localStorage.getItem('customer_reviews') || '[]');
        return localReviews.filter((review: CustomerReview) => !review.is_approved);
      }

      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('❌ Erro ao carregar avaliações pendentes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliações pendentes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const approveReview = useCallback(async (reviewId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - aprovando avaliação localmente');
        
        // Update in localStorage as fallback
        const localReviews = JSON.parse(localStorage.getItem('customer_reviews') || '[]');
        const updatedReviews = localReviews.map((review: CustomerReview) => 
          review.id === reviewId ? { ...review, is_approved: true } : review
        );
        localStorage.setItem('customer_reviews', JSON.stringify(updatedReviews));
        return;
      }

      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      console.log('✅ Avaliação aprovada:', reviewId);
    } catch (err) {
      console.error('❌ Erro ao aprovar avaliação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao aprovar avaliação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFeatured = useCallback(async (reviewId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - alterando destaque localmente');
        
        // Update in localStorage as fallback
        const localReviews = JSON.parse(localStorage.getItem('customer_reviews') || '[]');
        const updatedReviews = localReviews.map((review: CustomerReview) => 
          review.id === reviewId ? { ...review, is_featured: !review.is_featured } : review
        );
        localStorage.setItem('customer_reviews', JSON.stringify(updatedReviews));
        return;
      }

      // First get current status
      const { data: currentReview, error: fetchError } = await supabase
        .from('customer_reviews')
        .select('is_featured')
        .eq('id', reviewId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_featured: !currentReview.is_featured })
        .eq('id', reviewId);

      if (error) throw error;

      console.log('✅ Status de destaque alterado:', reviewId);
    } catch (err) {
      console.error('❌ Erro ao alterar destaque:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alterar destaque');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReview = useCallback(async (reviewId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - removendo avaliação localmente');
        
        // Remove from localStorage as fallback
        const localReviews = JSON.parse(localStorage.getItem('customer_reviews') || '[]');
        const updatedReviews = localReviews.filter((review: CustomerReview) => review.id !== reviewId);
        localStorage.setItem('customer_reviews', JSON.stringify(updatedReviews));
        return;
      }

      const { error } = await supabase
        .from('customer_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      console.log('✅ Avaliação excluída:', reviewId);
    } catch (err) {
      console.error('❌ Erro ao excluir avaliação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir avaliação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    submitReview,
    getApprovedReviews,
    getPendingReviews,
    approveReview,
    toggleFeatured,
    deleteReview
  };
};