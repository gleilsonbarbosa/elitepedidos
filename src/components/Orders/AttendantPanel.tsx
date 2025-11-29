import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  Filter, 
  Search, 
  Bell, 
  Printer,
  MessageCircle,
  Clock,
  CheckCircle,
  Truck,
  User,
  X,
  AlertCircle
} from 'lucide-react';
import { useOrders, useOrderChat } from '../../hooks/useOrders';
import { Order, OrderStatus } from '../../types/order';
import { PDVOperator } from '../../types/pdv';
import { useOrderSettings } from '../../hooks/useOrderSettings';
import OrderCard from './OrderCard';
import OrderChat from './OrderChat';
import ManualOrderForm from './ManualOrderForm';
import OrderPrintView from './OrderPrintView';

interface AttendantPanelProps {
  operator: PDVOperator;
}

const AttendantPanel: React.FC<AttendantPanelProps> = ({ operator }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Carregar configurações de pedidos
  const { settings: orderSettings } = useOrderSettings();

  // Callback para quando novo pedido chegar
  const handleNewOrder = useCallback((newOrder: Order) => {
    console.log('🆕 Novo pedido recebido no painel:', newOrder.id.slice(-8));
    console.log('📋 Pedido completo:', newOrder);
    console.log('⚙️ Configuração auto_print:', orderSettings.auto_print);

    // Mostrar modal de impressão automaticamente APENAS se auto_print estiver habilitado
    if (orderSettings.auto_print) {
      console.log('📝 Auto-print habilitado - Abrindo modal de impressão...');
      setOrderToPrint(newOrder);
      setShowPrintView(true);
      console.log('✅ Modal de impressão ativado');
    } else {
      console.log('⚠️ Auto-print desabilitado - Modal não será aberto automaticamente');
    }

    // Mostrar notificação visual
    console.log('🔔 Criando notificação visual...');
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-bounce';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
      </svg>
      <div>
        <p class="font-bold">Novo Pedido!</p>
        <p class="text-sm">Pedido #${newOrder.id.slice(-8)} de ${newOrder.customer_name}</p>
      </div>
    `;
    document.body.appendChild(notification);
    console.log('✅ Notificação adicionada ao DOM');

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
          console.log('🗑️ Notificação removida');
        }
      }, 500);
    }, 5000);
  }, [orderSettings.auto_print]);

  const { orders, loading, error, updateOrderStatus, refetch } = useOrders(handleNewOrder);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch(true); // Skip cleanup on auto-refresh to prevent loops
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      ready_for_pickup: orders.filter(o => o.status === 'ready_for_pickup').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = !searchTerm || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const statusCounts = getStatusCounts();

  const getStatusIcon = (status: OrderStatus | 'all') => {
    switch (status) {
      case 'all': return Package;
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'preparing': return Package;
      case 'out_for_delivery': return Truck;
      case 'ready_for_pickup': return Package;
      case 'delivered': return CheckCircle;
      case 'cancelled': return X;
      default: return Package;
    }
  };

  const getStatusColor = (status: OrderStatus | 'all') => {
    switch (status) {
      case 'all': return 'border-gray-300 text-gray-700';
      case 'pending': return 'border-purple-300 text-purple-700 bg-purple-50';
      case 'confirmed': return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'preparing': return 'border-orange-300 text-orange-700 bg-orange-50';
      case 'out_for_delivery': return 'border-indigo-300 text-indigo-700 bg-indigo-50';
      case 'ready_for_pickup': return 'border-green-300 text-green-700 bg-green-50';
      case 'delivered': return 'border-emerald-300 text-emerald-700 bg-emerald-50';
      case 'cancelled': return 'border-red-300 text-red-700 bg-red-50';
      default: return 'border-gray-300 text-gray-700';
    }
  };

  const getStatusLabel = (status: OrderStatus | 'all') => {
    switch (status) {
      case 'all': return 'Todos';
      case 'pending': return 'Pendentes';
      case 'confirmed': return 'Confirmados';
      case 'preparing': return 'Em Preparo';
      case 'out_for_delivery': return 'Saiu p/ Entrega';
      case 'ready_for_pickup': return 'Pronto p/ Retirada';
      case 'delivered': return 'Finalizados';
      case 'cancelled': return 'Cancelados';
      default: return status;
    }
  };

  const statusOptions: (OrderStatus | 'all')[] = [
    'all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered', 'cancelled'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Package size={24} className="text-purple-600" />
            </div>
            Painel de Atendimento
          </h2>
          <p className="text-gray-600 mt-1">Gerencie pedidos e converse com clientes</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Indicador de Auto-Print */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            orderSettings.auto_print
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            <Printer size={16} />
            <span>
              {orderSettings.auto_print ? 'Auto-impressão ON' : 'Auto-impressão OFF'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bell size={16} className="text-green-500" />
            <span>Atualização automática</span>
          </div>

          <button
            onClick={() => {
              setOrderToPrint(null);
              setShowPrintView(true);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </button>
          
          <button
            onClick={() => {
              console.log('🔘 Botão de pedido manual clicado');
              setShowManualOrderForm(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Pedido Manual
          </button>
          
          <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Filtrar por Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Filter size={20} />
          Filtrar por Status
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {statusOptions.map((status) => {
            const StatusIcon = getStatusIcon(status);
            const count = statusCounts[status] || 0;
            const isSelected = selectedStatus === status;
            
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md text-center ${
                  isSelected 
                    ? getStatusColor(status) + ' border-2 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <StatusIcon size={24} />
                  <div>
                    <p className="font-medium text-sm">{getStatusLabel(status)}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone ou ID do pedido..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Erro ao carregar pedidos</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500">Não há pedidos para o status selecionado</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={updateOrderStatus}
              onOpenChat={(order) => {
                setSelectedOrder(order);
                setShowChat(true);
              }}
              operator={operator}
              isAttendant={true}
            />
          ))
        )}
      </div>

      <ManualOrderForm
        isOpen={showManualOrderForm}
        onClose={() => setShowManualOrderForm(false)}
        onOrderCreated={(order) => {
          console.log('✅ Pedido manual criado:', order);
          refetch(true); // Refresh orders list (skip cleanup)
          setShowManualOrderForm(false);
        }}
      />

      {/* Chat Modal */}
      {showChat && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Chat - Pedido #{selectedOrder.id.slice(-8)}
                  </h2>
                  <p className="text-gray-600">{selectedOrder.customer_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowChat(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="h-96">
              <OrderChat
                orderId={selectedOrder.id}
                isAttendant={true}
                attendantName={operator?.name || 'Atendente'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {showManualOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Criar Pedido Manual</h2>
                  <p className="text-gray-600">Adicione um pedido diretamente no sistema</p>
                </div>
                <button
                  onClick={() => setShowManualOrder(false)}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <ManualOrderForm
                onOrderCreated={() => {
                  setShowManualOrder(false);
                  refetch(true); // Skip cleanup on manual refresh
                }}
                onCancel={() => setShowManualOrder(false)}
                operator={operator}
              />
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {orderToPrint ? `Imprimir Pedido #${orderToPrint.id.slice(-8)}` : 'Imprimir Pedidos'}
                </h2>
                <button
                  onClick={() => {
                    setShowPrintView(false);
                    setOrderToPrint(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <OrderPrintView orders={orderToPrint ? [orderToPrint] : filteredOrders} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendantPanel;