import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Printer, 
  RefreshCw, 
  User,
  Phone,
  Mail,
  Calendar,
  Filter,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  date_of_birth: string | null;
  whatsapp_consent: boolean;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
}

interface CustomerStats {
  total_customers: number;
  customers_with_email: number;
  customers_with_whatsapp: number;
  active_customers: number;
  total_orders: number;
  total_revenue: number;
}

const PDVCustomersReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'email' | 'created_at' | 'total_orders' | 'total_spent'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'with_email' | 'with_whatsapp' | 'active'>('all');
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

  const formatPhone = (phone: string) => {
    // Format phone number as (XX) XXXXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const loadCustomersReport = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabaseConfigured) {
        // Mock data for demonstration
        const mockCustomers: Customer[] = [
          {
            id: '1',
            name: 'Maria Silva Santos',
            phone: '85999991111',
            email: 'maria.silva@email.com',
            balance: 15.50,
            created_at: '2024-10-15T10:30:00Z',
            updated_at: '2025-01-15T14:20:00Z',
            last_login: '2025-01-15T14:20:00Z',
            date_of_birth: '1985-03-20',
            whatsapp_consent: true,
            total_orders: 12,
            total_spent: 380.75,
            last_order_date: '2025-01-15T14:20:00Z'
          },
          {
            id: '2',
            name: 'João Pedro Oliveira',
            phone: '85999992222',
            email: null,
            balance: 8.25,
            created_at: '2024-11-02T16:45:00Z',
            updated_at: '2025-01-10T12:15:00Z',
            last_login: null,
            date_of_birth: null,
            whatsapp_consent: false,
            total_orders: 5,
            total_spent: 125.50,
            last_order_date: '2025-01-10T12:15:00Z'
          },
          {
            id: '3',
            name: 'Ana Costa Lima',
            phone: '85999993333',
            email: 'ana.costa@gmail.com',
            balance: 0.00,
            created_at: '2024-12-20T09:15:00Z',
            updated_at: '2025-01-05T18:30:00Z',
            last_login: '2025-01-05T18:30:00Z',
            date_of_birth: '1992-07-10',
            whatsapp_consent: true,
            total_orders: 3,
            total_spent: 89.90,
            last_order_date: '2025-01-05T18:30:00Z'
          }
        ];

        const mockStats: CustomerStats = {
          total_customers: 3,
          customers_with_email: 2,
          customers_with_whatsapp: 2,
          active_customers: 3,
          total_orders: 20,
          total_revenue: 596.15
        };

        setCustomers(mockCustomers);
        setStats(mockStats);
        setLoading(false);
        return;
      }

      console.log('📊 Carregando relatório de clientes...');

      // Get all customers with their order data
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
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
          customers_with_email: 0,
          customers_with_whatsapp: 0,
          active_customers: 0,
          total_orders: 0,
          total_revenue: 0
        });
        setLoading(false);
        return;
      }

      // Enrich customer data with order statistics
      const enrichedCustomers = await Promise.all(
        customersData.map(async (customer) => {
          try {
            // Get order statistics for each customer
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('total_price, created_at')
              .eq('customer_id', customer.id)
              .neq('status', 'cancelled');

            if (ordersError) {
              console.warn(`⚠️ Erro ao buscar pedidos para cliente ${customer.id}:`, ordersError);
            }

            const orders = ordersData || [];
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + order.total_price, 0);
            const lastOrderDate = orders.length > 0 
              ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
              : null;

            return {
              ...customer,
              total_orders: totalOrders,
              total_spent: totalSpent,
              last_order_date: lastOrderDate
            };
          } catch (err) {
            console.error(`❌ Erro ao processar cliente ${customer.id}:`, err);
            return {
              ...customer,
              total_orders: 0,
              total_spent: 0,
              last_order_date: null
            };
          }
        })
      );

      // Calculate statistics
      const totalCustomers = enrichedCustomers.length;
      const customersWithEmail = enrichedCustomers.filter(c => c.email && c.email.trim()).length;
      const customersWithWhatsapp = enrichedCustomers.filter(c => c.whatsapp_consent).length;
      const activeCustomers = enrichedCustomers.filter(c => {
        if (!c.last_order_date) return false;
        const daysSinceLastOrder = Math.floor(
          (new Date().getTime() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastOrder <= 30; // Active if ordered in last 30 days
      }).length;
      const totalOrders = enrichedCustomers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
      const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

      setStats({
        total_customers: totalCustomers,
        customers_with_email: customersWithEmail,
        customers_with_whatsapp: customersWithWhatsapp,
        active_customers: activeCustomers,
        total_orders: totalOrders,
        total_revenue: totalRevenue
      });

      setCustomers(enrichedCustomers);
      console.log('✅ Relatório de clientes processado:', {
        totalCustomers,
        customersWithEmail,
        activeCustomers
      });

    } catch (err) {
      console.error('❌ Erro ao carregar relatório de clientes:', err);
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
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'with_email':
          filtered = filtered.filter(customer => customer.email && customer.email.trim());
          break;
        case 'with_whatsapp':
          filtered = filtered.filter(customer => customer.whatsapp_consent);
          break;
        case 'active':
          filtered = filtered.filter(customer => {
            if (!customer.last_order_date) return false;
            const daysSinceLastOrder = Math.floor(
              (new Date().getTime() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceLastOrder <= 30;
          });
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'phone':
          return a.phone.localeCompare(b.phone);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'total_orders':
          return (b.total_orders || 0) - (a.total_orders || 0);
        case 'total_spent':
          return (b.total_spent || 0) - (a.total_spent || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, filterBy, sortBy]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (customers.length === 0) return;

    const csvContent = [
      ['Relatório de Clientes - Elite Açaí'],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      [''],
      ['Nome', 'Telefone', 'Email', 'Saldo Cashback', 'Total Pedidos', 'Total Gasto', 'Data Cadastro', 'Último Pedido', 'WhatsApp', 'Data Nascimento'],
      ...filteredAndSortedCustomers.map(customer => [
        customer.name,
        formatPhone(customer.phone),
        customer.email || 'Não informado',
        formatPrice(customer.balance),
        (customer.total_orders || 0).toString(),
        formatPrice(customer.total_spent || 0),
        formatDate(customer.created_at),
        customer.last_order_date ? formatDate(customer.last_order_date) : 'Nunca',
        customer.whatsapp_consent ? 'Sim' : 'Não',
        customer.date_of_birth ? formatDate(customer.date_of_birth) : 'Não informado'
      ]),
      [''],
      ['Resumo'],
      ['Total de Clientes', stats?.total_customers.toString() || '0'],
      ['Clientes com Email', stats?.customers_with_email.toString() || '0'],
      ['Clientes com WhatsApp', stats?.customers_with_whatsapp.toString() || '0'],
      ['Clientes Ativos (30 dias)', stats?.active_customers.toString() || '0'],
      ['Total de Pedidos', stats?.total_orders.toString() || '0'],
      ['Receita Total', formatPrice(stats?.total_revenue || 0)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-clientes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    loadCustomersReport();
  }, []);

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
              Relatório de Clientes
            </h2>
            <p className="text-gray-600">Lista completa de clientes com dados de contato</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadCustomersReport}
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
                  <p className="text-sm font-medium text-gray-600">Com Email</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.customers_with_email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.total_customers > 0 ? Math.round((stats.customers_with_email / stats.total_customers) * 100) : 0}%
                  </p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Com WhatsApp</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.customers_with_whatsapp}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.total_customers > 0 ? Math.round((stats.customers_with_whatsapp / stats.total_customers) * 100) : 0}%
                  </p>
                </div>
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.active_customers}
                  </p>
                  <p className="text-xs text-gray-500">Últimos 30 dias</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800">Filtros e Busca</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="Nome, telefone ou email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Clientes</option>
                <option value="with_email">Com Email</option>
                <option value="with_whatsapp">Com WhatsApp</option>
                <option value="active">Ativos (30 dias)</option>
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
                <option value="name">Nome</option>
                <option value="phone">Telefone</option>
                <option value="email">Email</option>
                <option value="created_at">Data de Cadastro</option>
                <option value="total_orders">Total de Pedidos</option>
                <option value="total_spent">Total Gasto</option>
              </select>
            </div>
          </div>
        </div>

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
            <h3 className="text-lg font-semibold text-gray-800">Lista de Clientes</h3>
            <p className="text-gray-600 text-sm">
              {filteredAndSortedCustomers.length} cliente(s) encontrado(s)
            </p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando clientes...</p>
            </div>
          ) : filteredAndSortedCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterBy !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há clientes cadastrados no sistema'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Saldo Cashback</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pedidos</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Gasto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cadastro</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Último Pedido</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-800">{customer.name}</div>
                            {customer.date_of_birth && (
                              <div className="text-xs text-gray-500">
                                Nascimento: {formatDate(customer.date_of_birth)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <a 
                            href={`tel:${customer.phone}`}
                            className="text-blue-600 hover:underline font-mono"
                          >
                            {formatPhone(customer.phone)}
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {customer.email ? (
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <a 
                              href={`mailto:${customer.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {customer.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Não informado</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-semibold ${
                          (customer.balance || 0) > 0 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {formatPrice(Math.max(0, customer.balance || 0))}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-800">
                          {customer.total_orders || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">
                          {formatPrice(customer.total_spent || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">
                          {formatDate(customer.created_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {customer.last_order_date ? (
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {formatDate(customer.last_order_date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const daysSince = Math.floor(
                                  (new Date().getTime() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
                                );
                                if (daysSince === 0) return 'Hoje';
                                if (daysSince === 1) return 'Ontem';
                                return `${daysSince} dias atrás`;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Nunca</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          customer.whatsapp_consent
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.whatsapp_consent ? 'Sim' : 'Não'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contact Information Summary */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo de Dados de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total_customers}</p>
                <p className="text-gray-600">Total de Clientes</p>
                <p className="text-sm text-gray-500">Base de clientes cadastrada</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.customers_with_email}</p>
                <p className="text-gray-600">Com Email</p>
                <p className="text-sm text-gray-500">
                  {stats.total_customers > 0 ? Math.round((stats.customers_with_email / stats.total_customers) * 100) : 0}% dos clientes
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.customers_with_whatsapp}</p>
                <p className="text-gray-600">Com WhatsApp</p>
                <p className="text-sm text-gray-500">
                  {stats.total_customers > 0 ? Math.round((stats.customers_with_whatsapp / stats.total_customers) * 100) : 0}% dos clientes
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

export default PDVCustomersReport;