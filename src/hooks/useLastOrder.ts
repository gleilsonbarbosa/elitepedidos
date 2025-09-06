import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem } from '../types/cart';
import { Product } from '../types/product';

interface LastOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: any[];
  total_price: number;
  created_at: string;
}

export const useLastOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLastOrderByPhone = useCallback(async (phone: string): Promise<LastOrder | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - último pedido não disponível');
        return null;
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        return null;
      }

      console.log('🔍 Buscando último pedido para telefone:', cleanPhone);

      // Get the most recent completed order for this phone
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', cleanPhone)
        .in('status', ['delivered', 'confirmed', 'preparing', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar último pedido:', error);
        return null;
      }

      if (!data) {
        console.log('ℹ️ Nenhum pedido anterior encontrado');
        return null;
      }

      console.log('✅ Último pedido encontrado:', data.id.slice(-8));
      return data;
    } catch (err) {
      console.error('❌ Erro ao buscar último pedido:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar último pedido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const convertOrderToCartItems = useCallback((order: LastOrder, availableProducts: Product[]): CartItem[] => {
    if (!order.items || !Array.isArray(order.items)) {
      return [];
    }

    const cartItems: CartItem[] = [];

    order.items.forEach((item, index) => {
      // Try to find the product in available products
      const product = availableProducts.find(p => 
        p.name === item.product_name || 
        p.name.toLowerCase().includes(item.product_name.toLowerCase())
      );

      if (!product) {
        console.warn('⚠️ Produto não encontrado no cardápio atual:', item.product_name);
        return;
      }

      // Convert complements to the expected format
      const selectedComplements = (item.complements || []).map((comp: any, compIndex: number) => ({
        groupId: `group-${compIndex}`,
        complementId: `comp-${compIndex}`,
        complement: {
          id: `comp-${compIndex}`,
          name: comp.name,
          price: comp.price || 0,
          description: '',
          isActive: true
        }
      }));

      // Find matching size if available
      const selectedSize = product.sizes?.find(size => 
        size.name === item.selected_size
      );

      const cartItem: CartItem = {
        id: `repeat-${order.id}-${index}`,
        product,
        selectedSize,
        selectedComplements,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || product.price,
        totalPrice: item.total_price || (product.price * (item.quantity || 1)),
        observations: item.observations
      };

      cartItems.push(cartItem);
    });

    console.log(`✅ ${cartItems.length} itens convertidos do último pedido`);
    return cartItems;
  }, []);

  return {
    getLastOrderByPhone,
    convertOrderToCartItems,
    loading,
    error
  };
};