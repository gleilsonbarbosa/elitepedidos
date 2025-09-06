import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Promotion, PromotionFormData, ActivePromotion } from '../types/promotion';

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePromotions, setActivePromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando promoções de demonstração');
        
        // Demo promotions
        const demoPromotions: Promotion[] = [
          {
            id: 'demo-promo-1',
            product_id: 'acai-500g',
            product_name: 'Açaí Premium 500g',
            original_price: 22.90,
            promotional_price: 15.99,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            title: 'Promoção Especial - Açaí 500g',
            description: 'Até 22h de hoje, Copo 500ml por R$15,99',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setPromotions(demoPromotions);
        updateActivePromotions(demoPromotions);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const promotionsData = data || [];
      setPromotions(promotionsData);
      updateActivePromotions(promotionsData);
    } catch (err) {
      console.error('❌ Erro ao carregar promoções:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar promoções');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActivePromotions = useCallback((promotionsData: Promotion[]) => {
    const now = new Date();
    
    const active = promotionsData
      .filter(promo => promo.is_active)
      .map(promo => {
        const endTime = new Date(promo.end_time);
        const timeRemaining = endTime.getTime() - now.getTime();
        const isExpired = timeRemaining <= 0;
        
        return {
          ...promo,
          time_remaining: Math.max(0, timeRemaining),
          is_expired: isExpired
        };
      })
      .filter(promo => !promo.is_expired); // Only include non-expired promotions

    setActivePromotions(active);
  }, []);

  const createPromotion = useCallback(async (promotionData: PromotionFormData) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }

      // Get product details - try delivery_products first, then fallback to other tables
      let productData = null;
      let productError = null;
      
      // Try delivery_products table first
      const { data: deliveryProduct, error: deliveryError } = await supabase
        .from('delivery_products')
        .select('name, price')
        .eq('id', promotionData.product_id)
        .maybeSingle();
      
      if (!deliveryError && deliveryProduct) {
        productData = deliveryProduct;
      } else {
        // Fallback to pdv_products table
        const { data: pdvProduct, error: pdvError } = await supabase
          .from('pdv_products')
          .select('name, unit_price as price')
          .eq('id', promotionData.product_id)
          .maybeSingle();
        
        if (!pdvError && pdvProduct) {
          productData = pdvProduct;
        } else {
          // If both fail, create with basic data
          console.warn('⚠️ Produto não encontrado nas tabelas, usando dados básicos');
          productData = {
            name: `Produto ${promotionData.product_id}`,
            price: promotionData.promotional_price * 1.5 // Estimate original price
          };
        }
      }

      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          ...promotionData,
          product_name: productData.name,
          original_price: productData.price,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchPromotions();
      return data;
    } catch (err) {
      console.error('❌ Erro detalhado ao criar promoção:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar promoção');
    }
  }, [fetchPromotions]);

  const updatePromotion = useCallback(async (id: string, updates: Partial<Promotion>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        // Demo mode - update local state
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        return;
      }

      const { data, error } = await supabase
        .from('promotions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchPromotions();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar promoção');
    }
  }, [fetchPromotions]);

  const deletePromotion = useCallback(async (id: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        // Demo mode - remove from local state
        setPromotions(prev => prev.filter(p => p.id !== id));
        return;
      }

      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPromotions();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir promoção');
    }
  }, [fetchPromotions]);

  const getPromotionForProduct = useCallback((productId: string): ActivePromotion | null => {
    return activePromotions.find(promo => promo.product_id === productId) || null;
  }, [activePromotions]);

  // Update active promotions every minute
  useEffect(() => {
    const interval = setInterval(() => {
      updateActivePromotions(promotions);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [promotions, updateActivePromotions]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  return {
    promotions,
    activePromotions,
    loading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion,
    getPromotionForProduct,
    refetch: fetchPromotions
  };
};