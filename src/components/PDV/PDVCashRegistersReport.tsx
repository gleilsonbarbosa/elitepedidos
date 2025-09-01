import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Clock,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface CashRegisterReport {
  id: string;
  opening_amount: number;
  closing_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  operator_name: string;
  sales_total: number;
  delivery_total: number;
  other_income_total: number;
  total_expense: number;
  expected_balance: number;
  sales_count: number;
  delivery_count: number;
  entries_count: number;
  status: 'open' | 'closed';
}

interface CashRegisterEntry {
  id: string;
  register_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  payment_method: string;
  created_at: string;
}

const PDVCashRegistersReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [registers, setRegisters] = useState<CashRegisterReport[]>([]);
  const [entries, setEntries] = useState<{ [registerId: string]: CashRegisterEntry[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRegisters, setExpandedRegisters] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return methodNames[method] || method;
  };

  const loadCashRegistersReport = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabaseConfigured) {
        // Mock data for demonstration
        const mockRegisters: CashRegisterReport[] = [
          {
            id: 'mock-register-1',
            opening_amount: 100.00,
            closing_amount: 450.00,
            difference: 5.00,
            opened_at: new Date().toISOString(),
            closed_at: new Date().toISOString(),
            operator_name: 'Administrador',
            sales_total: 300.00,
            delivery_total: 50.00,
            other_income_total: 0.00,
            total_expense: 5.00,
            expected_balance: 445.00,
            sales_count: 15,
            delivery_count: 3,
            entries_count: 18,
            status: 'closed'
          },
          {
            id: 'mock-register-2',
            opening_amount: 150.00,
            closing_amount: null,
            difference: null,
            opened_at: new Date().toISOString(),
            closed_at: null,
            operator_name: 'Operador 1',
            sales_total: 200.00,
            delivery_total: 25.00,
            other_income_total: 10.00,
            total_expense: 0.00,
            expected_balance: 385.00,
            sales_count: 8,
            delivery_count: 2,
            entries_count: 10,
            status: 'open'
          }
        ];
        setRegisters(mockRegisters);
        setLoading(false);
        return;
      }

      console.log('📊 Carregando relatório de caixas para:', dateFilter);

      // Build date range for the selected date
      const startDate = `${dateFilter}T00:00:00`;
      const endDate = `${dateFilter}T23:59:59`;

      // Fetch cash registers for the selected date
      let query = supabase
        .from('pdv_cash_registers')
        .select(`
          *,
          pdv_operators!operator_id(name)
        `)
        .gte('opened_at', startDate)
        .lte('opened_at', endDate)
        .order('opened_at', { ascending: false });

      if (operatorFilter !== 'all') {
        query = query.eq('operator_id', operatorFilter);
      }

      const { data: registersData, error: registersError } = await query;

      if (registersError) {
        console.error('❌ Erro ao buscar registros de caixa:', registersError);
        throw registersError;
      }

      console.log(`✅ ${registersData?.length || 0} registros de caixa encontrados`);

      // Process registers and calculate summaries
      const processedRegisters = await Promise.all((registersData || []).map(async (register) => {
        try {
          // Calculate sales totals for this register - buscar vendas do período do caixa
          const registerStart = register.opened_at;
          const registerEnd = register.closed_at || new Date().toISOString();
          
          console.log(`📊 Calculando vendas para caixa ${register.id.slice(-8)}:`, {
            registerStart,
            registerEnd,
            operator: register.pdv_operators?.name
          });

          // Buscar vendas PDV do período do caixa (não apenas as linkadas)
          const { data: salesData, error: salesError } = await supabase
            .from('pdv_sales')
            .select('total_amount, payment_type, created_at')
            .gte('created_at', registerStart)
            .lte('created_at', registerEnd)
            .eq('is_cancelled', false);

          if (salesError) {
            console.warn(`⚠️ Erro ao buscar vendas PDV para caixa ${register.id}:`, salesError);
          }

          // Buscar pedidos de delivery do período do caixa
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('orders')
            .select('total_price, created_at, payment_method')
            .gte('created_at', registerStart)
            .lte('created_at', registerEnd)
            .eq('channel', 'delivery')
            .neq('status', 'cancelled');

          if (deliveryError) {
            console.warn(`⚠️ Erro ao buscar delivery para caixa ${register.id}:`, deliveryError);
          }

          // Buscar vendas de mesa do período do caixa
          const { data: tableData, error: tableError } = await supabase
            .from('store1_table_sales')
            .select('total_amount, created_at, payment_type')
            .gte('created_at', registerStart)
            .lte('created_at', registerEnd)
            .eq('status', 'fechada');

          if (tableError) {
            console.warn(`⚠️ Erro ao buscar vendas de mesa para caixa ${register.id}:`, tableError);
          }

          // Buscar entradas manuais do caixa
          const { data: entriesData, error: entriesError } = await supabase
            .from('pdv_cash_entries')
            .select('type, amount, payment_method')
            .eq('register_id', register.id);

          if (entriesError) {
            console.warn(`⚠️ Erro ao buscar entradas para caixa ${register.id}:`, entriesError);
          }

          // Calcular totais
          const salesTotal = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
          const deliveryTotal = deliveryData?.reduce((sum, order) => sum + order.total_price, 0) || 0;
          const tableTotal = tableData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
          const otherIncomeTotal = entriesData?.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0) || 0;
          const totalExpense = entriesData?.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0) || 0;
          
          // Calcular saldo esperado (apenas dinheiro afeta o caixa físico)
          const cashSalesTotal = salesData?.filter(s => s.payment_type === 'dinheiro').reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
          const cashDeliveryTotal = deliveryData?.filter(d => d.payment_method === 'money').reduce((sum, order) => sum + order.total_price, 0) || 0;
          const cashTableTotal = tableData?.filter(t => t.payment_type === 'dinheiro').reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
          const cashIncomeTotal = entriesData?.filter(e => e.type === 'income' && e.payment_method === 'dinheiro').reduce((sum, e) => sum + e.amount, 0) || 0;
          const cashExpenseTotal = entriesData?.filter(e => e.type === 'expense' && e.payment_method === 'dinheiro').reduce((sum, e) => sum + e.amount, 0) || 0;
          
          const expectedBalance = register.opening_amount + cashSalesTotal + cashDeliveryTotal + cashTableTotal + cashIncomeTotal - cashExpenseTotal;
          
          console.log(`📊 Totais calculados para caixa ${register.id.slice(-8)}:`, {
            salesTotal,
            deliveryTotal,
            tableTotal,
            otherIncomeTotal,
            totalExpense,
            expectedBalance,
            salesCount: salesData?.length || 0,
            deliveryCount: deliveryData?.length || 0,
            tableCount: tableData?.length || 0
          });

          return {
            ...register,
            operator_name: register.pdv_operators?.name || 'Operador',
            sales_total: salesTotal,
            delivery_total: deliveryTotal,
            table_total: tableTotal,
            other_income_total: otherIncomeTotal,
            total_expense: totalExpense,
            expected_balance: expectedBalance,
            sales_count: salesData?.length || 0,
            delivery_count: deliveryData?.length || 0,
            table_count: tableData?.length || 0,
            entries_count: entriesData?.length || 0,
            status: register.closed_at ? 'closed' as const : 'open' as const
          };
        } catch (err) {
          console.error(`❌ Erro ao processar caixa ${register.id}:`, err);
          return {
            ...register,
            operator_name: register.pdv_operators?.name || 'Operador',
            sales_total: 0,
            delivery_total: 0,
            other_income_total: 0,
            total_expense: 0,
            expected_balance: register.opening_amount || 0,
            sales_count: 0,
            delivery_count: 0,
            entries_count: 0,
            status: register.closed_at ? 'closed' as const : 'open' as const
          };
        }
      }));

      // Apply status filter
      const filteredRegisters = processedRegisters.filter(register => {
        if (statusFilter === 'open') return register.status === 'open';
        if (statusFilter === 'closed') return register.status === 'closed';
        return true;
      });

      setRegisters(filteredRegisters);

    } catch (err) {
      console.error('❌ Erro ao carregar relatório de caixas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadCashEntries = async (registerId: string) => {
    try {
      if (!supabaseConfigured) {
        // Mock entries for demonstration
        const mockEntries: CashRegisterEntry[] = [
          {
            id: 'mock-entry-1',
            register_id: registerId,
            type: 'income',
            amount: 25.50,
            description: 'Venda #1001',
            payment_method: 'dinheiro',
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-entry-2',
            register_id: registerId,
            type: 'expense',
            amount: 5.00,
            description: 'Troco',
            payment_method: 'dinheiro',
            created_at: new Date().toISOString()
          }
        ];
        
        setEntries(prev => ({
          ...prev,
          [registerId]: mockEntries
        }));
        return;
      }

      console.log('🔄 Carregando movimentações para o caixa:', registerId);

      const { data, error } = await supabase
        .from('pdv_cash_entries')
        .select('*')
        .eq('register_id', registerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar movimentações:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} movimentações carregadas`);
      
      setEntries(prev => ({
        ...prev,
        [registerId]: data || []
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar movimentações:', error);
      setEntries(prev => ({
        ...prev,
        [registerId]: []
      }));
    }
  };

  const toggleRegisterExpansion = (registerId: string) => {
    const newExpanded = new Set(expandedRegisters);
    if (newExpanded.has(registerId)) {
      newExpanded.delete(registerId);
    } else {
      newExpanded.add(registerId);
      // Load entries when expanding
      if (!entries[registerId]) {
        loadCashEntries(registerId);
      }
    }
    setExpandedRegisters(newExpanded);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (registers.length === 0) return;

    const csvContent = [
      ['Relatório de Caixas - Elite Açaí'],
      ['Data', new Date(dateFilter).toLocaleDateString('pt-BR')],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      [''],
      ['Caixa', 'Operador', 'Abertura', 'Fechamento', 'Vendas PDV', 'Vendas Delivery', 'Outras Entradas', 'Saídas', 'Saldo Esperado', 'Valor Fechamento', 'Diferença', 'Status'],
      ...registers.map(register => [
        `#${register.id.slice(-8)}`,
        register.operator_name,
        formatPrice(register.opening_amount),
        register.closed_at ? formatDateTime(register.closed_at) : 'Aberto',
        formatPrice(register.sales_total),
        formatPrice(register.delivery_total),
        formatPrice(register.other_income_total),
        formatPrice(register.total_expense),
        formatPrice(register.expected_balance),
        register.closing_amount ? formatPrice(register.closing_amount) : 'N/A',
        register.difference ? formatPrice(register.difference) : 'N/A',
        register.status === 'closed' ? 'Fechado' : 'Aberto'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-caixas-${dateFilter}.csv`;
    link.click();
  };

  useEffect(() => {
    loadCashRegistersReport();
  }, [dateFilter, statusFilter, operatorFilter]);

  // Calculate totals
  const totals = registers.reduce((acc, register) => ({
    opening_amount: acc.opening_amount + register.opening_amount,
    sales_total: acc.sales_total + register.sales_total,
    delivery_total: acc.delivery_total + register.delivery_total,
    table_total: acc.table_total + (register.table_total || 0),
    other_income_total: acc.other_income_total + register.other_income_total,
    total_expense: acc.total_expense + register.total_expense,
    expected_balance: acc.expected_balance + register.expected_balance,
    closing_amount: acc.closing_amount + (register.closing_amount || 0),
    difference: acc.difference + (register.difference || 0),
    sales_count: acc.sales_count + register.sales_count,
    delivery_count: acc.delivery_count + register.delivery_count,
    table_count: acc.table_count + (register.table_count || 0)
  }), {
    opening_amount: 0,
    sales_total: 0,
    delivery_total: 0,
    table_total: 0,
    other_income_total: 0,
    total_expense: 0,
    expected_balance: 0,
    closing_amount: 0,
    difference: 0,
    sales_count: 0,
    delivery_count: 0,
    table_count: 0
  });

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_cash_report') || hasPermission('can_view_cash_register')} showMessage={true}>
      <div className="space-y-6">
        {/* Supabase Configuration Warning */}
        {!supabaseConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
                <p className="text-yellow-700 text-sm">
                  Supabase não configurado. Exibindo dados de demonstração.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign size={24} className="text-green-600" />
              Relatório de Caixas
            </h2>
            <p className="text-gray-600">Análise completa dos caixas por data</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadCashRegistersReport}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              onClick={handlePrint}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={handleExport}
              disabled={registers.length === 0}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <div className="relative">
                <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos</option>
                <option value="open">Abertos</option>
                <option value="closed">Fechados</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operador
              </label>
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos os operadores</option>
                {/* Add operator options dynamically */}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {registers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Caixas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {registers.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {registers.filter(r => r.status === 'open').length} abertos
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Geral</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(totals.sales_total + totals.delivery_total + (totals.table_total || 0))}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totals.sales_count + totals.delivery_count + (totals.table_count || 0)} vendas
                  </p>
                  <p className="text-xs text-gray-500">
                    {totals.sales_count + totals.delivery_count} vendas
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saldo Esperado</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(totals.expected_balance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total consolidado
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Diferença Total</p>
                  <p className={`text-2xl font-bold ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(totals.difference)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totals.difference >= 0 ? 'Sobra' : 'Falta'}
                  </p>
                </div>
                {totals.difference >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Cash Registers List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Caixas do Dia</h3>
            <p className="text-gray-600 text-sm">
              {registers.length} caixa(s) encontrado(s) para {new Date(dateFilter).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando relatório de caixas...</p>
            </div>
          ) : registers.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum caixa encontrado
              </h3>
              <p className="text-gray-500">
                Não há registros de caixa para a data selecionada.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {registers.map((register) => (
                <div key={register.id} className="p-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    onClick={() => toggleRegisterExpansion(register.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            Caixa #{register.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User size={14} />
                            {register.operator_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock size={14} />
                            Aberto: {formatDateTime(register.opened_at)}
                          </p>
                          {register.closed_at && (
                            <p className="text-sm text-gray-600">
                              Fechado: {formatDateTime(register.closed_at)}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-500">Abertura</p>
                            <p className="font-medium">{formatPrice(register.opening_amount)}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Vendas PDV</p>
                            <p className="font-medium text-green-600">
                              {formatPrice(register.sales_total)}
                            </p>
                            <p className="text-xs text-gray-400">{register.sales_count} vendas</p>
                            <p className="text-xs text-gray-400">{register.sales_count} vendas</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Delivery</p>
                            <p className="font-medium text-blue-600">
                              {formatPrice(register.delivery_total)}
                            </p>
                            <p className="text-xs text-gray-400">{register.delivery_count} pedidos</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Mesas</p>
                            <p className="font-medium text-orange-600">
                              {formatPrice(register.table_total || 0)}
                            </p>
                            <p className="text-xs text-gray-400">{register.table_count} mesas</p>
                            <p className="text-xs text-gray-400">{register.delivery_count} pedidos</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Saldo Esperado</p>
                            <p className="font-medium">
                              {formatPrice(register.expected_balance)}
                            </p>
                          </div>
                          
                          {register.closed_at && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Fechamento</p>
                                <p className="font-medium">{formatPrice(register.closing_amount || 0)}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Diferença</p>
                                <p className={`font-medium ${(register.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPrice(register.difference || 0)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        register.status === 'closed'
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {register.status === 'closed' ? 'Fechado' : 'Aberto'}
                      </span>
                      
                      {expandedRegisters.has(register.id) ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedRegisters.has(register.id) && (
                    <div className="mt-6 pl-6 border-l-2 border-green-200 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-green-600" />
                        Movimentações Detalhadas
                      </h4>
                      
                      {entries[register.id] ? (
                        entries[register.id].length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white">
                                <tr>
                                  <th className="text-left py-3 px-4 font-medium text-gray-700 border-b">Data/Hora</th>
                                  <th className="text-left py-3 px-4 font-medium text-gray-700 border-b">Tipo</th>
                                  <th className="text-left py-3 px-4 font-medium text-gray-700 border-b">Descrição</th>
                                  <th className="text-left py-3 px-4 font-medium text-gray-700 border-b">Método</th>
                                  <th className="text-right py-3 px-4 font-medium text-gray-700 border-b">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {entries[register.id].map((entry) => (
                                  <tr key={entry.id} className="hover:bg-white">
                                    <td className="py-3 px-4 text-sm text-gray-900">
                                      {formatDateTime(entry.created_at)}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        entry.type === 'income' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {entry.type === 'income' ? 'Entrada' : 'Saída'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-900">
                                      {entry.description}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {getPaymentMethodName(entry.payment_method)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right">
                                      <span className={`font-medium ${
                                        entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {entry.type === 'income' ? '+' : '-'}
                                        {formatPrice(entry.amount)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                            <p>Nenhuma movimentação registrada para este caixa.</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Carregando movimentações...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Section */}
        {registers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo Consolidado</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{formatPrice(totals.sales_total + totals.delivery_total)}</p>
                <p className="text-gray-600">Total de Vendas</p>
                <p className="text-sm text-gray-500">{totals.sales_count + totals.delivery_count} vendas</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{formatPrice(totals.expected_balance)}</p>
                <p className="text-gray-600">Saldo Esperado</p>
                <p className="text-sm text-gray-500">Todos os caixas</p>
              </div>
              
              <div className="text-center">
                <p className={`text-3xl font-bold ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(totals.difference)}
                </p>
                <p className="text-gray-600">Diferença Total</p>
                <p className="text-sm text-gray-500">
                  {totals.difference === 0 ? 'Exato' : totals.difference > 0 ? 'Sobra' : 'Falta'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            @page {
              size: portrait;
              margin: 10mm;
            }
            
            body {
              font-family: Arial, sans-serif;
              color: #000;
              background: #fff;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
            }
          }
        `}</style>
      </div>
    </PermissionGuard>
  );
};

export default PDVCashRegistersReport;