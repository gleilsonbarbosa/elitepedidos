import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  BarChart3,
  AlertCircle,
  Filter,
  Users,
  DollarSign,
  Package,
  Sun,
  Moon,
  Sunrise,
  Sunset
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';

interface HourlyData {
  hour: number;
  orders_count: number;
  total_revenue: number;
  average_order_value: number;
  pdv_orders: number;
  delivery_orders: number;
  table_orders: number;
}

interface DailyData {
  day_of_week: number;
  day_name: string;
  orders_count: number;
  total_revenue: number;
  average_order_value: number;
  pdv_orders: number;
  delivery_orders: number;
  table_orders: number;
}

interface PeakAnalysis {
  peak_hour: number;
  peak_day: number;
  busiest_period: string;
  slowest_period: string;
  weekend_vs_weekday: {
    weekend_orders: number;
    weekday_orders: number;
    weekend_revenue: number;
    weekday_revenue: number;
  };
}

const PDVPeakHoursReport: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [peakAnalysis, setPeakAnalysis] = useState<PeakAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30); // Last 30 days
      return date.toISOString().split('T')[0];
    })(),
    end: new Date().toISOString().split('T')[0]
  });
  const [viewMode, setViewMode] = useState<'hourly' | 'daily' | 'analysis'>('hourly');
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

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek] || 'Desconhecido';
  };

  const getHourLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getPeriodIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return <Sunrise size={16} className="text-yellow-500" />;
    if (hour >= 12 && hour < 18) return <Sun size={16} className="text-orange-500" />;
    if (hour >= 18 && hour < 22) return <Sunset size={16} className="text-red-500" />;
    return <Moon size={16} className="text-blue-500" />;
  };

  const getPeriodName = (hour: number) => {
    if (hour >= 6 && hour < 12) return 'Manhã';
    if (hour >= 12 && hour < 18) return 'Tarde';
    if (hour >= 18 && hour < 22) return 'Noite';
    return 'Madrugada';
  };

  const loadPeakHoursReport = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabaseConfigured) {
        // Mock data for demonstration
        const mockHourlyData: HourlyData[] = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          orders_count: Math.floor(Math.random() * 20) + (hour >= 18 && hour <= 21 ? 15 : 0),
          total_revenue: Math.floor(Math.random() * 500) + (hour >= 18 && hour <= 21 ? 300 : 0),
          average_order_value: 25 + Math.random() * 15,
          pdv_orders: Math.floor(Math.random() * 10),
          delivery_orders: Math.floor(Math.random() * 8),
          table_orders: Math.floor(Math.random() * 5)
        }));

        const mockDailyData: DailyData[] = Array.from({ length: 7 }, (_, day) => ({
          day_of_week: day,
          day_name: getDayName(day),
          orders_count: Math.floor(Math.random() * 50) + (day === 4 ? 25 : 0), // Thursday peak
          total_revenue: Math.floor(Math.random() * 1000) + (day === 4 ? 500 : 0),
          average_order_value: 25 + Math.random() * 15,
          pdv_orders: Math.floor(Math.random() * 20),
          delivery_orders: Math.floor(Math.random() * 15),
          table_orders: Math.floor(Math.random() * 10)
        }));

        const mockPeakAnalysis: PeakAnalysis = {
          peak_hour: 19,
          peak_day: 4,
          busiest_period: 'Noite (18h-22h)',
          slowest_period: 'Madrugada (0h-6h)',
          weekend_vs_weekday: {
            weekend_orders: 120,
            weekday_orders: 280,
            weekend_revenue: 3000,
            weekday_revenue: 7000
          }
        };

        setHourlyData(mockHourlyData);
        setDailyData(mockDailyData);
        setPeakAnalysis(mockPeakAnalysis);
        setLoading(false);
        return;
      }

      console.log('📊 Carregando relatório de picos de horários...');

      // Get all orders in the date range
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('created_at, total_price, channel, status')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .neq('status', 'cancelled');

      if (ordersError) {
        console.error('❌ Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      // Get PDV sales
      const { data: pdvSales, error: pdvError } = await supabase
        .from('pdv_sales')
        .select('created_at, total_amount, channel')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .eq('is_cancelled', false);

      if (pdvError) {
        console.warn('⚠️ Erro ao buscar vendas PDV:', pdvError);
      }

      // Get table sales
      const { data: tableSales, error: tableError } = await supabase
        .from('store1_table_sales')
        .select('created_at, total_amount')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .eq('status', 'fechada');

      if (tableError) {
        console.warn('⚠️ Erro ao buscar vendas de mesa:', tableError);
      }

      // Combine all sales data
      const allSales = [
        ...(allOrders || []).map(order => ({
          created_at: order.created_at,
          total_amount: order.total_price,
          channel: order.channel || 'delivery'
        })),
        ...(pdvSales || []).map(sale => ({
          created_at: sale.created_at,
          total_amount: sale.total_amount,
          channel: 'pdv'
        })),
        ...(tableSales || []).map(sale => ({
          created_at: sale.created_at,
          total_amount: sale.total_amount,
          channel: 'table'
        }))
      ];

      console.log(`✅ ${allSales.length} vendas encontradas para análise`);

      // Process hourly data
      const hourlyMap = new Map<number, {
        orders_count: number;
        total_revenue: number;
        pdv_orders: number;
        delivery_orders: number;
        table_orders: number;
      }>();

      // Initialize all hours
      for (let hour = 0; hour < 24; hour++) {
        hourlyMap.set(hour, {
          orders_count: 0,
          total_revenue: 0,
          pdv_orders: 0,
          delivery_orders: 0,
          table_orders: 0
        });
      }

      // Process sales by hour
      allSales.forEach(sale => {
        const hour = new Date(sale.created_at).getHours();
        const existing = hourlyMap.get(hour)!;
        
        existing.orders_count++;
        existing.total_revenue += sale.total_amount;
        
        if (sale.channel === 'pdv') existing.pdv_orders++;
        else if (sale.channel === 'delivery') existing.delivery_orders++;
        else if (sale.channel === 'table') existing.table_orders++;
      });

      const processedHourlyData: HourlyData[] = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
        hour,
        ...data,
        average_order_value: data.orders_count > 0 ? data.total_revenue / data.orders_count : 0
      }));

      // Process daily data
      const dailyMap = new Map<number, {
        orders_count: number;
        total_revenue: number;
        pdv_orders: number;
        delivery_orders: number;
        table_orders: number;
      }>();

      // Initialize all days
      for (let day = 0; day < 7; day++) {
        dailyMap.set(day, {
          orders_count: 0,
          total_revenue: 0,
          pdv_orders: 0,
          delivery_orders: 0,
          table_orders: 0
        });
      }

      // Process sales by day of week
      allSales.forEach(sale => {
        const dayOfWeek = new Date(sale.created_at).getDay();
        const existing = dailyMap.get(dayOfWeek)!;
        
        existing.orders_count++;
        existing.total_revenue += sale.total_amount;
        
        if (sale.channel === 'pdv') existing.pdv_orders++;
        else if (sale.channel === 'delivery') existing.delivery_orders++;
        else if (sale.channel === 'table') existing.table_orders++;
      });

      const processedDailyData: DailyData[] = Array.from(dailyMap.entries()).map(([day, data]) => ({
        day_of_week: day,
        day_name: getDayName(day),
        ...data,
        average_order_value: data.orders_count > 0 ? data.total_revenue / data.orders_count : 0
      }));

      // Calculate peak analysis
      const peakHour = processedHourlyData.reduce((max, current) => 
        current.orders_count > max.orders_count ? current : max
      );

      const peakDay = processedDailyData.reduce((max, current) => 
        current.orders_count > max.orders_count ? current : max
      );

      // Calculate weekend vs weekday
      const weekendDays = [0, 6]; // Sunday and Saturday
      const weekendData = processedDailyData.filter(day => weekendDays.includes(day.day_of_week));
      const weekdayData = processedDailyData.filter(day => !weekendDays.includes(day.day_of_week));

      const weekendOrders = weekendData.reduce((sum, day) => sum + day.orders_count, 0);
      const weekdayOrders = weekdayData.reduce((sum, day) => sum + day.orders_count, 0);
      const weekendRevenue = weekendData.reduce((sum, day) => sum + day.total_revenue, 0);
      const weekdayRevenue = weekdayData.reduce((sum, day) => sum + day.total_revenue, 0);

      // Determine busiest and slowest periods
      const periods = [
        { name: 'Madrugada (0h-6h)', hours: [0, 1, 2, 3, 4, 5] },
        { name: 'Manhã (6h-12h)', hours: [6, 7, 8, 9, 10, 11] },
        { name: 'Tarde (12h-18h)', hours: [12, 13, 14, 15, 16, 17] },
        { name: 'Noite (18h-24h)', hours: [18, 19, 20, 21, 22, 23] }
      ];

      const periodStats = periods.map(period => {
        const periodOrders = period.hours.reduce((sum, hour) => {
          const hourData = processedHourlyData.find(h => h.hour === hour);
          return sum + (hourData?.orders_count || 0);
        }, 0);
        
        return { ...period, orders: periodOrders };
      });

      const busiestPeriod = periodStats.reduce((max, current) => 
        current.orders > max.orders ? current : max
      );

      const slowestPeriod = periodStats.reduce((min, current) => 
        current.orders < min.orders ? current : min
      );

      const analysis: PeakAnalysis = {
        peak_hour: peakHour.hour,
        peak_day: peakDay.day_of_week,
        busiest_period: busiestPeriod.name,
        slowest_period: slowestPeriod.name,
        weekend_vs_weekday: {
          weekend_orders: weekendOrders,
          weekday_orders: weekdayOrders,
          weekend_revenue: weekendRevenue,
          weekday_revenue: weekdayRevenue
        }
      };

      setHourlyData(processedHourlyData);
      setDailyData(processedDailyData);
      setPeakAnalysis(analysis);

      console.log('✅ Relatório de picos processado:', {
        hourlyDataPoints: processedHourlyData.length,
        dailyDataPoints: processedDailyData.length,
        peakHour: peakHour.hour,
        peakDay: peakDay.day_name
      });

    } catch (err) {
      console.error('❌ Erro ao carregar relatório de picos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = (data: HourlyData[] | DailyData[], field: 'orders_count' | 'total_revenue') => {
    return Math.max(...data.map(item => item[field]));
  };

  const getBarHeight = (value: number, maxValue: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const getBarColor = (value: number, maxValue: number) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-orange-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (hourlyData.length === 0 && dailyData.length === 0) return;

    const csvContent = [
      ['Relatório de Horários e Dias de Compra - Elite Açaí'],
      ['Período', `${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      [''],
      ['ANÁLISE POR HORÁRIO'],
      ['Hora', 'Pedidos', 'Receita', 'Ticket Médio', 'PDV', 'Delivery', 'Mesas'],
      ...hourlyData.map(hour => [
        getHourLabel(hour.hour),
        hour.orders_count.toString(),
        formatPrice(hour.total_revenue),
        formatPrice(hour.average_order_value),
        hour.pdv_orders.toString(),
        hour.delivery_orders.toString(),
        hour.table_orders.toString()
      ]),
      [''],
      ['ANÁLISE POR DIA DA SEMANA'],
      ['Dia', 'Pedidos', 'Receita', 'Ticket Médio', 'PDV', 'Delivery', 'Mesas'],
      ...dailyData.map(day => [
        day.day_name,
        day.orders_count.toString(),
        formatPrice(day.total_revenue),
        formatPrice(day.average_order_value),
        day.pdv_orders.toString(),
        day.delivery_orders.toString(),
        day.table_orders.toString()
      ]),
      [''],
      ['ANÁLISE DE PICOS'],
      ['Horário de Pico', peakAnalysis ? getHourLabel(peakAnalysis.peak_hour) : 'N/A'],
      ['Dia de Pico', peakAnalysis ? getDayName(peakAnalysis.peak_day) : 'N/A'],
      ['Período Mais Movimentado', peakAnalysis?.busiest_period || 'N/A'],
      ['Período Menos Movimentado', peakAnalysis?.slowest_period || 'N/A']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-picos-horarios-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
  };

  useEffect(() => {
    loadPeakHoursReport();
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
              <Clock size={24} className="text-blue-600" />
              Relatório de Horários e Dias de Compra
            </h2>
            <p className="text-gray-600">Análise de picos de vendas por horário e dia da semana</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadPeakHoursReport}
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
              disabled={hourlyData.length === 0 && dailyData.length === 0}
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
            <h3 className="text-lg font-semibold text-gray-800">Período de Análise</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Visualização
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">Por Horário</option>
                <option value="daily">Por Dia da Semana</option>
                <option value="analysis">Análise Estratégica</option>
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

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analisando padrões de compra...</p>
          </div>
        ) : (
          <>
            {/* View Mode Content */}
            {viewMode === 'hourly' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Análise por Horário do Dia
                </h3>
                
                {/* Hourly Chart */}
                <div className="mb-6">
                  <div className="flex items-end justify-between gap-1 h-64 mb-4 bg-gray-50 rounded-lg p-4">
                    {hourlyData.map((hour) => {
                      const maxOrders = getMaxValue(hourlyData, 'orders_count');
                      const height = getBarHeight(hour.orders_count, maxOrders);
                      const color = getBarColor(hour.orders_count, maxOrders);
                      
                      return (
                        <div key={hour.hour} className="flex-1 flex flex-col items-center">
                          <div className="relative group flex-1 flex items-end">
                            <div
                              className={`w-full ${color} rounded-t transition-all hover:opacity-80 cursor-pointer`}
                              style={{ height: `${height}%` }}
                              title={`${getHourLabel(hour.hour)}: ${hour.orders_count} pedidos - ${formatPrice(hour.total_revenue)}`}
                            ></div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div className="font-medium">{getHourLabel(hour.hour)}</div>
                              <div>{hour.orders_count} pedidos</div>
                              <div>{formatPrice(hour.total_revenue)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getPeriodIcon(hour.hour)}
                              <span>{hour.hour}h</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hourly Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Horário</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Período</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Pedidos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Receita</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket Médio</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">PDV</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Delivery</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Mesas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {hourlyData
                        .filter(hour => hour.orders_count > 0)
                        .sort((a, b) => b.orders_count - a.orders_count)
                        .map((hour) => (
                        <tr key={hour.hour} className="hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getPeriodIcon(hour.hour)}
                              <span className="font-medium">{getHourLabel(hour.hour)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-600">{getPeriodName(hour.hour)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-blue-600">{hour.orders_count}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-green-600">
                              {formatPrice(hour.total_revenue)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">
                              {formatPrice(hour.average_order_value)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">{hour.pdv_orders}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">{hour.delivery_orders}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700">{hour.table_orders}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'daily' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-green-600" />
                  Análise por Dia da Semana
                </h3>
                
                {/* Daily Chart */}
                <div className="mb-6">
                  <div className="flex items-end justify-between gap-2 h-64 mb-4 bg-gray-50 rounded-lg p-4">
                    {dailyData.map((day) => {
                      const maxOrders = getMaxValue(dailyData, 'orders_count');
                      const height = getBarHeight(day.orders_count, maxOrders);
                      const color = getBarColor(day.orders_count, maxOrders);
                      
                      return (
                        <div key={day.day_of_week} className="flex-1 flex flex-col items-center">
                          <div className="relative group flex-1 flex items-end">
                            <div
                              className={`w-full ${color} rounded-t transition-all hover:opacity-80 cursor-pointer`}
                              style={{ height: `${height}%` }}
                              title={`${day.day_name}: ${day.orders_count} pedidos - ${formatPrice(day.total_revenue)}`}
                            ></div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div className="font-medium">{day.day_name}</div>
                              <div>{day.orders_count} pedidos</div>
                              <div>{formatPrice(day.total_revenue)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2 text-center">
                            <div>{day.day_name.slice(0, 3)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Dia da Semana</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Pedidos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Receita</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket Médio</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">PDV</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Delivery</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Mesas</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dailyData
                        .sort((a, b) => b.orders_count - a.orders_count)
                        .map((day) => {
                          const maxOrders = getMaxValue(dailyData, 'orders_count');
                          const performance = maxOrders > 0 ? (day.orders_count / maxOrders) * 100 : 0;
                          
                          return (
                            <tr key={day.day_of_week} className="hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <span className="font-medium text-gray-800">{day.day_name}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-blue-600">{day.orders_count}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-green-600">
                                  {formatPrice(day.total_revenue)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-700">
                                  {formatPrice(day.average_order_value)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-700">{day.pdv_orders}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-700">{day.delivery_orders}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-700">{day.table_orders}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${performance}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600">{Math.round(performance)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'analysis' && peakAnalysis && (
              <div className="space-y-6">
                {/* Peak Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Horário de Pico</p>
                        <p className="text-2xl font-bold text-red-600">
                          {getHourLabel(peakAnalysis.peak_hour)}
                        </p>
                        <p className="text-xs text-gray-500">Maior movimento</p>
                      </div>
                      <Clock className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Dia de Pico</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {getDayName(peakAnalysis.peak_day)}
                        </p>
                        <p className="text-xs text-gray-500">Melhor dia</p>
                      </div>
                      <Calendar className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Período Mais Movimentado</p>
                        <p className="text-lg font-bold text-green-600">
                          {peakAnalysis.busiest_period.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500">{peakAnalysis.busiest_period}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Período Mais Calmo</p>
                        <p className="text-lg font-bold text-blue-600">
                          {peakAnalysis.slowest_period.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500">{peakAnalysis.slowest_period}</p>
                      </div>
                      <Moon className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Weekend vs Weekday Analysis */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Análise: Fim de Semana vs Dias Úteis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                        <Users size={18} />
                        Dias Úteis (Seg-Sex)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Pedidos:</span>
                          <span className="font-bold text-blue-800">{peakAnalysis.weekend_vs_weekday.weekday_orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Receita:</span>
                          <span className="font-bold text-blue-800">{formatPrice(peakAnalysis.weekend_vs_weekday.weekday_revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Ticket Médio:</span>
                          <span className="font-medium text-blue-800">
                            {formatPrice(peakAnalysis.weekend_vs_weekday.weekday_orders > 0 
                              ? peakAnalysis.weekend_vs_weekday.weekday_revenue / peakAnalysis.weekend_vs_weekday.weekday_orders 
                              : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                        <Calendar size={18} />
                        Fim de Semana (Sáb-Dom)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Pedidos:</span>
                          <span className="font-bold text-purple-800">{peakAnalysis.weekend_vs_weekday.weekend_orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Receita:</span>
                          <span className="font-bold text-purple-800">{formatPrice(peakAnalysis.weekend_vs_weekday.weekend_revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Ticket Médio:</span>
                          <span className="font-medium text-purple-800">
                            {formatPrice(peakAnalysis.weekend_vs_weekday.weekend_orders > 0 
                              ? peakAnalysis.weekend_vs_weekday.weekend_revenue / peakAnalysis.weekend_vs_weekday.weekend_orders 
                              : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategic Insights */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    Insights Estratégicos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">📈 Oportunidades Identificadas</h4>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <TrendingUp size={20} className="text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">Horário de Pico</p>
                            <p className="text-green-700 text-sm">
                              {getHourLabel(peakAnalysis.peak_hour)} é seu horário de maior movimento.
                              Garanta equipe completa e estoque adequado neste período.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Calendar size={20} className="text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-800">Melhor Dia da Semana</p>
                            <p className="text-blue-700 text-sm">
                              {getDayName(peakAnalysis.peak_day)} é seu dia de maior faturamento.
                              Considere promoções especiais para outros dias.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Sun size={20} className="text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">Período Mais Movimentado</p>
                            <p className="text-yellow-700 text-sm">
                              {peakAnalysis.busiest_period} concentra a maior parte das vendas.
                              Otimize operações para este período.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">💡 Recomendações</h4>
                      
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Users size={20} className="text-indigo-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-indigo-800">Gestão de Equipe</p>
                            <p className="text-indigo-700 text-sm">
                              Escale mais funcionários durante {peakAnalysis.busiest_period.toLowerCase()} 
                              e reduza equipe em {peakAnalysis.slowest_period.toLowerCase()}.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Package size={20} className="text-orange-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-800">Gestão de Estoque</p>
                            <p className="text-orange-700 text-sm">
                              Prepare estoque extra antes das {getHourLabel(peakAnalysis.peak_hour)} 
                              e monitore produtos em falta durante picos.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <DollarSign size={20} className="text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-800">Estratégia de Preços</p>
                            <p className="text-purple-700 text-sm">
                              Considere promoções em {peakAnalysis.slowest_period.toLowerCase()} 
                              para aumentar movimento em horários mais calmos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
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

export default PDVPeakHoursReport;