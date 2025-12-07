import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PDVCashRegister, PDVCashRegisterEntry, PDVCashRegisterSummary } from '../types/pdv';

// Type for PDV Operator
interface PDVOperator {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Função auxiliar para log de debug
const logDebug = (message: string, data?: any) => {
  console.log(`🔍 DEBUG: ${message}`, data);
};

export const usePDVCashRegister = () => {
  const [currentRegister, setCurrentRegister] = useState<PDVCashRegister | null>(null);
  const [entries, setEntries] = useState<PDVCashRegisterEntry[]>([]);
  const [operators, setOperators] = useState<PDVOperator[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [summary, setSummary] = useState<PDVCashRegisterSummary>({
    opening_amount: 0,
    sales_total: 0,
    total_income: 0,
    other_income_total: 0,
    total_expense: 0,
    expected_balance: 0,
    actual_balance: 0,
    difference: 0,
    sales_count: 0,
    delivery_total: 0,
    delivery_count: 0,
    total_all_sales: 0,
    sales: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to validate register data
  const validateRegister = (register: any): PDVCashRegister | null => {
    if (!register || !register.id) {
      console.warn('⚠️ Invalid register data:', register);
      return null;
    }
    return register as PDVCashRegister;
  };

  const fetchOperators = useCallback(async () => {
    try {
      console.log('👥 Buscando operadores...');
      
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('pdv_operators')
        .select('*')
        .order('name', { ascending: true });
      
      if (operatorsError) {
        console.error('Erro ao buscar operadores:', operatorsError);
        if (operatorsError.message === 'Failed to fetch') {
          console.warn('⚠️ Erro de conexão ao buscar operadores - usando modo offline');
        } else {
          throw operatorsError;
        }
      }
      
      setOperators(operatorsData || []);
      console.log(`✅ Carregados ${operatorsData?.length || 0} operadores`);
    } catch (err) {
      console.error('Erro ao carregar operadores:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.warn('⚠️ Erro de conexão ao carregar operadores - continuando sem operadores');
      }
      setOperators([]);
    }
  }, []);

  const fetchCashRegisterStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando modo offline');
        setCurrentRegister(null);
        setEntries([]);
        setSummary({
          opening_amount: 0,
          sales_total: 0,
          total_income: 0,
          other_income_total: 0,
          total_expense: 0,
          expected_balance: 0,
          actual_balance: 0,
          difference: 0,
          sales_count: 0,
          delivery_total: 0,
          delivery_count: 0,
          total_all_sales: 0,
          sales: {}
        });
        setLoading(false);
        return;
      }
      
      console.log('🔄 Buscando status do caixa e movimentações...');
      
      // Verificar se existe um caixa aberto
      const { data: openRegister, error: openError } = await supabase
        .from('pdv_cash_registers')
        .select('*')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (openError) {
        console.error('Erro ao buscar caixa ativo:', openError);
        throw openError;
      }
      
      if (openRegister) {
        console.log('✅ Caixa aberto encontrado:', openRegister.id);
        
        // Buscar entradas do caixa 
        const { data: entriesData, error: entriesError } = await supabase
          .from('pdv_cash_entries')
          .select('*')
          .eq('register_id', openRegister.id)
          .order('created_at', { ascending: false });
          
        if (entriesError) {
          console.error('Erro ao buscar entradas:', entriesError);
          throw entriesError;
        }
        
        setEntries(entriesData || []);
        
        console.log(`✅ Carregadas ${entriesData?.length || 0} movimentações de caixa`);
        
        // Buscar resumo do caixa com todos os dados necessários
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_pdv_cash_summary', { p_register_id: openRegister.id })
          .single();
        
        if (summaryError) {
          console.error('❌ Erro ao buscar resumo do caixa:', summaryError);
          throw summaryError;
        }
        
        if (summaryData.success && summaryData.data) {
          // Combinar dados do caixa com o resumo
          setCurrentRegister({
            ...openRegister
          });          
          
          // Processar os dados do resumo
          const data = summaryData.data;
          setSummary({
            opening_amount: Number(data.opening_amount) || 0,
            sales_total: Number(data.sales_total) || 0,
            total_income: Number(data.total_income) || 0,
            other_income_total: Number(data.other_income_total) || 0,
            total_expense: Number(data.total_expense) || 0,
            expected_balance: Number(data.expected_balance) || 0,
            actual_balance: Number(data.actual_balance) || 0,
            difference: Number(data.difference) || 0,
            sales_count: Number(data.sales_count) || 0,
            delivery_total: Number(data.delivery_total) || 0,
            delivery_count: Number(data.delivery_count) || 0,
            total_all_sales: Number(data.total_all_sales) || 0,
            sales: data.sales || {}
          });
          
          console.log('✅ Resumo do caixa processado:', {
            sales_total: Number(data.sales_total) || 0,
            total_income: Number(data.total_income) || 0,
            other_income_total: Number(data.other_income_total) || 0,
            total_expense: Number(data.total_expense) || 0
          });
          
          return;
        } else {
          setCurrentRegister(openRegister);          
        }
        
        // Buscar resumo do caixa com todos os canais (PDV e delivery)
        const { data: generalSummaryData, error: generalSummaryError } = await supabase
          .rpc('get_pdv_cash_summary', { p_register_id: openRegister.id })
          .single();
        
        if (generalSummaryError) {
          console.error('Erro ao buscar resumo do caixa:', generalSummaryError);
          
          // Não falhar completamente, apenas registrar o erro
          console.log('⚠️ Erro ao buscar resumo do caixa:', generalSummaryError);
          
          // Tentar buscar dados manualmente
          try {
            // Buscar vendas PDV
            const { data: salesData } = await supabase
              .from('pdv_cash_entries')
              .select('*')
              .eq('register_id', openRegister.id)
              .eq('type', 'income')
              .like('description', 'Venda #%');
              
            // Buscar vendas Delivery
            const { data: deliveryData } = await supabase
              .from('pdv_cash_entries')
              .select('*')
              .eq('register_id', openRegister.id)
              .eq('type', 'income')
              .like('description', 'Delivery #%');
              
            // Buscar outras entradas
            const { data: otherIncomeData } = await supabase
              .from('pdv_cash_entries')
              .select('*')
              .eq('register_id', openRegister.id) 
              .eq('type', 'income')
              .not('description', 'ilike', 'Venda #%')
              .not('description', 'ilike', 'Delivery #%');
              
            // Buscar saídas
            const { data: expenseData } = await supabase
              .from('pdv_cash_entries')
              .select('*')
              .eq('register_id', openRegister.id)
              .eq('type', 'expense');
              
            // Calcular totais
            const salesTotal = salesData?.reduce((sum, item) => sum + item.amount, 0) || 0;
            const deliveryTotal = deliveryData?.reduce((sum, item) => sum + item.amount, 0) || 0;
            const otherIncomeTotal = otherIncomeData?.reduce((sum, item) => sum + item.amount, 0) || 0;
            const expenseTotal = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;
            
            // Calcular saldo esperado
            const expectedBalance = openRegister.opening_amount + salesTotal + deliveryTotal + otherIncomeTotal - expenseTotal; // Correctly subtract expenses
            
            // Definir resumo manualmente
            setSummary({
              opening_amount: openRegister.opening_amount || 0,
              sales_total: salesTotal,
              total_income: salesTotal + deliveryTotal + otherIncomeTotal,
              other_income_total: otherIncomeTotal,
              total_expense: expenseTotal,
              expected_balance: expectedBalance,
              actual_balance: openRegister.closing_amount || expectedBalance,
              difference: (openRegister.closing_amount || expectedBalance) - expectedBalance,
              sales_count: salesData?.length || 0,
              delivery_total: deliveryTotal,
              delivery_count: deliveryData?.length || 0,
              total_all_sales: salesTotal + deliveryTotal,
              sales: {}
            });
            
            console.log('✅ Resumo calculado manualmente:', {
              salesTotal,
              deliveryTotal,
              otherIncomeTotal,
              expenseTotal,
              expectedBalance
            });
            
            return;
          } catch (manualError) {
            console.error('Erro ao calcular resumo manualmente:', manualError);
            
            // Definir valores padrão para o resumo
            setSummary({
              opening_amount: openRegister.opening_amount || 0,
              sales_total: 0,
              total_income: 0,
              other_income_total: 0,
              total_expense: 0,
              expected_balance: openRegister.opening_amount || 0,
              actual_balance: openRegister.opening_amount || 0,
              difference: 0,
              sales_count: 0,
              delivery_total: 0,
              delivery_count: 0,
              total_all_sales: 0,
              sales: {}
            });
            
            return;
          }
        }
        
        if (generalSummaryData.success && generalSummaryData.data) {
          console.log('✅ Dados do resumo do caixa:', generalSummaryData.data);
          
          // Log detalhado para diagnóstico
          console.log('🔍 Detalhes do resumo do caixa:', {
            opening_amount: generalSummaryData.data.opening_amount,
            sales_total: generalSummaryData.data.sales_total,
            delivery_total: generalSummaryData.data.delivery_total,
            other_income_total: generalSummaryData.data.other_income_total,
            total_expense: generalSummaryData.data.total_expense,
            expected_balance: generalSummaryData.data.expected_balance
          });
          
          try {
            setSummary({
              opening_amount: Number(generalSummaryData.data.opening_amount) || 0,
              sales_total: Number(generalSummaryData.data.sales_total) || 0, 
              total_income: Number(generalSummaryData.data.total_income) || 0,
              other_income_total: Number(generalSummaryData.data.other_income_total) || 0, 
              total_expense: Number(generalSummaryData.data.total_expense) || 0,
              expected_balance: Number(generalSummaryData.data.expected_balance) || 0,
              actual_balance: Number(generalSummaryData.data.actual_balance) || 0,
              difference: Number(generalSummaryData.data.difference) || 0,
              sales_count: Number(generalSummaryData.data.sales_count) || 0,
              delivery_total: Number(generalSummaryData.data.delivery_total) || 0,
              delivery_count: Number(generalSummaryData.data.delivery_count) || 0,
              total_all_sales: Number(generalSummaryData.data.total_all_sales) || 0,
              sales: generalSummaryData.data.sales || {}
            });
            
            console.log('✅ Definindo estado do resumo:', {
              sales_total: Number(generalSummaryData.data.sales_total) || 0,
              sales_count: Number(generalSummaryData.data.sales_count) || 0,
              delivery_count: Number(generalSummaryData.data.delivery_count) || 0,
              total_all_sales: Number(generalSummaryData.data.total_all_sales) || 0,
              delivery_total: Number(generalSummaryData.data.delivery_total) || 0,
              other_income_total: Number(generalSummaryData.data.other_income_total) || 0,
              total_expense: Number(generalSummaryData.data.total_expense) || 0,
              expected_balance: Number(generalSummaryData.data.expected_balance) || 0
            });
          } catch (err) {
            console.error('❌ Error setting summary state:', err);
          }
        } else {
          console.error('❌ Resumo do caixa retornou dados inválidos:', generalSummaryData);
        }
      } else {
        console.log('ℹ️ Nenhum caixa aberto no momento');
        setCurrentRegister(null);
        setEntries([]);
        setSummary({
          opening_amount: 0,
          sales_total: 0,
          total_income: 0,
          other_income_total: 0,
          total_expense: 0,
          expected_balance: 0,
          actual_balance: 0,
          difference: 0,
          sales_count: 0,
          delivery_total: 0,
          delivery_count: 0,
          total_all_sales: 0,
          sales: {}
        });
      }
    } catch (err) {
      console.error('Erro ao carregar caixa:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Erro de conexão: Verifique se o Supabase está configurado corretamente ou se há problemas de rede.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar caixa');
      }
      
      // Set fallback values when connection fails
      setCurrentRegister(null);
      setEntries([]);
      setSummary({
        opening_amount: 0,
        sales_total: 0,
        total_income: 0,
        other_income_total: 0,
        total_expense: 0,
        expected_balance: 0,
        actual_balance: 0,
        difference: 0,
        sales_count: 0,
        delivery_total: 0,
        delivery_count: 0,
        total_all_sales: 0,
        sales: {}
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const openCashRegister = useCallback(async (openingAmount: number) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      if (openingAmount <= 0) {
        throw new Error('O valor de abertura deve ser maior que zero.');
      }
      
      console.log('🚀 Abrindo caixa com valor:', openingAmount);
      
      const { data, error } = await supabase
        .from('pdv_cash_registers')
        .insert([{
          opening_amount: openingAmount,
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao abrir caixa:', error);
        throw error;
      }
      
      setCurrentRegister(data);
      console.log('✅ Caixa aberto com sucesso:', data.id);
      
      await fetchCashRegisterStatus();
      
      // Vincular pedidos órfãos ao novo caixa
      try {
        console.log('🔗 Vinculando pedidos órfãos ao novo caixa...');
        const { data: orphanOrders, error: orphanError } = await supabase
          .from('orders')
          .update({ cash_register_id: data.id })
          .is('cash_register_id', null)
          .select('id');
        
        if (orphanError) {
          console.warn('⚠️ Erro ao vincular pedidos órfãos:', orphanError);
        } else {
          console.log(`✅ ${orphanOrders?.length || 0} pedidos órfãos vinculados ao caixa`);
        }
      } catch (linkError) {
        console.warn('⚠️ Erro ao vincular pedidos órfãos (não crítico):', linkError);
      }
       
      return data;
    } catch (err) {
      console.error('Erro ao abrir caixa:', err);
      throw err;
    }
  }, [fetchCashRegisterStatus]);

  const closeCashRegister = useCallback(async (closingAmount: number) => {
    console.log('🔒 Iniciando fechamento de caixa com valor:', closingAmount);
    console.log('💰 Saldo esperado:', summary.expected_balance);
    console.log('🧮 Diferença calculada:', closingAmount - summary.expected_balance);
    console.log('📊 Summary completo antes do fechamento:', {
      opening_amount: summary.opening_amount,
      sales_total: summary.sales_total,
      delivery_total: summary.delivery_total,
      other_income_total: summary.other_income_total,
      total_expense: summary.total_expense,
      expected_balance: summary.expected_balance,
      sales_count: summary.sales_count,
      delivery_count: summary.delivery_count
    });
    
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        return {
          success: false,
          error: 'Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.'
        };
      }
      
      if (!currentRegister) {
        return { success: false, error: 'Nenhum caixa aberto para fechar' };
      }
      
      if (closingAmount <= 0) {
        return { success: false, error: 'O valor de fechamento deve ser maior que zero.' };
      }
      
      // Use the RPC function to close the register
      const { data, error } = await supabase
        .rpc('close_pdv_cash_register', {
          p_register_id: currentRegister.id,
          p_closing_amount: closingAmount
        });
      
      if (error) {
        console.error('❌ Erro ao fechar caixa:', error);
        return {
          success: false,
          error: error.message || 'Erro ao fechar caixa'
        };
      }
      
      console.log('✅ Caixa fechado com sucesso. Dados:', data);
      
      // Atualizar o registro atual com os dados de fechamento
      setCurrentRegister(prev => prev ? {
        ...prev,
        closing_amount: closingAmount,
        closed_at: new Date().toISOString(),
        difference: closingAmount - (summary?.expected_balance || 0)
      } : null);
      
      // Não recarregar o status imediatamente para preservar os dados do summary
      // await fetchCashRegisterStatus();
      
      return { 
        success: true, 
        data: data.data,
        summary: summary // Retornar o summary atual
      };
    } catch (err) {
      console.error('❌ Erro ao fechar caixa (exceção):', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao fechar caixa' 
      };
    }
  }, [currentRegister, summary]);

  const addCashEntry = useCallback(async (entry: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    payment_method?: string;
    registerId?: string;
  }) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      let targetRegisterId = entry.registerId;
      
      // If no specific register ID provided, find the active one
      if (!targetRegisterId) {
        const { data: activeRegister, error: checkError } = await supabase
          .from('pdv_cash_registers')
          .select('*')
          .is('closed_at', null)
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (checkError) {
          console.error('Erro ao verificar status do caixa:', checkError);
          throw new Error('Erro ao verificar status do caixa');
        }
        
        if (!activeRegister) {
          throw new Error('Nenhum caixa aberto. Abra o caixa antes de adicionar entradas.');
        }
        
        targetRegisterId = activeRegister.id;
      } else {
        // Validate that the provided register ID exists and is open
        const { data: specificRegister, error: specificError } = await supabase
          .from('pdv_cash_registers')
          .select('*')
          .eq('id', targetRegisterId)
          .is('closed_at', null)
          .single();
        
        if (specificError || !specificRegister) {
          console.error('Erro: Caixa especificado não está aberto:', specificError);
          throw new Error('Caixa especificado não está aberto ou não existe.');
        }
      }
      
      if (!entry.description || entry.amount <= 0) {
        throw new Error('Descrição e valor são obrigatórios');
      }
      
      console.log('💰 Adicionando entrada ao caixa:', entry);
      
      // Map payment method to valid database values
      const paymentMethodMap: { [key: string]: string } = {
        'dinheiro': 'dinheiro',
        'cartao': 'cartao_credito',
        'cartao_credito': 'cartao_credito',
        'cartao_debito': 'cartao_debito',
        'pix': 'pix',
        'voucher': 'voucher',
        'misto': 'misto'
      };
      
      const payment_method = paymentMethodMap[entry.payment_method || 'dinheiro'] || 'dinheiro';
      
      const { data, error } = await supabase
        .from('pdv_cash_entries')
        .insert([{
          register_id: targetRegisterId,
          type: entry.type,
          amount: entry.amount,
          description: entry.description,
          payment_method: payment_method
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar entrada:', error);
        throw error;
      }
      
      console.log('✅ Entrada adicionada com sucesso:', data);
      await fetchCashRegisterStatus();
      
      return data;
    } catch (err) {
      console.error('Erro ao adicionar entrada:', err);
      throw err;
    }
  }, [fetchCashRegisterStatus]);

  const getCashRegisterReport = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
    operatorId?: string;
  }) => {
    const startDate = filters?.startDate || new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
    const endDate = filters?.endDate || new Date().toISOString().split('T')[0];
    const operatorId = filters?.operatorId;
    
    try {
      console.log('📊 Buscando relatório de caixa com filtros:', { startDate, endDate, operatorId });
      
      // Call the RPC function to get detailed cash register history
      const { data, error } = await supabase
        .rpc('get_cash_register_history', { 
          start_date: startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
          end_date: endDate || new Date().toISOString().split('T')[0],
          limit_count: 50
        });
      
      if (error) {
        console.error('Erro ao buscar relatório de caixa:', error);
        setError(`Erro ao buscar relatório de caixa: ${error.message}`);
        return [];
      }
      
      console.log(`✅ Relatório gerado com ${data?.length || 0} registros de caixa`);
      setError(null); // Clear any previous errors on success
      
      // Process the data to include summary information
      const processedData = await Promise.all((data || []).map(async (register) => {
        try {
          // Get summary for each register
          const { data: summaryData, error: summaryError } = await supabase
            .rpc('get_pdv_cash_summary', { p_register_id: register.id })
            .single();
          
          if (summaryError) {
            console.error(`Erro ao buscar resumo para caixa ${register.id}:`, summaryError);
            return {
              ...register,
              summary: {
                sales_total: 0,
                delivery_total: 0,
                other_income_total: 0,
                total_expense: 0,
                expected_balance: register.opening_amount || 0
              }
            };
          }
          
          return {
            ...register,
            summary: summaryData?.data || {
              sales_total: 0,
              delivery_total: 0,
              other_income_total: 0,
              total_expense: 0,
              expected_balance: register.opening_amount || 0
            }
          };
        } catch (err) {
          console.error(`Erro ao processar caixa ${register.id}:`, err);
          return {
            ...register,
            summary: {
              sales_total: 0,
              delivery_total: 0,
              other_income_total: 0,
              total_expense: 0,
              expected_balance: register.opening_amount || 0
            }
          };
        }
      }));
      
      return processedData;
    } catch (err) {
      console.error('Erro ao carregar relatório de caixa:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Erro de conexão: Não foi possível carregar o relatório. Verifique sua conexão com o banco de dados.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar relatório');
      }
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCashRegisterStatus();
    fetchOperators();

    // Verificar se existem registros nas tabelas
    const checkTables = async () => {
      try {
        // Verificar registros na tabela pdv_cash_registers
        const { count: registerCount, error: registerError } = await supabase
          .from('pdv_cash_registers')
          .select('*', { count: 'exact', head: true });

        if (registerError) throw registerError;

        // Verificar registros na tabela pdv_cash_entries
        const { count: entriesCount, error: entriesError } = await supabase
          .from('pdv_cash_entries')
          .select('*', { count: 'exact', head: true });

        if (entriesError) throw entriesError;

        console.log('🔍 Verificação de tabelas:', {
          pdv_cash_registers: registerCount,
          pdv_cash_entries: entriesCount
        });
      } catch (err) {
        console.error('Erro ao verificar tabelas:', err);
      }
    };

    checkTables();

    const cashEntriesChannel = supabase
      .channel('pdv_cash_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdv_cash_entries'
        },
        (payload) => {
          console.log('💰 Mudança detectada em pdv_cash_entries:', payload);

          const isPaymentMethodChange = payload.eventType === 'UPDATE' &&
            payload.old?.payment_method !== payload.new?.payment_method;

          const isDelete = payload.eventType === 'DELETE';

          if (isPaymentMethodChange) {
            console.log('💳 MUDANÇA DE FORMA DE PAGAMENTO detectada:', {
              de: payload.old?.payment_method,
              para: payload.new?.payment_method,
              entrada: payload.new?.description
            });
          }

          if (isDelete) {
            console.log('🗑️ EXCLUSÃO DE ENTRADA detectada:', {
              descrição: payload.old?.description,
              valor: payload.old?.amount,
              método: payload.old?.payment_method
            });
          }

          setTimeout(() => {
            console.log('🔄 Atualizando status do caixa após mudança em entries...');
            setUpdateTrigger(prev => prev + 1);
            fetchCashRegisterStatus();
          }, (isPaymentMethodChange || isDelete) ? 1000 : 800);
        }
      )
      .subscribe();

    const salesChannel = supabase
      .channel('pdv_sales_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pdv_sales',
          filter: 'is_cancelled=eq.true'
        },
        (payload) => {
          console.log('🚫 Venda PDV cancelada detectada:', payload);
          setTimeout(() => {
            console.log('🔄 Aguardando estorno ser processado e atualizando...');
            setUpdateTrigger(prev => prev + 1);
            fetchCashRegisterStatus();
          }, 1000);
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.cancelled'
        },
        (payload) => {
          console.log('🚫 Pedido delivery cancelado detectado:', payload);
          setTimeout(() => {
            console.log('🔄 Aguardando estorno ser processado e atualizando...');
            setUpdateTrigger(prev => prev + 1);
            fetchCashRegisterStatus();
          }, 1000);
        }
      )
      .subscribe();

    const store2SalesChannel = supabase
      .channel('store2_sales_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store2_pdv_sales',
          filter: 'is_cancelled=eq.true'
        },
        (payload) => {
          console.log('🚫 Venda Loja 2 cancelada detectada:', payload);
          setTimeout(() => {
            console.log('🔄 Aguardando estorno ser processado e atualizando...');
            setUpdateTrigger(prev => prev + 1);
            fetchCashRegisterStatus();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cashEntriesChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(store2SalesChannel);
    };
  }, [fetchCashRegisterStatus, fetchOperators]);

  return {
    currentRegister,
    entries,
    operators,
    summary, 
    loading,
    error,
    isOpen: !!currentRegister,
    openCashRegister,
    closeCashRegister,
    addCashEntry,
    refreshData: fetchCashRegisterStatus,
    getCashRegisterReport
  };
};