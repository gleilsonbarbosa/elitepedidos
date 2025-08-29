import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CashbackTransaction, CustomerBalance } from '../types/cashback';

export interface Customer {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  balance: number;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  date_of_birth?: string;
  whatsapp_consent?: boolean;
}

export const useCashback = () => {
  const [loading, setLoading] = useState(false);

  const getCustomerByPhone = useCallback(async (phone: string): Promise<Customer | null> => {
    try {
      setLoading(true);
      console.log('🔍 Buscando cliente por telefone:', phone);
      
      // Clean phone number (remove all non-digits)
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        console.warn('⚠️ Telefone muito curto:', cleanPhone);
        return null;
      }

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - retornando null');
        return null;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        return null;
      }

      if (data) {
        console.log('✅ Cliente encontrado:', { id: data.id, name: data.name, phone: data.phone });
        return data;
      }

      console.log('ℹ️ Cliente não encontrado para telefone:', cleanPhone);
      return null;
    } catch (error) {
      console.error('❌ Erro na busca do cliente:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerBalance = useCallback(async (customerId: string): Promise<CustomerBalance | null> => {
    try {
      setLoading(true);
      console.log('💰 Buscando saldo do cliente:', customerId);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - retornando saldo zero');
        return {
          customer_id: customerId,
          available_balance: 0,
          expiring_amount: 0
        };
      }

      // Use the customer_balances view for accurate balance calculation
      const { data, error } = await supabase
        .from('customer_balances')
        .select('customer_id, name, available_balance, expiring_amount, expiration_date')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        console.warn('Erro ao buscar saldo via view, tentando tabela customers:', error);
        
        // Fallback para tabela customers diretamente
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, name, balance, created_at')
          .eq('id', customerId)
          .maybeSingle();

        if (customerError) {
          console.error('❌ Erro ao buscar dados do cliente:', customerError);
          return null;
        }

        if (!customerData) {
          console.error('❌ Cliente não encontrado');
          return null;
        }

        return {
          customer_id: customerData.id,
          name: customerData.name,
          available_balance: Math.max(0, customerData.balance || 0),
          expiring_amount: 0,
          expiration_date: null
        };
      }

      if (data) {
        // Garantir que o saldo nunca seja negativo
        const balance = {
          ...data,
          available_balance: Math.max(0, data.available_balance || 0),
          expiring_amount: Math.max(0, data.expiring_amount || 0)
        };

        if (data.available_balance < 0) {
          console.warn('Saldo negativo detectado, corrigindo para zero:', data);
          
          // Corrigir no banco de dados
          await supabase
            .from('customers')
            .update({ balance: 0 })
            .eq('id', customerId);

          return {
            ...data,
            available_balance: 0
          };
        }

        console.log('✅ Saldo encontrado:', balance);
        
        return {
          customer_id: data.customer_id,
          name: data.name,
          available_balance: data.available_balance || 0,
          expiring_amount: data.expiring_amount || 0,
          expiration_date: data.expiration_date
        };
      }

      console.log('ℹ️ Nenhum saldo encontrado para cliente:', customerId);
      return {
        customer_id: customerId,
        available_balance: 0,
        expiring_amount: 0
      };
    } catch (error) {
      console.error('❌ Erro ao buscar saldo:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerTransactions = useCallback(async (customerId: string): Promise<CashbackTransaction[]> => {
    try {
      setLoading(true);
      console.log('📊 Buscando transações do cliente:', customerId);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - retornando array vazio');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        return [];
      }

      console.log(`✅ ${data?.length || 0} transações encontradas`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPurchaseTransaction = useCallback(async (
    customerId: string,
    amount: number,
    orderId?: string
  ): Promise<CashbackTransaction | null> => {
    try {
      console.log('💳 Criando transação de compra:', { customerId, amount, orderId });

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - transação não será salva');
        return null;
      }

      // Calculate cashback (5%)
      const cashbackAmount = amount * 0.05;

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          customer_id: customerId,
          amount: amount,
          cashback_amount: cashbackAmount,
          type: 'purchase',
          status: 'approved',
          comment: orderId ? `Pedido ${orderId.slice(-8)}` : 'Compra no delivery'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar transação de compra:', error);
        return null;
      }

      console.log('✅ Transação de compra criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar transação de compra:', error);
      return null;
    }
  }, []);

  const createRedemptionTransaction = useCallback(async (
    customerId: string,
    amount: number,
    orderId?: string
  ): Promise<CashbackTransaction | null> => {
    try {
      console.log('🎁 Criando transação de resgate:', { customerId, amount, orderId });

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - transação não será salva');
        return null;
      }

      // Verificar se o cliente tem saldo suficiente
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      if (!customer || customer.balance < amount) {
        throw new Error('Saldo insuficiente para usar cashback');
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          customer_id: customerId,
          amount: amount,
          cashback_amount: -amount, // Negative for redemption
          type: 'redemption',
          status: 'approved',
          comment: orderId ? `Usado no pedido ${orderId.slice(-8)}` : 'Resgate no delivery'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar transação de resgate:', error);
        return null;
      }

      console.log('✅ Transação de resgate criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar transação de resgate:', error);
      return null;
    }
  }, []);

  const searchCustomersByName = useCallback(async (name: string): Promise<Customer[]> => {
    try {
      if (!name || name.length < 2) return [];

      console.log('🔍 Buscando clientes por nome:', name);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - retornando array vazio');
        return [];
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${name}%`)
        .limit(10)
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar clientes por nome:', error);
        return [];
      }

      console.log(`✅ ${data?.length || 0} clientes encontrados`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar clientes por nome:', error);
      return [];
    }
  }, []);

  // Função para executar reset mensal manual
  const executeMonthlyReset = async () => {
    try {
      const { data, error } = await supabase.rpc('reset_monthly_cashback');
      
      if (error) throw error;
      
      console.log('✅ Reset mensal de cashback executado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao executar reset mensal:', error);
      throw error;
    }
  };

  // Função para corrigir saldos negativos
  const fixNegativeBalances = async () => {
    try {
      const { data, error } = await supabase.rpc('fix_negative_cashback_balances');
      
      if (error) throw error;
      
      console.log('✅ Saldos negativos corrigidos:', data);
      return { success: true, fixed_count: data };
    } catch (error) {
      console.error('❌ Erro ao corrigir saldos negativos:', error);
      throw error;
    }
  };

  return {
    getCustomerByPhone,
    getCustomerBalance,
    getCustomerTransactions,
    createPurchaseTransaction,
    createRedemptionTransaction,
    searchCustomersByName,
    loading,
    executeMonthlyReset,
    fixNegativeBalances
  };
};