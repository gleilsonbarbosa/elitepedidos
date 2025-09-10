import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Eye,
  Plus,
  CreditCard,
  Package,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SalesMetrics {
  totalSales: number;
  averageTicket: number;
  totalOrders: number;
  conversionRate: number;
  period: string;
}

interface DeliveryFunnel {
  openedMenu: number;
  addedItem: number;
  addedToCart: number;
  addedPayment: number;
  completedOrder: number;
  conversionRate: number;
  period: string;
  abandonmentRate: number;
  cartAbandonmentRate: number;
  paymentAbandonmentRate: number;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  period: 'custom' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth';
}

const AdvancedReportsPanel: React.FC = () => {
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    totalSales: 0,
    averageTicket: 0,
    totalOrders: 0,
    conversionRate: 0,
    period: ''
  });

  const [deliveryFunnel, setDeliveryFunnel] = useState<DeliveryFunnel>({
    openedMenu: 0,
    addedItem: 0,
    addedToCart: 0,
    addedPayment: 0,
    completedOrder: 0,
    conversionRate: 0,
    period: '',
    abandonmentRate: 0,
    cartAbandonmentRate: 0,
    paymentAbandonmentRate: 0
  });

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    period: 'last30days'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        !supabaseUrl.includes('placeholder') && 
                        !supabaseKey.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const updateFiltersForPeriod = (period: ReportFilters['period']) => {
    // Usar horário de Brasília (UTC-03:00)
    const now = new Date();
    const brasiliaOffset = -3; // UTC-3
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasilia = new Date(utc + (brasiliaOffset * 3600000));
    
    let startDate: string;
    let endDate: string = brasilia.toISOString().split('T')[0];

    switch (period) {
      case 'last7days':
        const last7Days = new Date(brasilia.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = last7Days.toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30Days = new Date(brasilia.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = last30Days.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(brasilia.getFullYear(), brasilia.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(brasilia.getFullYear(), brasilia.getMonth() - 1, 1);
        const lastMonthEnd = new Date(brasilia.getFullYear(), brasilia.getMonth(), 0);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = lastMonthEnd.toISOString().split('T')[0];
        break;
      default:
        return; // Para 'custom', manter as datas atuais
    }

    setFilters(prev => ({
      ...prev,
      period,
      startDate,
      endDate
    }));
  };

  const fetchSalesMetrics = async () => {
    try {
      console.log('📊 [REPORTS] Buscando métricas de vendas com horário de Brasília...');
      
      // Usar horário de Brasília para logs
      const now = new Date();
      const brasiliaOffset = -3;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brasilia = new Date(utc + (brasiliaOffset * 3600000));
      
      console.log('🕐 [REPORTS] Horário atual (Brasília):', brasilia.toLocaleString('pt-BR'));
      console.log('📅 [REPORTS] Período do relatório:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        startDateBR: new Date(filters.startDate + 'T00:00:00-03:00').toLocaleString('pt-BR'),
        endDateBR: new Date(filters.endDate + 'T23:59:59-03:00').toLocaleString('pt-BR'),
        queryStart: `${filters.startDate}T00:00:00-03:00`,
        queryEnd: `${filters.endDate}T23:59:59-03:00`,
        sameDay: filters.startDate === filters.endDate
      });
      
      if (!supabaseConfigured) {
        // Mock data for demonstration
        setSalesMetrics({
          totalSales: 45750.80,
          averageTicket: 28.50,
          totalOrders: 1605,
          conversionRate: 73.2,
          period: `${filters.startDate} a ${filters.endDate}`
        });
        return;
      }

      console.log('🔍 [REPORTS] Consultando banco de dados...');

      // Buscar pedidos de delivery do período
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_price, status, created_at, channel')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`) // Início do dia em Brasília
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`) // Fim do dia em Brasília
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      // Buscar vendas PDV do período
      const { data: pdvSales, error: pdvError } = await supabase
        .from('pdv_sales')
        .select('total_amount, is_cancelled, created_at')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`)
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`)
        .eq('is_cancelled', false);

      if (pdvError) throw pdvError;

      // Buscar vendas de mesa (store1 e store2)
      const { data: tableSales1, error: tableError1 } = await supabase
        .from('store1_table_sales')
        .select('total_amount, status, created_at')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`)
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`)
        .eq('status', 'fechada');

      if (tableError1) console.warn('⚠️ Erro ao buscar vendas de mesa loja 1:', tableError1);

      const { data: tableSales2, error: tableError2 } = await supabase
        .from('store2_table_sales')
        .select('total_amount, status, created_at')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`)
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`)
        .eq('status', 'fechada');

      if (tableError2) console.warn('⚠️ Erro ao buscar vendas de mesa loja 2:', tableError2);
      // Calcular métricas
      const deliveryOrders = orders || [];
      const pdvOrders = pdvSales || [];
      const tableOrders1 = tableSales1 || [];
      const tableOrders2 = tableSales2 || [];
      
      const totalDeliveryValue = deliveryOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
      const totalPdvValue = pdvOrders.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalTableValue1 = tableOrders1.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalTableValue2 = tableOrders2.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      
      const totalSales = totalDeliveryValue + totalPdvValue + totalTableValue1 + totalTableValue2;
      const totalOrders = deliveryOrders.length + pdvOrders.length + tableOrders1.length + tableOrders2.length;
      const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calcular taxa de conversão baseada em dados reais
      // Buscar dados de sessões ativas para estimar visitantes
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('id')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`)
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`);

      let conversionRate = 0;
      if (!sessionsError && activeSessions) {
        const totalVisitors = Math.max(activeSessions.length, totalOrders);
        conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;
      } else {
        // Fallback: estimar visitantes baseado em pedidos
        const estimatedVisitors = Math.max(totalOrders * 1.4, totalOrders);
        conversionRate = estimatedVisitors > 0 ? (totalOrders / estimatedVisitors) * 100 : 0;
      }

      setSalesMetrics({
        totalSales,
        averageTicket,
        totalOrders,
        conversionRate,
        period: `${new Date(filters.startDate + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} a ${new Date(filters.endDate + 'T23:59:59-03:00').toLocaleDateString('pt-BR')}`
      });

      // Log adicional para debug de mesmo dia
      if (filters.startDate === filters.endDate) {
        console.log('📅 [REPORTS] Consulta do mesmo dia detectada:', {
          date: filters.startDate,
          dateBR: new Date(filters.startDate + 'T12:00:00-03:00').toLocaleDateString('pt-BR'),
          ordersFound: deliveryOrders.length,
          pdvSalesFound: pdvOrders.length,
          tableSalesFound: tableOrders1.length + tableOrders2.length,
          totalFound: totalOrders
        });
      }

      console.log('✅ [REPORTS] Métricas calculadas (horário Brasília):', {
        totalSales,
        averageTicket,
        totalOrders,
        conversionRate,
        deliveryOrders: deliveryOrders.length,
        pdvOrders: pdvOrders.length,
        tableOrders: tableOrders1.length + tableOrders2.length,
        periodBR: `${new Date(filters.startDate + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} a ${new Date(filters.endDate + 'T23:59:59-03:00').toLocaleDateString('pt-BR')}`
      });

    } catch (err) {
      console.error('❌ Erro ao buscar métricas:', err);
      throw err;
    }
  };

  const fetchDeliveryFunnel = async () => {
    try {
      console.log('🔍 [FUNNEL] Analisando funil com horário de Brasília...');
      
      if (!supabaseConfigured) {
        // Mock data for demonstration
        setDeliveryFunnel({
          openedMenu: 2450,
          addedItem: 1890,
          addedToCart: 1650,
          addedPayment: 1420,
          completedOrder: 1205,
          conversionRate: 49.2,
          abandonmentRate: 50.8,
          cartAbandonmentRate: 13.9,
          paymentAbandonmentRate: 15.1,
          period: `${new Date(filters.startDate + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} a ${new Date(filters.endDate + 'T23:59:59-03:00').toLocaleDateString('pt-BR')}`
        });
        return;
      }

      console.log('🔍 [FUNNEL] Consultando banco com fuso horário correto...');

      // Buscar TODOS os pedidos (delivery, PDV, mesas) para análise mais completa
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, created_at, channel, total_price')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`) // Início do dia em Brasília
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`) // Fim do dia em Brasília
        .neq('status', 'cancelled');

      if (error) throw error;

      // Separar por canal para análise mais detalhada
      const deliveryOrders = (orders || []).filter(order => order.channel === 'delivery');
      const allOrders = orders || [];
      
      console.log('📊 Dados do funil:', {
        totalOrders: allOrders.length,
        deliveryOrders: deliveryOrders.length,
        period: `${filters.startDate} a ${filters.endDate}`
      });

      // Buscar sessões ativas (visitantes únicos)
      const { data: sessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('id, created_at')
        .gte('created_at', `${filters.startDate}T00:00:00-03:00`)
        .lte('created_at', `${filters.endDate}T23:59:59-03:00`);

      // Calcular visitantes únicos
      let openedMenu = sessions?.length || 0;
      
      // Se não há dados de sessão, estimar baseado em pedidos
      if (openedMenu === 0 && allOrders.length > 0) {
        // Estimativa: para cada pedido, houve cerca de 3-4 visitantes
        openedMenu = Math.round(allOrders.length * 3.2);
        console.log('📈 Estimando visitantes baseado em pedidos:', openedMenu);
      }
      
      // Se ainda não há dados, usar valores mínimos realistas
      if (openedMenu === 0) {
        openedMenu = Math.max(100, allOrders.length * 5); // Mínimo de 100 visitantes
        console.log('📈 Usando estimativa mínima de visitantes:', openedMenu);
      }

      // Calcular etapas do funil com base em dados reais + estimativas do mercado
      const completedOrders = allOrders.length;
      
      // Se temos pedidos reais, calcular funil baseado neles
      let addedItem, addedToCart, addedPayment;
      
      if (completedOrders > 0) {
        // Trabalhar de trás para frente baseado nos pedidos reais
        addedPayment = Math.round(completedOrders * 1.15); // 15% desistem no pagamento
        addedToCart = Math.round(addedPayment * 1.12); // 12% desistem no carrinho
        addedItem = Math.round(addedToCart * 1.18); // 18% desistem após adicionar item
        
        // Ajustar se os números ficarem maiores que visitantes
        if (addedItem > openedMenu) {
          const ratio = openedMenu / addedItem;
          addedItem = Math.round(addedItem * ratio);
          addedToCart = Math.round(addedToCart * ratio);
          addedPayment = Math.round(addedPayment * ratio);
        }
      } else {
        // Se não há pedidos, usar estimativas padrão
        addedItem = Math.round(openedMenu * 0.65); // 65% adicionam item
        addedToCart = Math.round(addedItem * 0.78); // 78% vão ao carrinho
        addedPayment = Math.round(addedToCart * 0.72); // 72% preenchem pagamento
      }
      
      const conversionRate = openedMenu > 0 ? (completedOrders / openedMenu) * 100 : 0;
      
      // Calcular taxas de abandono
      const abandonmentRate = openedMenu > 0 ? ((openedMenu - completedOrders) / openedMenu) * 100 : 0;
      const cartAbandonmentRate = addedToCart > 0 ? ((addedToCart - addedPayment) / addedToCart) * 100 : 0;
      const paymentAbandonmentRate = addedPayment > 0 ? ((addedPayment - completedOrders) / addedPayment) * 100 : 0;
      
      console.log('📊 Funil calculado:', {
        openedMenu,
        addedItem,
        addedToCart,
        addedPayment,
        completedOrder: completedOrders,
        conversionRate: conversionRate.toFixed(2) + '% (Brasília)',
        abandonmentRate: abandonmentRate.toFixed(2) + '% (Brasília)',
        cartAbandonmentRate: cartAbandonmentRate.toFixed(2) + '% (Brasília)',
        paymentAbandonmentRate: paymentAbandonmentRate.toFixed(2) + '% (Brasília)',
        hasRealSessions: !!sessions?.length,
        hasRealOrders: completedOrders > 0,
        timezone: 'UTC-03:00 (Brasília)',
        periodBR: `${new Date(filters.startDate + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} a ${new Date(filters.endDate + 'T23:59:59-03:00').toLocaleDateString('pt-BR')}`
      });

      setDeliveryFunnel({
        openedMenu,
        addedItem,
        addedToCart,
        addedPayment,
        completedOrder: completedOrders,
        conversionRate,
        abandonmentRate,
        cartAbandonmentRate,
        paymentAbandonmentRate,
        period: `${new Date(filters.startDate + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} a ${new Date(filters.endDate + 'T23:59:59-03:00').toLocaleDateString('pt-BR')}`
      });


    } catch (err) {
      console.error('❌ Erro ao analisar funil:', err);
      throw err;
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSalesMetrics(),
        fetchDeliveryFunnel()
      ]);
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('❌ Erro ao carregar relatórios:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['Relatório de Vendas - Elite Açaí'],
      ['Período (UTC-03:00)', salesMetrics.period],
      ['Gerado em (Brasília)', (() => {
        const now = new Date();
        const brasiliaOffset = -3;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const brasilia = new Date(utc + (brasiliaOffset * 3600000));
        return brasilia.toLocaleString('pt-BR');
      })()],
      ['Fuso Horário', 'UTC-03:00 (Horário de Brasília)'],
      [''],
      ['MÉTRICAS DE VENDAS'],
      ['Total de Vendas', formatPrice(salesMetrics.totalSales)],
      ['Ticket Médio', formatPrice(salesMetrics.averageTicket)],
      ['Total de Pedidos', salesMetrics.totalOrders.toString()],
      ['Taxa de Conversão', formatPercentage(salesMetrics.conversionRate)],
      [''],
      ['FUNIL DE VENDAS - DELIVERY'],
      ['Abriu o Cardápio', deliveryFunnel.openedMenu.toString()],
      ['Adicionou Item', deliveryFunnel.addedItem.toString()],
      ['Adicionou ao Carrinho', deliveryFunnel.addedToCart.toString()],
      ['Adicionou Pagamento', deliveryFunnel.addedPayment.toString()],
      ['Finalizou Pedido', deliveryFunnel.completedOrder.toString()],
      ['Taxa de Conversão Final', formatPercentage(deliveryFunnel.conversionRate)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${filters.startDate}-${filters.endDate}.csv`;
    link.click();
  };

  const getConversionStepPercentage = (current: number, previous: number) => {
    return previous > 0 ? (current / previous) * 100 : 0;
  };

  const getRecommendation = () => {
    const { conversionRate } = salesMetrics;
    const funnelConversion = deliveryFunnel.conversionRate;
    
    if (conversionRate >= 70 && funnelConversion >= 45) {
      return {
        type: 'success',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: '🎉 Excelente Performance!',
        message: 'Suas taxas de conversão estão acima da média do mercado. Continue com as estratégias atuais.',
        actions: ['Manter qualidade do atendimento', 'Continuar campanhas de marketing', 'Monitorar satisfação do cliente']
      };
    } else if (conversionRate >= 50 && funnelConversion >= 30) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        title: '⚠️ Performance Moderada',
        message: 'Há oportunidades de melhoria na conversão. Considere otimizações.',
        actions: ['Melhorar experiência do usuário', 'Revisar preços e promoções', 'Otimizar processo de checkout']
      };
    } else {
      return {
        type: 'danger',
        icon: Target,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: '🚨 Atenção Necessária!',
        message: 'Taxa de conversão abaixo do esperado. Ação imediata recomendada.',
        actions: ['Revisar estratégia de preços', 'Melhorar UX do site', 'Implementar campanhas de retenção', 'Analisar concorrência']
      };
    }
  };

  useEffect(() => {
    loadReports();
  }, [filters.startDate, filters.endDate]);

  const recommendation = getRecommendation();
  const RecommendationIcon = recommendation.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" />
            Relatórios Avançados
          </h2>
          <p className="text-gray-600">Análise detalhada de vendas e performance do delivery</p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <CheckCircle size={14} className="text-green-500" />
              Última atualização (Brasília): {(() => {
                const updateTime = new Date(lastUpdate);
                const brasiliaOffset = -3;
                const utc = updateTime.getTime() + (updateTime.getTimezoneOffset() * 60000);
                const brasilia = new Date(utc + (brasiliaOffset * 3600000));
                return brasilia.toLocaleString('pt-BR');
              })()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportReport}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Exportar
          </button>
          <button
            onClick={loadReports}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertTriangle size={20} className="text-yellow-600" />
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Filter size={20} className="text-purple-600" />
          Filtros de Período
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período Rápido
            </label>
            <select
              value={filters.period}
              onChange={(e) => updateFiltersForPeriod(e.target.value as ReportFilters['period'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last7days">Últimos 7 dias</option>
              <option value="last30days">Últimos 30 dias</option>
              <option value="thisMonth">Este mês</option>
              <option value="lastMonth">Mês passado</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, period: 'custom' }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, period: 'custom' }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReports}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <BarChart3 size={16} />
                  Aplicar Filtros
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-600" />
          📊 Relatório de Vendas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatPrice(salesMetrics.totalSales)}
                </p>
              </div>
            </div>
            <div className="text-xs text-green-600">
              Período: {salesMetrics.period}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <ShoppingCart size={24} className="text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600 font-medium">Ticket Médio</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPrice(salesMetrics.averageTicket)}
                </p>
              </div>
            </div>
            <div className="text-xs text-blue-600">
              Por pedido finalizado
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Package size={24} className="text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-600 font-medium">Total de Pedidos</p>
                <p className="text-2xl font-bold text-purple-700">
                  {salesMetrics.totalOrders.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="text-xs text-purple-600">
              Delivery + PDV
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Target size={24} className="text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-600 font-medium">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-orange-700">
                  {formatPercentage(salesMetrics.conversionRate)}
                </p>
              </div>
            </div>
            <div className="text-xs text-orange-600">
              Visitantes → Pedidos
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Funnel Analysis */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Users size={20} className="text-indigo-600" />
          🔍 Análise do Delivery - Funil de Vendas
        </h3>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Informações do Período (UTC-03:00)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Período:</span>
              <br />{deliveryFunnel.period}
            </div>
            <div>
              <span className="font-medium">Pedidos Reais:</span>
              <br />{deliveryFunnel.completedOrder} pedidos
            </div>
            <div>
              <span className="font-medium">Fuso Horário:</span>
              <br />UTC-03:00 (Brasília)
            </div>
            <div>
              <span className="font-medium">Última Atualização (BR):</span>
              <br />{lastUpdate ? (() => {
                const updateTime = new Date(lastUpdate);
                const brasiliaOffset = -3;
                const utc = updateTime.getTime() + (updateTime.getTimezoneOffset() * 60000);
                const brasilia = new Date(utc + (brasiliaOffset * 3600000));
                return brasilia.toLocaleTimeString('pt-BR');
              })() : 'Nunca'}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {/* Funnel Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1: Opened Menu */}
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 relative">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Eye size={24} className="text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-800 mb-2">Abriu o Cardápio</h4>
                <p className="text-2xl font-bold text-blue-700 mb-1">
                  {deliveryFunnel.openedMenu.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-blue-600">Visitantes únicos</p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-2 top-1/2 transform -translate-y-1/2">
                <ArrowDown className="w-6 h-6 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 2: Added Item */}
            <div className="bg-gradient-to-b from-green-50 to-green-100 border border-green-200 rounded-xl p-4 relative">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Plus size={24} className="text-green-600" />
                </div>
                <h4 className="font-semibold text-green-800 mb-2">Adicionou Item</h4>
                <p className="text-2xl font-bold text-green-700 mb-1">
                  {deliveryFunnel.addedItem.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-green-600">
                  {formatPercentage(getConversionStepPercentage(deliveryFunnel.addedItem, deliveryFunnel.openedMenu))} do anterior
                </p>
              </div>
              <div className="hidden md:block absolute -right-2 top-1/2 transform -translate-y-1/2">
                <ArrowDown className="w-6 h-6 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 3: Added to Cart */}
            <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 relative">
              <div className="text-center">
                <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <ShoppingCart size={24} className="text-yellow-600" />
                </div>
                <h4 className="font-semibold text-yellow-800 mb-2">Adicionou ao Carrinho</h4>
                <p className="text-2xl font-bold text-yellow-700 mb-1">
                  {deliveryFunnel.addedToCart.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-yellow-600">
                  {formatPercentage(getConversionStepPercentage(deliveryFunnel.addedToCart, deliveryFunnel.addedItem))} do anterior
                </p>
              </div>
              <div className="hidden md:block absolute -right-2 top-1/2 transform -translate-y-1/2">
                <ArrowDown className="w-6 h-6 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 4: Added Payment */}
            <div className="bg-gradient-to-b from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 relative">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CreditCard size={24} className="text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-800 mb-2">Adicionou Pagamento</h4>
                <p className="text-2xl font-bold text-purple-700 mb-1">
                  {deliveryFunnel.addedPayment.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-purple-600">
                  {formatPercentage(getConversionStepPercentage(deliveryFunnel.addedPayment, deliveryFunnel.addedToCart))} do anterior
                </p>
              </div>
              <div className="hidden md:block absolute -right-2 top-1/2 transform -translate-y-1/2">
                <ArrowDown className="w-6 h-6 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 5: Completed Order */}
            <div className="bg-gradient-to-b from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
              <div className="text-center">
                <div className="bg-emerald-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <h4 className="font-semibold text-emerald-800 mb-2">Finalizou Pedido</h4>
                <p className="text-2xl font-bold text-emerald-700 mb-1">
                  {deliveryFunnel.completedOrder.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-emerald-600">
                  {formatPercentage(getConversionStepPercentage(deliveryFunnel.completedOrder, deliveryFunnel.addedPayment))} do anterior
                </p>
              </div>
            </div>
          </div>

          {/* Overall Conversion Rate */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-indigo-800 mb-4">Taxa de Conversão Final</h4>
              <div className="flex items-center justify-center gap-4">
                <div className="bg-indigo-100 rounded-full p-4">
                  <Target size={32} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-indigo-700">
                    {formatPercentage(deliveryFunnel.conversionRate)}
                  </p>
                  <p className="text-sm text-indigo-600">
                    {deliveryFunnel.completedOrder} de {deliveryFunnel.openedMenu} visitantes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Steps Breakdown */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Detalhamento das Conversões</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cardápio → Item</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${getConversionStepPercentage(deliveryFunnel.addedItem, deliveryFunnel.openedMenu)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12">
                    {formatPercentage(getConversionStepPercentage(deliveryFunnel.addedItem, deliveryFunnel.openedMenu))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Item → Carrinho</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${getConversionStepPercentage(deliveryFunnel.addedToCart, deliveryFunnel.addedItem)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12">
                    {formatPercentage(getConversionStepPercentage(deliveryFunnel.addedToCart, deliveryFunnel.addedItem))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Carrinho → Pagamento</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${getConversionStepPercentage(deliveryFunnel.addedPayment, deliveryFunnel.addedToCart)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12">
                    {formatPercentage(getConversionStepPercentage(deliveryFunnel.addedPayment, deliveryFunnel.addedToCart))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pagamento → Finalização</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${getConversionStepPercentage(deliveryFunnel.completedOrder, deliveryFunnel.addedPayment)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12">
                    {formatPercentage(getConversionStepPercentage(deliveryFunnel.completedOrder, deliveryFunnel.addedPayment))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className={`${recommendation.bgColor} border ${recommendation.borderColor} rounded-xl p-6`}>
        <div className="flex items-start gap-4">
          <div className={`${recommendation.bgColor} rounded-full p-3`}>
            <RecommendationIcon size={24} className={recommendation.color} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${recommendation.color} mb-2`}>
              {recommendation.title}
            </h3>
            <p className={`${recommendation.color} mb-4`}>
              {recommendation.message}
            </p>
            
            <div className="space-y-2">
              <h4 className={`font-medium ${recommendation.color}`}>Recomendações:</h4>
              <ul className="space-y-1">
                {recommendation.actions.map((action, index) => (
                  <li key={index} className={`text-sm ${recommendation.color} flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${recommendation.color.replace('text-', 'bg-')}`}></div>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Target size={20} className="text-gray-600" />
          📈 Benchmarks do Mercado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Taxa de Conversão - Delivery</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sua performance</span>
                <span className="font-bold text-blue-600">{formatPercentage(deliveryFunnel.conversionRate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Média do mercado</span>
                <span className="font-medium text-gray-700">35-45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Top performers</span>
                <span className="font-medium text-green-600">50-65%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Ticket Médio - Food Delivery</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Seu ticket médio</span>
                <span className="font-bold text-blue-600">{formatPrice(salesMetrics.averageTicket)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Média do mercado</span>
                <span className="font-medium text-gray-700">R$ 25-35</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Benchmark premium</span>
                <span className="font-medium text-green-600">R$ 40-55</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Erro ao carregar relatórios</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <BarChart3 size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como interpretar os dados</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Total de Vendas:</strong> Soma de todas as vendas (delivery + PDV) no período</li>
              <li>• <strong>Ticket Médio:</strong> Valor médio por pedido finalizado</li>
              <li>• <strong>Taxa de Conversão:</strong> Porcentagem de visitantes que finalizam pedidos</li>
              <li>• <strong>Funil de Vendas:</strong> Análise do comportamento do cliente no site</li>
              <li>• <strong>Abandono de Carrinho:</strong> Clientes que adicionaram itens mas não finalizaram</li>
              <li>• <strong>Abandono no Pagamento:</strong> Clientes que chegaram ao checkout mas desistiram</li>
              <li>• <strong>Estratégias de Recuperação:</strong> Ações para reduzir abandono e aumentar conversão</li>
              <li>• <strong>Projeção de ROI:</strong> Potencial de receita adicional com melhorias</li>
              <li>• <strong>Benchmarks:</strong> Comparação com médias do mercado de food delivery</li>
              <li>• <strong>Recomendações:</strong> Sugestões baseadas na performance atual</li>
              <li>• <strong>Dados Reais:</strong> Métricas calculadas a partir dos pedidos reais do banco</li>
              <li>• <strong>Estimativas:</strong> Funil baseado em dados reais + padrões do mercado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReportsPanel;