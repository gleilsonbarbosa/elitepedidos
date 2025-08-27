import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CashbackTransaction } from '../types/cashback';

export const useCashback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCustomerByPhone = useCallback(async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove formatting from phone number
      const cleanPhone = phone.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cliente');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerBalance = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || { customer_id: customerId, available_balance: 0, expiring_amount: 0 };
    } catch (err) {
      console.error('Error fetching customer balance:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar saldo');
      return { customer_id: customerId, available_balance: 0, expiring_amount: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerTransactions = useCallback(async (customerId: string): Promise<CashbackTransaction[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar transações');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPurchaseTransaction = useCallback(async (
    customerId: string,
    amount: number,
    orderId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          customer_id: customerId,
          amount: amount,
          cashback_amount: amount * 0.05, // 5% cashback
          type: 'purchase',
          status: 'approved',
          comment: orderId ? `Pedido ${orderId.slice(-8)}` : 'Compra'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error creating purchase transaction:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar transação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRedemptionTransaction = useCallback(async (
    customerId: string,
    amount: number,
    orderId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          customer_id: customerId,
          amount: amount,
          cashback_amount: -amount, // Negative for redemption
          type: 'redemption',
          status: 'approved',
          comment: orderId ? `Usado no pedido ${orderId.slice(-8)}` : 'Resgate de cashback'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error creating redemption transaction:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resgatar cashback');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getCustomerByPhone,
    getCustomerBalance,
    getCustomerTransactions,
    createPurchaseTransaction,
    createRedemptionTransaction
  };
};