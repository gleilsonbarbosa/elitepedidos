import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DeliveryOrder } from '../types/delivery-driver';

export const useDeliveryOrders = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      
      // Get current week boundaries (Monday 10h to Monday 10h)
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      
      // Calculate start of current week (Monday 10h)
      let daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
      if (currentDay === 1 && currentHour < 10) {
        daysToSubtract = 7;
      }
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToSubtract);
      weekStart.setHours(10, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(9, 59, 59, 999);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('channel', 'delivery')
        .in('status', ['confirmed', 'preparing', 'out_for_delivery', 'delivered'])
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      ));

      return true;
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
      return false;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('delivery-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'channel=eq.delivery'
        },
        (payload) => {
          console.log('Real-time order update:', payload);
          fetchOrders(); // Refetch all orders when any order changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch,
    updateOrderStatus
  };
};