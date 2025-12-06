import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Search, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CashFlowEntry {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  loja: string;
  criado_em: string;
  criado_por: string;
  forma_pagamento?: string;
  metadata_pagamento?: {
    formas?: Array<{
      metodo: string;
      valor: number;
    }>;
  };
}

interface CashFlowHistoryProps {
  selectedStore?: string;
}

const CashFlowHistory: React.FC<CashFlowHistoryProps> = ({ selectedStore = 'loja1' }) => {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTypeLabel = (tipo: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'sistema_entrada': { label: 'Venda Sistema', color: 'bg-green-100 text-green-800' },
      'receita': { label: 'Receita', color: 'bg-blue-100 text-blue-800' },
      'transferencia_entrada': { label: 'Transferência Entrada', color: 'bg-cyan-100 text-cyan-800' },
      'transferencia_saida': { label: 'Transferência Saída', color: 'bg-orange-100 text-orange-800' },
      'despesa': { label: 'Despesa', color: 'bg-red-100 text-red-800' },
      'gasto_fixo': { label: 'Gasto Fixo', color: 'bg-purple-100 text-purple-800' },
      'sistema_fechamento': { label: 'Fechamento', color: 'bg-gray-100 text-gray-800' },
      'saldo_inicial': { label: 'Saldo Inicial', color: 'bg-yellow-100 text-yellow-800' }
    };

    return types[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentMethodDisplay = (forma_pagamento?: string) => {
    if (!forma_pagamento) return null;

    const methods: Record<string, { method: string; color: string }> = {
      'pix': { method: 'PIX', color: 'bg-blue-100 text-blue-800' },
      'cartao_credito': { method: 'Cartão Crédito', color: 'bg-purple-100 text-purple-800' },
      'cartao_debito': { method: 'Cartão Débito', color: 'bg-indigo-100 text-indigo-800' },
      'dinheiro': { method: 'Dinheiro', color: 'bg-green-100 text-green-800' },
      'voucher': { method: 'Voucher', color: 'bg-yellow-100 text-yellow-800' },
      'misto': { method: 'Misto', color: 'bg-orange-100 text-orange-800' }
    };

    return methods[forma_pagamento] || { method: forma_pagamento, color: 'bg-gray-100 text-gray-800' };
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      console.log('📊 Carregando histórico de movimentações...');

      const { data, error } = await supabase
        .from('financeiro_fluxo')
        .select('*')
        .eq('loja', selectedStore)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      console.log('✅ Movimentações carregadas:', data?.length || 0);
      setEntries(data || []);
      setFilteredEntries(data || []);

    } catch (err) {
      console.error('❌ Erro ao carregar histórico:', err);
      alert('Erro ao carregar histórico de movimentações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();

    const channel = supabase
      .channel('cash-flow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financeiro_fluxo',
          filter: `loja=eq.${selectedStore}`
        },
        (payload) => {
          console.log('💰 Nova movimentação detectada:', payload);
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStore, startDate, endDate]);

  useEffect(() => {
    let filtered = [...entries];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.tipo === typeFilter);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.descricao.toLowerCase().includes(searchLower) ||
        entry.criado_por.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEntries(filtered);
  }, [entries, typeFilter, searchTerm]);

  const totalEntradas = filteredEntries
    .filter(e => ['sistema_entrada', 'receita', 'transferencia_entrada'].includes(e.tipo))
    .reduce((sum, e) => sum + Number(e.valor), 0);

  const totalSaidas = filteredEntries
    .filter(e => ['despesa', 'gasto_fixo', 'transferencia_saida'].includes(e.tipo))
    .reduce((sum, e) => sum + Number(e.valor), 0);

  const saldo = totalEntradas - totalSaidas;

  const totalByPaymentMethod = filteredEntries
    .filter(e => ['sistema_entrada', 'receita'].includes(e.tipo))
    .reduce((acc, entry) => {
      const valor = Number(entry.valor);

      if (entry.forma_pagamento === 'misto' && entry.metadata_pagamento?.formas) {
        entry.metadata_pagamento.formas.forEach((forma: any) => {
          const method = forma.metodo;
          acc[method] = (acc[method] || 0) + Number(forma.valor);
        });
      } else if (entry.forma_pagamento) {
        const method = entry.forma_pagamento;
        acc[method] = (acc[method] || 0) + valor;
      }

      return acc;
    }, {} as Record<string, number>);

  const totalDinheiro = totalByPaymentMethod['dinheiro'] || 0;
  const totalPix = totalByPaymentMethod['pix'] || 0;
  const totalDebito = totalByPaymentMethod['cartao_debito'] || 0;
  const totalCredito = totalByPaymentMethod['cartao_credito'] || 0;
  const totalVoucher = totalByPaymentMethod['voucher'] || 0;
  const totalVendas = totalDinheiro + totalPix + totalDebito + totalCredito + totalVoucher;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Criado Por', 'Registrado Em'];
    const rows = filteredEntries.map(entry => [
      formatDate(entry.data),
      getTypeLabel(entry.tipo).label,
      entry.descricao,
      formatPrice(Number(entry.valor)),
      entry.criado_por,
      formatDateTime(entry.criado_em)
    ]);

    const csvContent = [
      ['Histórico de Movimentações - Elite Açaí'],
      ['Período', `${formatDate(startDate)} a ${formatDate(endDate)}`],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      [''],
      headers,
      ...rows
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-movimentacoes-${startDate}-${endDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Histórico de Movimentações</h2>
          <p className="text-gray-600">Vendas em PIX, Cartão Crédito, Débito e Dinheiro</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Printer size={16} />
            Imprimir
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os tipos</option>
              <option value="sistema_entrada">Vendas Sistema</option>
              <option value="receita">Receitas</option>
              <option value="transferencia_entrada">Transferências Entrada</option>
              <option value="transferencia_saida">Transferências Saída</option>
              <option value="despesa">Despesas</option>
              <option value="gasto_fixo">Gastos Fixos</option>
              <option value="saldo_inicial">Saldo Inicial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por PIX, Cartão..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={loadEntries}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(totalEntradas)}
              </p>
              <p className="text-xs text-gray-500">
                {filteredEntries.filter(e => ['sistema_entrada', 'receita', 'transferencia_entrada'].includes(e.tipo)).length} movimentações
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Saídas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(totalSaidas)}
              </p>
              <p className="text-xs text-gray-500">
                {filteredEntries.filter(e => ['despesa', 'gasto_fixo', 'transferencia_saida'].includes(e.tipo)).length} movimentações
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Período</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(saldo)}
              </p>
              <p className="text-xs text-gray-500">
                {filteredEntries.length} movimentações totais
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas por Forma de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-700 mb-1">Dinheiro</p>
            <p className="text-xl font-bold text-green-800">
              {formatPrice(totalDinheiro)}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-700 mb-1">PIX</p>
            <p className="text-xl font-bold text-blue-800">
              {formatPrice(totalPix)}
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-indigo-700 mb-1">Débito</p>
            <p className="text-xl font-bold text-indigo-800">
              {formatPrice(totalDebito)}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-700 mb-1">Crédito</p>
            <p className="text-xl font-bold text-purple-800">
              {formatPrice(totalCredito)}
            </p>
          </div>

          <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">Total de Vendas</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(totalVendas)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Movimentações ({filteredEntries.length})
          </h3>
          <p className="text-gray-600 text-sm">
            Período: {formatDate(startDate)} a {formatDate(endDate)}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando movimentações...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p>Nenhuma movimentação encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo / Pagamento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Registrado Em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  const typeInfo = getTypeLabel(entry.tipo);
                  const isIncome = ['sistema_entrada', 'receita', 'transferencia_entrada'].includes(entry.tipo);
                  const paymentMethod = getPaymentMethodDisplay(entry.forma_pagamento);

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 whitespace-nowrap">
                        {formatDate(entry.data)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color} w-fit`}>
                            {typeInfo.label}
                          </span>
                          {paymentMethod && (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${paymentMethod.color} w-fit`}>
                              {paymentMethod.method}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          <div>{entry.descricao}</div>
                          {entry.forma_pagamento === 'misto' && entry.metadata_pagamento?.formas && (
                            <div className="mt-1 text-xs text-gray-600">
                              {entry.metadata_pagamento.formas.map((forma: any, idx: number) => {
                                const methodNames: { [key: string]: string } = {
                                  'dinheiro': 'Dinheiro',
                                  'cartao_credito': 'Cartão Crédito',
                                  'cartao_debito': 'Cartão Débito',
                                  'pix': 'PIX',
                                  'voucher': 'Voucher'
                                };
                                return (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span className="text-gray-500">•</span>
                                    <span>{methodNames[forma.metodo] || forma.metodo}: {formatPrice(forma.valor)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{formatPrice(Number(entry.valor))}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-500">{formatDateTime(entry.criado_em)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
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
            font-size: 10px;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 4px;
            text-align: left;
          }

          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  );
};

export default CashFlowHistory;
