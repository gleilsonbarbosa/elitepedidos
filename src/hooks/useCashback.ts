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

      // NOVA LÓGICA MENSAL: Buscar apenas transações do mês atual
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      console.log('📅 Período do mês atual:', {
        inicio: currentMonthStart.toISOString(),
        fim: nextMonthStart.toISOString(),
        mesAtual: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
      });
      
      // Buscar apenas transações do mês atual
      const { data: allTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'approved')
        .gte('created_at', currentMonthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        
        // Fallback para tabela customers
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, name, balance')
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
          available_balance: 0, // Não usar saldo da tabela customers para lógica mensal
          expiring_amount: 0,
          expiration_date: undefined
        };
      }

      if (!allTransactions || allTransactions.length === 0) {
        console.log('ℹ️ Nenhuma transação encontrada para o cliente no mês atual');
        return {
          customer_id: customerId,
          available_balance: 0,
          expiring_amount: 0
        };
      }

      // NOVA LÓGICA MENSAL: Todas as transações do mês atual são válidas
      console.log('📊 Transações do mês atual:', {
        total: allTransactions.length,
        mesAtual: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
      });
      
      // Calcular saldo das transações do mês atual usando centavos para precisão
      let availableBalanceCents = 0;
      
      allTransactions.forEach(transaction => {
        console.log('💰 Processando transação do mês atual:', {
          id: transaction.id,
          type: transaction.type,
          cashback_amount: transaction.cashback_amount,
          created_at: transaction.created_at,
          mesRegistro: new Date(transaction.created_at).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
        });
        
        // Converter para centavos para evitar problemas de precisão
        const cashbackAmountCents = Math.round(transaction.cashback_amount * 100);
        
        if (transaction.type === 'purchase' && transaction.cashback_amount > 0) {
          availableBalanceCents += cashbackAmountCents;
        } else if (transaction.type === 'redemption' && transaction.cashback_amount < 0) {
          availableBalanceCents += cashbackAmountCents; // Já é negativo
        }
      });
      
      // Converter de volta para reais
      const availableBalance = availableBalanceCents / 100;
      
      // Apply precision cleanup and ensure non-negative
      const cleanBalance = Math.abs(availableBalance) < 0.01 ? 0 : availableBalance;
      const finalBalance = Math.max(0, cleanBalance);
      const preciseBalance = Math.round(finalBalance * 100) / 100;
      
      // Calcular data de expiração (fim do mês atual)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const daysUntilEndOfMonth = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('✅ SALDO MENSAL - Baseado apenas no mês atual:', {
        availableBalance: preciseBalance,
        mesAtual: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`,
        transacoesDoMes: allTransactions.length,
        expiraEm: `${daysUntilEndOfMonth} dias (fim do mês)`,
        dataExpiracao: endOfMonth.toLocaleDateString('pt-BR')
      });
      
      return {
        customer_id: customerId,
        available_balance: preciseBalance,
        expiring_amount: daysUntilEndOfMonth <= 7 ? preciseBalance : 0, // Todo saldo expira no fim do mês
        expiration_date: endOfMonth.toISOString()
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

      // Buscar apenas transações do mês atual
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .gte('created_at', currentMonthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        return [];
      }

      console.log(`✅ ${data?.length || 0} transações encontradas no mês atual`);
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

      // Calculate cashback (5%) with proper rounding to avoid floating-point precision issues
      const roundedAmount = Math.round(amount * 100) / 100;
      const cashbackAmount = Math.round(roundedAmount * 0.05 * 100) / 100;

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          customer_id: customerId,
          amount: roundedAmount,
          cashback_amount: cashbackAmount,
          type: 'purchase',
          status: 'approved',
          comment: orderId ? `Pedido ${orderId.slice(-8)} - Mês ${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}` : `Compra no delivery - Mês ${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar transação de compra:', error);
        return null;
      }

      console.log('✅ Transação de compra criada:', {
        ...data,
        roundedAmount,
        cashbackAmount,
        originalAmount: amount
      });
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
      // Calcular saldo do mês atual
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const { data: balanceData, error: customerError } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'approved')
        .gte('created_at', currentMonthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString());

      if (customerError) throw customerError;

      // Transações já filtradas pela query do banco
      const currentMonthTransactions = balanceData || [];
      
      // Calcular saldo do mês atual usando centavos para precisão
      let monthlyBalanceCents = 0;
      
      currentMonthTransactions.forEach(transaction => {
        // Converter para centavos para evitar problemas de precisão
        const cashbackAmountCents = Math.round(transaction.cashback_amount * 100);
        
        if (transaction.type === 'purchase' && transaction.cashback_amount > 0) {
          monthlyBalanceCents += cashbackAmountCents;
        } else if (transaction.type === 'redemption' && transaction.cashback_amount < 0) {
          monthlyBalanceCents += cashbackAmountCents; // Já é negativo
        }
      });

      // Converter de volta para reais e garantir precisão
      const monthlyBalance = Math.round(monthlyBalanceCents) / 100;
      
      // Apply precision cleanup and ensure non-negative
      const cleanBalance = Math.abs(monthlyBalance) < 0.01 ? 0 : monthlyBalance;
      const finalBalance = Math.max(0, cleanBalance);
      const availableBalance = Math.round(finalBalance * 100) / 100;
      
      const roundedAmount = Math.round(amount * 100) / 100;
      
      // Convert to integer cents to avoid floating-point precision issues
      const availableBalanceCents = Math.round(availableBalance * 100);
      const roundedAmountCents = Math.round(roundedAmount * 100);
      
      console.log('💰 Verificação de saldo mensal:', {
        availableBalance,
        monthlyBalance: cleanBalance,
        monthlyBalanceRaw: monthlyBalance,
        finalBalance: finalBalance,
        availableCents: availableBalanceCents,
        requestedAmount: roundedAmount,
        sufficient: availableBalanceCents >= roundedAmountCents,
        mesAtual: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`,
        transacoesDoMes: (balanceData || []).length
      });
      
      // CRÍTICO: Se saldo é zero ou negativo, bloquear imediatamente
      if (availableBalance <= 0) {
        throw new Error('Você não possui cashback disponível no mês atual.');
      }
      
      if (availableBalanceCents < roundedAmountCents) {
        // Garantir formatação correta com precisão exata
        const safeBalance = Math.round(Math.max(0, availableBalance) * 100) / 100;
        const formattedBalance = safeBalance.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        throw new Error(`Saldo insuficiente no mês atual. Disponível: ${formattedBalance}`);
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          customer_id: customerId,
          amount: roundedAmount,
          cashback_amount: -roundedAmount, // Negative for redemption
          type: 'redemption',
          status: 'approved',
          comment: orderId ? `Usado no pedido ${orderId.slice(-8)} - Mês ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}` : `Resgate no delivery - Mês ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar transação de resgate:', error);
        
        // Corrigir mensagens de erro com formatação de moeda malformada do Supabase
        let errorMessage = error.message || 'Erro ao processar resgate de cashback';
        
        // Corrigir formatos malformados como "R$ 1.6995.2f", "R$ -18.91.2f", etc.
        const malformedCurrencyMatch = errorMessage.match(/R\$ (-?[\d.,]+)(?:\.2f|f)?/g);
        if (malformedCurrencyMatch) {
          malformedCurrencyMatch.forEach(match => {
            // Extrair apenas os números da string malformada
            const numericPart = match.replace(/R\$\s*/, '').replace(/[^\d.,-]/g, '');
            const numericValue = parseFloat(numericPart.replace(',', '.'));
            
            if (!isNaN(numericValue) && numericValue >= 0) {
              // Garantir precisão de 2 casas decimais
              const cleanValue = Math.round(numericValue * 100) / 100;
              const formattedCurrency = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(cleanValue);
              errorMessage = errorMessage.replace(match, formattedCurrency);
            } else {
              // Se valor é negativo ou inválido, substituir por R$ 0,00
              errorMessage = errorMessage.replace(match, 'R$ 0,00');
            }
          });
        }
        
        // Corrigir mensagens específicas de saldo insuficiente
        if (errorMessage.includes('Saldo insuficiente')) {
          errorMessage = 'Saldo insuficiente no mês atual. Verifique seu cashback disponível.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Transação de resgate criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar transação de resgate:', error);
      
      throw error;
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

  // Função para resetar saldos expirados de cashback de todos os clientes
  const resetExpiredCashbackBalances = async () => {
    try {
      console.log('🔄 Iniciando reset de saldos expirados de cashback...');
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        throw new Error('Supabase não configurado');
      }

      // Buscar todos os clientes
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, balance')
        .gt('balance', 0);

      if (customersError) throw customersError;

      if (!customers || customers.length === 0) {
        console.log('ℹ️ Nenhum cliente com saldo encontrado');
        return { success: true, processed_customers: 0, reset_customers: 0 };
      }

      console.log(`📊 Processando ${customers.length} clientes com saldo...`);

      let processedCustomers = 0;
      let resetCustomers = 0;
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      for (const customer of customers) {
        try {
          processedCustomers++;
          
          // Buscar transações do mês atual para este cliente
          const { data: currentMonthTransactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('customer_id', customer.id)
            .eq('status', 'approved')
            .gte('created_at', currentMonthStart.toISOString())
            .lt('created_at', nextMonthStart.toISOString());

          if (transactionsError) {
            console.error(`❌ Erro ao buscar transações do cliente ${customer.id}:`, transactionsError);
            continue;
          }

          // Calcular saldo do mês atual usando centavos para precisão
          let monthlyBalanceCents = 0;
          
          (currentMonthTransactions || []).forEach(transaction => {
            const cashbackAmountCents = Math.round(transaction.cashback_amount * 100);
            
            if (transaction.type === 'purchase' && transaction.cashback_amount > 0) {
              monthlyBalanceCents += cashbackAmountCents;
            } else if (transaction.type === 'redemption' && transaction.cashback_amount < 0) {
              monthlyBalanceCents += cashbackAmountCents; // Já é negativo
            }
          });

          // Converter para reais e garantir não negativo
          const monthlyBalance = Math.max(0, Math.round(monthlyBalanceCents) / 100);
          
          // Se o saldo do mês atual é diferente do saldo na tabela customers, atualizar
          if (Math.abs(customer.balance - monthlyBalance) > 0.01) {
            console.log(`🔄 Atualizando saldo do cliente ${customer.name || customer.phone}:`, {
              saldoAntigo: customer.balance,
              saldoNovo: monthlyBalance,
              transacoesDoMes: (currentMonthTransactions || []).length
            });

            const { error: updateError } = await supabase
              .from('customers')
              .update({ 
                balance: monthlyBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', customer.id);

            if (updateError) {
              console.error(`❌ Erro ao atualizar saldo do cliente ${customer.id}:`, updateError);
              continue;
            }

            resetCustomers++;
            console.log(`✅ Saldo atualizado para ${customer.name || customer.phone}: ${monthlyBalance}`);
          } else {
            console.log(`✅ Saldo já correto para ${customer.name || customer.phone}: ${customer.balance}`);
          }

        } catch (customerError) {
          console.error(`❌ Erro ao processar cliente ${customer.id}:`, customerError);
          continue;
        }
      }

      console.log('✅ Reset de saldos expirados concluído:', {
        processedCustomers,
        resetCustomers,
        skippedCustomers: processedCustomers - resetCustomers
      });

      return { 
        success: true, 
        processed_customers: processedCustomers,
        reset_customers: resetCustomers,
        message: `${resetCustomers} de ${processedCustomers} clientes tiveram o saldo atualizado`
      };
    } catch (error) {
      console.error('❌ Erro ao resetar saldos expirados:', error);
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
    fixNegativeBalances,
    resetExpiredCashbackBalances
  };
};