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

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Falha na conexão com o servidor')), 10000);
      });

      // Create the Supabase query promise
      const queryPromise = supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      // Race between query and timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) throw error;

      const promotionsData = data || [];
      setPromotions(promotionsData);
      updateActivePromotions(promotionsData);
    } catch (err) {
      console.error('❌ Erro ao carregar promoções:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Erro ao carregar promoções';
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (err.message.includes('Timeout')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Fallback to demo promotions on network error
      console.warn('⚠️ Usando promoções de demonstração devido ao erro de rede');
      const demoPromotions: Promotion[] = [
        {
          id: 'demo-promo-1',
          product_id: 'acai-500g',
          product_name: 'Açaí Premium 500g',
          original_price: 22.90,
          promotional_price: 15.99,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          title: 'Promoção Especial - Açaí 500g',
          description: 'Até 22h de hoje, Copo 500ml por R$15,99',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setPromotions(demoPromotions);
      updateActivePromotions(demoPromotions);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActivePromotions = useCallback((promotionsData: Promotion[]) => {
    const now = new Date();
    
    console.log('🔍 [PROMOTIONS] Verificando promoções ativas:', {
      totalPromotions: promotionsData.length,
      currentTime: now.toLocaleString('pt-BR'),
      currentTimestamp: now.getTime()
    });
    
    const active = promotionsData
      .filter(promo => {
        console.log(`🔍 [PROMO-${promo.id.slice(-4)}] Verificando "${promo.title}":`, {
          start_time: promo.start_time,
         end_time: promo.end_time,
         is_active_in_db: promo.is_active
        });
        
        // Check if promotion is within its scheduled time period
        const startTime = new Date(promo.start_time);
        const endTime = new Date(promo.end_time);
        const nowTime = now.getTime();
        const startTimeMs = startTime.getTime();
        const endTimeMs = endTime.getTime();
        
        const hasStarted = nowTime >= startTimeMs;
        const hasNotEnded = nowTime <= endTimeMs;
        const isWithinPeriod = hasStarted && hasNotEnded;
        
        console.log(`📅 [PROMO-${promo.id.slice(-4)}] "${promo.title}":`, {
          startTime: startTime.toLocaleString('pt-BR'),
          endTime: endTime.toLocaleString('pt-BR'),
          currentTime: now.toLocaleString('pt-BR'),
          hasStarted,
          hasNotEnded,
          isWithinPeriod,
         isActiveInDb: promo.is_active,
         finalDecision: isWithinPeriod,
          willBeIncluded: isWithinPeriod
        });
        
       // Only include if within time period, regardless of is_active flag
        return isWithinPeriod;
      })
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

    console.log('✅ [PROMOTIONS] Resultado final:', {
      totalPromotions: promotionsData.length,
      activePromotions: active.length,
      activePromotionIds: active.map(p => ({ id: p.id.slice(-4), title: p.title }))
    });
    
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