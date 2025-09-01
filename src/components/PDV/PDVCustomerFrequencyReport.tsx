import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
  Search,
  Star,
  Award,
  UserX,
  Phone,
  DollarSign,
  Package,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface CustomerFrequencyData {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  first_order_date: string;
  last_order_date: string;
  days_since_last_order: number;
  orders_this_week: number;
  orders_this_month: number;
  orders_last_month: number;
  frequency_score: number;
  customer_segment: 'loyal' | 'occasional' | 'inactive' | 'new';
  preferred_payment_method: string;
  favorite_products: string[];
}

interface FrequencyStats {
  total_customers: number;
  loyal_customers: number;
  occasional_customers: number;
  inactive_customers: number;
  new_customers: number;
  average_frequency: number;
  total_revenue: number;
  average_customer_value: number;
}

const PDVCustomerFrequencyReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [customers, setCustomers] = useState<CustomerFrequencyData[]>([]);
  const [stats, setStats] = useState<FrequencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'loyal' | 'occasional' | 'inactive' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'frequency' | 'value' | 'recent' | 'name'>('frequency');
  const [dateRange, setDateRange] = useState({
    start: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 3); // Last 3 months
      return date.toISOString().split('T')[0];
    })(),
    end: new Date().toISOString().split('T')[0]
  });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'loyal': return 'bg-green-100 text-green-800 border-green-200';
      case 'occasional': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'new': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSegmentLabel = (segment: string) => {
    switch (segment) {
      case 'loyal': return 'Fiel';
      case 'occasional': return 'Ocasional';
      case 'inactive': return 'Inativo';
      case 'new': return 'Novo';
      default: return segment;
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'loyal': return <Star size={16} className="text-green-600" />;
      case 'occasional': return <User size={16} className="text-blue-600" />;
      case 'inactive': return <UserX size={16} className="text-red-600" />;
      case 'new': return <Award size={16} className="text-purple-600" />;
      default: return <User size={16} className="text-gray-600" />;
    }
  };

  const calculateCustomerSegment = (
    totalOrders: number, 
    daysSinceLastOrder: number, 
    ordersThisMonth: number,
    firstOrderDate: string
  ): 'loyal' | 'occasional' | 'inactive' | 'new' => {
    const daysSinceFirstOrder = Math.floor(
      (new Date().getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // New customer (first order within 30 days)
    if (daysSinceFirstOrder <= 30) {
      return 'new';
    }

    // Inactive customer (no orders in 60+ days)
    if (daysSinceLastOrder > 60) {
      return 'inactive';
    }

    // Loyal customer (4+ orders this month OR 10+ total orders with recent activity)
    if (ordersThisMonth >= 4 || (totalOrders >= 10 && daysSinceLastOrder <= 14)) {
      return 'loyal';
    }

    // Occasional customer (everything else)
    return 'occasional';
  };

  const loadCustomerFrequencyReport = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabaseConfigured) {
        // Mock data for demonstration
        const mockCustomers: CustomerFrequencyData[] = [
          {
            customer_id: '1',
            customer_name: 'Maria Silva',
            customer_phone: '(85) 99999-1111',
            total_orders: 15,
            total_spent: 450.75,
            average_order_value: 30.05,
            first_order_date: '2024-10-01',
            last_order_date: '2025-01-15',
            days_since_last_order: 2,
            orders_this_week: 2,
            orders_this_month: 6,
            orders_last_month: 4,
            frequency_score: 8.5,
            customer_segment: 'loyal',
            preferred_payment_method: 'pix',
            favorite_products: ['Açaí 500ml', 'Combo Casal']
          },
          {
            customer_id: '2',
            customer_name: 'João Santos',
            customer_phone: '(85) 99999-2222',
            total_orders: 5,
            total_spent: 125.50,
            average_order_value: 25.10,
            first_order_date: '2024-12-01',
            last_order_date: '2025-01-10',
            days_since_last_order: 7,
            orders_this_week: 0,
            orders_this_month: 2,
            orders_last_month: 2,
            frequency_score: 5.2,
            customer_segment: 'occasional',
            preferred_payment_method: 'dinheiro',
            favorite_products: ['Açaí 300ml']
          },
          {
            customer_id: '3',
            customer_name: 'Ana Costa',
            customer_phone: '(85) 99999-3333',
            total_orders: 2,
            total_spent: 45.98,
            average_order_value: 22.99,
            first_order_date: '2024-11-15',
            last_order_date: '2024-11-20',
            days_since_last_order: 58,
            orders_this_week: 0,
            orders_this_month: 0,
            orders_last_month: 0,
            frequency_score: 1.5,
            customer_segment: 'inactive',
            preferred_payment_method: 'cartao',
            favorite_products: ['Açaí 400ml']
          }
        ];

        const mockStats: FrequencyStats = {
          total_customers: 3,
          loyal_customers: 1,
          occasional_customers: 1,
          inactive_customers: 1,
          new_customers: 0,
          average_frequency: 5.07,
          total_revenue: 621.23,
          average_customer_value: 207.08
        };

        setCustomers(mockCustomers);
        setStats(mockStats);
        setLoading(false);
        return;
      }

      console.log('📊 Carregando relatório de frequência de clientes...');

      // Get all customers with their order data
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          created_at
        `)
        .order('name');

      if (customersError) {
        console.error('❌ Erro ao buscar clientes:', customersError);
        throw customersError;
      }

      console.log(`✅ ${customersData?.length || 0} clientes encontrados`);

      if (!customersData || customersData.length === 0) {
        setCustomers([]);
        setStats({
          total_customers: 0,
          loyal_customers: 0,
          occasional_customers: 0,
          inactive_customers: 0,
          new_customers: 0,
          average_frequency: 0,
          total_revenue: 0,
          average_customer_value: 0
        });
        setLoading(false);
        return;
      }

      // Process each customer's data
      const processedCustomers = await Promise.all(
        customersData.map(async (customer) => {
          try {
            // Get all orders for this customer
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('total_price, payment_method, created_at, items')
              .eq('customer_id', customer.id)
              .gte('created_at', `${dateRange.start}T00:00:00`)
              .lte('created_at', `${dateRange.end}T23:59:59`)
              .neq('status', 'cancelled')
              .order('created_at', { ascending: false });

            if (ordersError) {
              console.warn(`⚠️ Erro ao buscar pedidos para cliente ${customer.id}:`, ordersError);
              return null;
            }

            const orders = ordersData || [];
            
            if (orders.length === 0) {
              return null; // Skip customers with no orders in the period
            }

            // Calculate metrics
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + order.total_price, 0);
            const averageOrderValue = totalSpent / totalOrders;
            
            const firstOrderDate = orders[orders.length - 1]?.created_at || customer.created_at;
            const lastOrderDate = orders[0]?.created_at || customer.created_at;
            
            const daysSinceLastOrder = Math.floor(
              (new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Calculate orders this week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const ordersThisWeek = orders.filter(order => 
              new Date(order.created_at) >= weekStart
            ).length;

            // Calculate orders this month
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            
            const ordersThisMonth = orders.filter(order => 
              new Date(order.created_at) >= monthStart
            ).length;

            // Calculate orders last month
            const lastMonthStart = new Date();
            lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
            lastMonthStart.setDate(1);
            lastMonthStart.setHours(0, 0, 0, 0);
            
            const lastMonthEnd = new Date();
            lastMonthEnd.setDate(0);
            lastMonthEnd.setHours(23, 59, 59, 999);
            
            const ordersLastMonth = orders.filter(order => {
              const orderDate = new Date(order.created_at);
              return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
            }).length;

            // Calculate frequency score (orders per month)
            const daysSinceFirstOrder = Math.floor(
              (new Date().getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            const monthsSinceFirstOrder = Math.max(1, daysSinceFirstOrder / 30);
            const frequencyScore = totalOrders / monthsSinceFirstOrder;

            // Determine customer segment
            const customerSegment = calculateCustomerSegment(
              totalOrders,
              daysSinceLastOrder,
              ordersThisMonth,
              firstOrderDate
            );

            // Get preferred payment method
            const paymentMethods = orders.reduce((acc, order) => {
              acc[order.payment_method] = (acc[order.payment_method] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const preferredPaymentMethod = Object.entries(paymentMethods)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

            // Get favorite products
            const productCounts = orders.reduce((acc, order) => {
              if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
                });
              }
              return acc;
            }, {} as Record<string, number>);
            
            const favoriteProducts = Object.entries(productCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([product]) => product);

            return {
              customer_id: customer.id,
              customer_name: customer.name || 'Cliente sem nome',
              customer_phone: customer.phone,
              total_orders: totalOrders,
              total_spent: totalSpent,
              average_order_value: averageOrderValue,
              first_order_date: firstOrderDate,
              last_order_date: lastOrderDate,
              days_since_last_order: daysSinceLastOrder,
              orders_this_week: ordersThisWeek,
              orders_this_month: ordersThisMonth,
              orders_last_month: ordersLastMonth,
              frequency_score: frequencyScore,
              customer_segment: customerSegment,
              preferred_payment_method: preferredPaymentMethod,
              favorite_products: favoriteProducts
            };
          } catch (err) {
            console.error(`❌ Erro ao processar cliente ${customer.id}:`, err);
            return null;
          }
        })
      );

      // Filter out null results and sort
      const validCustomers = processedCustomers.filter(Boolean) as CustomerFrequencyData[];
      
      // Calculate overall statistics
      const totalCustomers = validCustomers.length;
      const loyalCustomers = validCustomers.filter(c => c.customer_segment === 'loyal').length;
      const occasionalCustomers = validCustomers.filter(c => c.customer_segment === 'occasional').length;
      const inactiveCustomers = validCustomers.filter(c => c.customer_segment === 'inactive').length;
      const newCustomers = validCustomers.filter(c => c.customer_segment === 'new').length;
      const totalRevenue = validCustomers.reduce((sum, c) => sum + c.total_spent, 0);
      const averageFrequency = totalCustomers > 0 
        ? validCustomers.reduce((sum, c) => sum + c.frequency_score, 0) / totalCustomers 
        : 0;
      const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      setStats({
        total_customers: totalCustomers,
        loyal_customers: loyalCustomers,
        occasional_customers: occasionalCustomers,
        inactive_customers: inactiveCustomers,
        new_customers: newCustomers,
        average_frequency: averageFrequency,
        total_revenue: totalRevenue,
        average_customer_value: averageCustomerValue
      });

      setCustomers(validCustomers);
      console.log('✅ Relatório de frequência processado:', {
        totalCustomers,
        loyalCustomers,
        occasionalCustomers,
        inactiveCustomers,
        newCustomers
      });

    } catch (err) {
      console.error('❌ Erro ao carregar relatório de frequência:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCustomers = React.useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_phone.includes(searchTerm)
      );
    }

    // Apply segment filter
    if (segmentFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customer_segment === segmentFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency_score - a.frequency_score;
        case 'value':
          return b.total_spent - a.total_spent;
        case 'recent':
          return new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime();
        case 'name':
          return a.customer_name.localeCompare(b.customer_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, segmentFilter, sortBy]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (customers.length === 0) return;

    const csvContent = [
      ['Relatório de Frequência de Clientes - Elite Açaí'],
      ['Período', `${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      [''],
      ['Cliente', 'Telefone', 'Total Pedidos', 'Total Gasto', 'Ticket Médio', 'Pedidos Mês', 'Último Pedido', 'Dias Sem Comprar', 'Segmento', 'Frequência', 'Pagamento Preferido'],
      ...filteredAndSortedCustomers.map(customer => [
        customer.customer_name,
        customer.customer_phone,
        customer.total_orders.toString(),
        formatPrice(customer.total_spent),
        formatPrice(customer.average_order_value),
        customer.orders_this_month.toString(),
        formatDate(customer.last_order_date),
        customer.days_since_last_order.toString(),
        getSegmentLabel(customer.customer_segment),
        customer.frequency_score.toFixed(1),
        customer.preferred_payment_method
      ]),
      [''],
      ['Resumo'],
      ['Total de Clientes', stats?.total_customers.toString() || '0'],
      ['Clientes Fiéis', stats?.loyal_customers.toString() || '0'],
      ['Clientes Ocasionais', stats?.occasional_customers.toString() || '0'],
      ['Clientes Inativos', stats?.inactive_customers.toString() || '0'],
      ['Clientes Novos', stats?.new_customers.toString() || '0'],
      ['Receita Total', formatPrice(stats?.total_revenue || 0)],
      ['Valor Médio por Cliente', formatPrice(stats?.average_customer_value || 0)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-frequencia-clientes-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
  };

  useEffect(() => {
    loadCustomerFrequencyReport();
  }, [dateRange.start, dateRange.end]);

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_reports') || hasPermission('can_view_sales_report')} showMessage={true}>
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
              <Users size={24} className="text-blue-600" />
              Relatório de Frequência de Clientes
            </h2>
            <p className="text-gray-600">Análise estratégica do comportamento de compra dos clientes</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadCustomerFrequencyReport}
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
              disabled={customers.length === 0}
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
            <h3 className="text-lg font-semibold text-gray-800">Filtros e Período</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segmento
              </label>
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Segmentos</option>
                <option value="loyal">Clientes Fiéis</option>
                <option value="occasional">Clientes Ocasionais</option>
                <option value="inactive">Clientes Inativos</option>
                <option value="new">Clientes Novos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="frequency">Frequência</option>
                <option value="value">Valor Gasto</option>
                <option value="recent">Mais Recente</option>
                <option value="name">Nome</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Cliente
              </label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome ou telefone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_customers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-gray-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Fiéis</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.loyal_customers}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.total_customers > 0 ? Math.round((stats.loyal_customers / stats.total_customers) * 100) : 0}%
                  </p>
                </div>
                <Star className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(stats.total_revenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Médio/Cliente</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPrice(stats.average_customer_value)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Segment Distribution */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Segmento</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <Star size={32} className="mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.loyal_customers}</p>
                <p className="text-sm text-green-700 font-medium">Clientes Fiéis</p>
                <p className="text-xs text-gray-500">4+ pedidos/mês</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <User size={32} className="mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.occasional_customers}</p>
                <p className="text-sm text-blue-700 font-medium">Ocasionais</p>
                <p className="text-xs text-gray-500">1-3 pedidos/mês</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <UserX size={32} className="mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">{stats.inactive_customers}</p>
                <p className="text-sm text-red-700 font-medium">Inativos</p>
                <p className="text-xs text-gray-500">60+ dias sem pedido</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Award size={32} className="mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.new_customers}</p>
                <p className="text-sm text-purple-700 font-medium">Novos</p>
                <p className="text-xs text-gray-500">Primeiros 30 dias</p>
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

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Análise Detalhada de Clientes</h3>
            <p className="text-gray-600 text-sm">
              {filteredAndSortedCustomers.length} cliente(s) encontrado(s)
            </p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analisando comportamento dos clientes...</p>
            </div>
          ) : filteredAndSortedCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || segmentFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há dados de clientes para o período selecionado'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Segmento</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Frequência</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pedidos</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Valor Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket Médio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Último Pedido</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Produtos Favoritos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedCustomers.map((customer) => (
                    <tr key={customer.customer_id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-800">{customer.customer_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} />
                            {customer.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getSegmentColor(customer.customer_segment)}`}>
                          {getSegmentIcon(customer.customer_segment)}
                          {getSegmentLabel(customer.customer_segment)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {customer.frequency_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">pedidos/mês</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-gray-400" />
                            <span className="font-medium">{customer.total_orders} total</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.orders_this_month} este mês
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-green-600">
                          {formatPrice(customer.total_spent)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-purple-600">
                          {formatPrice(customer.average_order_value)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {formatDate(customer.last_order_date)}
                          </div>
                          <div className={`text-xs ${
                            customer.days_since_last_order <= 7 ? 'text-green-600' :
                            customer.days_since_last_order <= 30 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {customer.days_since_last_order === 0 ? 'Hoje' :
                             customer.days_since_last_order === 1 ? 'Ontem' :
                             `${customer.days_since_last_order} dias atrás`}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {customer.favorite_products.slice(0, 2).map((product, index) => (
                            <div key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {product}
                            </div>
                          ))}
                          {customer.favorite_products.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{customer.favorite_products.length - 2} outros
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Insights and Recommendations */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              Insights Estratégicos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">📈 Oportunidades de Crescimento</h4>
                
                {stats.inactive_customers > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <UserX size={20} className="text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Reativar Clientes Inativos</p>
                        <p className="text-red-700 text-sm">
                          {stats.inactive_customers} cliente(s) não compram há mais de 60 dias.
                          Considere campanhas de reativação com ofertas especiais.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {stats.occasional_customers > stats.loyal_customers && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp size={20} className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Converter Ocasionais em Fiéis</p>
                        <p className="text-blue-700 text-sm">
                          {stats.occasional_customers} clientes ocasionais podem se tornar fiéis.
                          Implemente programa de fidelidade ou promoções recorrentes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {stats.new_customers > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Award size={20} className="text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800">Fidelizar Novos Clientes</p>
                        <p className="text-purple-700 text-sm">
                          {stats.new_customers} cliente(s) novo(s) nos últimos 30 dias.
                          Ofereça experiência excepcional para garantir retorno.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">💡 Recomendações</h4>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Star size={20} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Programa VIP</p>
                      <p className="text-green-700 text-sm">
                        Crie benefícios exclusivos para os {stats.loyal_customers} clientes fiéis.
                        Eles representam sua base mais valiosa.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Clock size={20} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Campanhas Sazonais</p>
                      <p className="text-yellow-700 text-sm">
                        Frequência média: {stats.average_frequency.toFixed(1)} pedidos/mês.
                        Use essa informação para timing de campanhas.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <BarChart3 size={20} className="text-indigo-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-indigo-800">Análise de Valor</p>
                      <p className="text-indigo-700 text-sm">
                        Valor médio por cliente: {formatPrice(stats.average_customer_value)}.
                        Foque em aumentar o ticket médio dos ocasionais.
                      </p>
                    </div>
                  </div>
                </div>
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

export default PDVCustomerFrequencyReport;