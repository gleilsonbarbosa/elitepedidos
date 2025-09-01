import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Filter, ChevronDown, ChevronUp, DollarSign, TrendingUp, TrendingDown, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface CashRegisterWithSummary {
  id: string;
  opening_amount: number;
  closing_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  operator_id: string | null;
  operator_name?: string;
  summary?: {
    sales_total: number;
    delivery_total: number;
    other_income_total: number;
    total_expense: number;
    expected_balance: number;
  };
}

interface CashEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  payment_method: string;
  created_at: string;
}

const PDVCashReportWithDateFilter: React.FC = () => {
  const { operators } = usePDVCashRegister();
  const { hasPermission } = usePermissions();
  const [registers, setRegisters] = useState<CashRegisterWithSummary[]>([]);
  const [entries, setEntries] = useState<{ [registerId: string]: CashEntry[] }>({});
  const [expandedRegisters, setExpandedRegisters] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [reportLoading, setReportLoading] = useState(false);
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
      'misto': 'Pagamento Misto',
      'outros': 'Outros'
    };
    
    return methodNames[method] || method;
  };

  const loadReport = async () => {
    setReportLoading(true);
    try {
      if (!supabaseConfigured) {
        // Mock data for demonstration
        const mockRegisters: CashRegisterWithSummary[] = [
          {
            id: 'mock-register-1',
            opening_amount: 100.00,
            closing_amount: 450.00,
            difference: 5.00,
            opened_at: new Date().toISOString(),
            closed_at: new Date().toISOString(),
            operator_id: 'mock-operator-1',
            operator_name: 'Administrador',
            summary: {
              sales_total: 300.00,
              delivery_total: 50.00,
              other_income_total: 0.00,
              total_expense: 5.00,
              expected_balance: 445.00
            }
          }
        ];
        setRegisters(mockRegisters);
        setReportLoading(false);
        return;
      }

      console.log('📊 Carregando relatório de caixa por período:', { startDate, endDate, selectedOperator, statusFilter });

      // Buscar registros de caixa no período
      let query = supabase
        .from('pdv_cash_registers')
        .select(`
          *,
          pdv_operators!operator_id(name)
        `)
        .gte('opened_at', `${startDate}T00:00:00`)
        .lte('opened_at', `${endDate}T23:59:59`)
        .order('opened_at', { ascending: false });

      if (selectedOperator) {
        query = query.eq('operator_id', selectedOperator);
      }

      const { data: registersData, error: registersError } = await query;

      if (registersError) {
        console.error('❌ Erro ao buscar registros de caixa:', registersError);
        throw registersError;
      }

      console.log(`✅ ${registersData?.length || 0} registros de caixa encontrados`);

      // Processar dados e buscar resumos
      const processedRegisters = await Promise.all((registersData || []).map(async (register) => {
        try {
          // Buscar resumo do caixa
          const { data: summaryData, error: summaryError } = await supabase
            .rpc('get_pdv_cash_summary', { p_register_id: register.id })
            .single();

          if (summaryError) {
            console.warn(`⚠️ Erro ao buscar resumo para caixa ${register.id}:`, summaryError);
          }

          return {
            ...register,
            operator_name: register.pdv_operators?.name || 'Operador',
            summary: summaryData?.success ? summaryData.data : {
              sales_total: 0,
              delivery_total: 0,
              other_income_total: 0,
              total_expense: 0,
              expected_balance: register.opening_amount || 0
            }
          };
        } catch (err) {
          console.error(`❌ Erro ao processar caixa ${register.id}:`, err);
          return {
            ...register,
            operator_name: register.pdv_operators?.name || 'Operador',
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

      // Filtrar por status
      const filteredData = processedRegisters.filter(register => {
        if (statusFilter === 'open') return !register.closed_at;
        if (statusFilter === 'closed') return register.closed_at;
        return true;
      });

      setRegisters(filteredData);
    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error);
      alert('Erro ao carregar relatório de caixa');
    } finally {
      setReportLoading(false);
    }
  };

  const loadCashEntries = async (registerId: string) => {
    try {
      console.log('🔄 Carregando movimentações para o caixa:', registerId);
      
      if (!supabaseConfigured) {
        // Mock entries for demonstration
        const mockEntries: CashEntry[] = [
          {
            id: 'mock-entry-1',
            type: 'income',
            amount: 25.50,
            description: 'Venda #1001',
            payment_method: 'dinheiro',
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-entry-2',
            type: 'income',
            amount: 18.00,
            description: 'Delivery #2001',
            payment_method: 'pix',
            created_at: new Date().toISOString()
          }
        ];
        
        setEntries(prev => ({
          ...prev,
          [registerId]: mockEntries
        }));
        return;
      }

      const { data, error } = await supabase
        .from('pdv_cash_entries')
        .select('*')
        .eq('register_id', registerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar movimentações:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} movimentações carregadas para o caixa ${registerId}`);
      
      setEntries(prev => ({
        ...prev,
        [registerId]: data || []
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar movimentações:', error);
      // Set empty array on error to avoid infinite loading
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
      ['Relatório de Caixa por Período - Elite Açaí'],
      ['Período', `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`],
      [''],
      ['Caixa', 'Operador', 'Abertura', 'Fechamento', 'Vendas PDV', 'Vendas Delivery', 'Outras Entradas', 'Saídas', 'Saldo Esperado', 'Valor Fechamento', 'Diferença', 'Status'],
      ...registers.map(register => [
        `#${register.id.slice(-8)}`,
        register.operator_name || 'N/A',
        formatPrice(register.opening_amount),
        register.closed_at ? formatDateTime(register.closed_at) : 'Aberto',
        formatPrice(register.summary?.sales_total || 0),
        formatPrice(register.summary?.delivery_total || 0),
        formatPrice(register.summary?.other_income_total || 0),
        formatPrice(register.summary?.total_expense || 0),
        formatPrice(register.summary?.expected_balance || 0),
        register.closing_amount ? formatPrice(register.closing_amount) : 'N/A',
        register.difference ? formatPrice(register.difference) : 'N/A',
        register.closed_at ? 'Fechado' : 'Aberto'
      ]),
      [''],
      ['Gerado em', new Date().toLocaleString('pt-BR')]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-caixa-periodo-${startDate}-${endDate}.csv`;
    link.click();
  };

  useEffect(() => {
    loadReport();
  }, []);

  const totalSummary = registers.reduce((acc, register) => {
    const summary = register.summary || {
      sales_total: 0,
      delivery_total: 0,
      other_income_total: 0,
      total_expense: 0,
      expected_balance: 0
    };
    
    return {
      opening_amount: acc.opening_amount + register.opening_amount,
      sales_total: acc.sales_total + summary.sales_total,
      delivery_total: acc.delivery_total + summary.delivery_total,
      other_income_total: acc.other_income_total + summary.other_income_total,
      total_expense: acc.total_expense + summary.total_expense,
      expected_balance: acc.expected_balance + summary.expected_balance,
      closing_amount: acc.closing_amount + (register.closing_amount || 0),
      difference: acc.difference + (register.difference || 0)
    };
  }, {
    opening_amount: 0,
    sales_total: 0,
    delivery_total: 0,
    other_income_total: 0,
    total_expense: 0,
    expected_balance: 0,
    closing_amount: 0,
    difference: 0
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
              <Calendar size={24} className="text-blue-600" />
              Relatório de Caixa por Período
            </h2>
            <p className="text-gray-600">Análise detalhada dos caixas por período</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operador
              </label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os operadores</option>
                {operators.map(operator => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="open">Abertos</option>
                <option value="closed">Fechados</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={loadReport}
              disabled={reportLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {reportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Aplicar Filtros
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {registers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor de Abertura</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalSummary.opening_amount)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(totalSummary.sales_total + totalSummary.delivery_total)}
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
                    {formatPrice(totalSummary.expected_balance)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Diferença Total</p>
                  <p className={`text-2xl font-bold ${totalSummary.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(totalSummary.difference)}
                  </p>
                </div>
                {totalSummary.difference >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cash Registers List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Registros de Caixa</h3>
            <p className="text-gray-600 text-sm">
              {registers.length} registro(s) encontrado(s) no período
            </p>
          </div>
          
          {reportLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando relatório...</p>
            </div>
          ) : registers.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-gray-500">
                Não há registros de caixa para o período e filtros selecionados.
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
                          <p className="text-sm text-gray-600">
                            Operador: {register.operator_name}
                          </p>
                          <p className="text-sm text-gray-600">
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
                              {formatPrice(register.summary?.sales_total || 0)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Delivery</p>
                            <p className="font-medium text-blue-600">
                              {formatPrice(register.summary?.delivery_total || 0)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Saldo Esperado</p>
                            <p className="font-medium">
                              {formatPrice(register.summary?.expected_balance || 0)}
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
                        register.closed_at 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {register.closed_at ? 'Fechado' : 'Aberto'}
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
                    <div className="mt-6 pl-6 border-l-2 border-blue-200 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-blue-600" />
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
                            <p className="text-sm text-gray-400 mt-1">
                              As movimentações aparecerão aqui quando forem registradas.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
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

export default PDVCashReportWithDateFilter;