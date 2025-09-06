import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types/order';
import OrderStatusBadge from './OrderStatusBadge';
import OrderChat from './OrderChat';
import OrderPrintView from './OrderPrintView';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Printer,
  Store
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  storeSettings?: any;
  isAttendant?: boolean;
  className?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  storeSettings,
  onStatusChange, 
  isAttendant = false,
  className = ''
}) => {
  const { hasPermission } = usePermissions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'money': return 'Dinheiro';
      case 'pix_entregador': return 'PIX Entregador';
      case 'pix_online': return 'PIX Online';
      case 'pix': return 'PIX'; // Manter compatibilidade
      case 'card': return 'Cartão';
      default: return method;
    }
  };

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'preparing', label: 'Em Preparo' },
    { value: 'out_for_delivery', label: 'Saiu para Entrega' },
    { value: 'ready_for_pickup', label: 'Pronto para Retirada' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const generateWhatsAppLink = () => {
    // Add null checks for order data
    if (!order || !order.id) {
      console.error('❌ Order data is null or missing ID');
      return '#';
    }
    
    const customerPhone = (order.customer_phone || '').replace(/\D/g, '');
    const phoneWithCountryCode = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`;
    
    const statusMessages = {
      pending: 'Recebemos seu pedido e já estamos processando! ⏰',
      confirmed: 'Seu pedido foi confirmado e entrará em preparo em breve! 👨‍🍳',
      preparing: 'Seu pedido está sendo preparado com muito carinho! ⏰ Tempo estimado: 35 minutos',
      out_for_delivery: 'Seu pedido saiu para entrega! 🚴‍♂️ O entregador está a caminho!',
      ready_for_pickup: 'Seu pedido está pronto para retirada! ✅ Pode vir buscar!',
      delivered: 'Obrigado por escolher a Elite Açaí! 😊 Esperamos que tenha gostado!',
      cancelled: 'Seu pedido foi cancelado. Entre em contato conosco para mais informações.'
    };
    
    let message = `Olá ${order.customer_name || 'Cliente'}! 👋\n\n`;
    
    if (order.delivery_type === 'pickup') {
      message += `🏪 RETIRADA NA LOJA\n`;
      message += `📅 Data: ${order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleDateString('pt-BR') : 'Não definida'}\n`;
      message += `⏰ Horário: ${order.scheduled_pickup_time || 'Não definido'}\n`;
      message += `📍 Local: Rua Um, 1614-C – Residencial 1 – Cágado\n`;
    } else {
      message += `📍 Endereço: ${order.customer_address || 'Não informado'}\n`;
      message += `🏘️ Bairro: ${order.customer_neighborhood}\n`;
      if (order.customer_complement) {
        message += `🏠 Complemento: ${order.customer_complement}\n`;
      }
    }
    message += `💳 Pagamento: ${getPaymentMethodLabel(order.payment_method)}\n\n`;
    
    // Adicionar link do Google Maps apenas para delivery
    if (order.delivery_type === 'delivery') {
      const fullAddress = `${order.customer_address || ''}, ${order.customer_neighborhood || ''}`.trim();
      const encodedAddress = encodeURIComponent(fullAddress);
      message += `📍 *LOCALIZAÇÃO NO MAPA:*\n`;
      message += `https://www.google.com/maps/search/?api=1&query=${encodedAddress}\n\n`;
    } else {
      message += `\n`;
    }
    
    if (order.status === 'preparing' && order.delivery_type === 'delivery') {
      message += `⏰ Tempo estimado: 35 minutos\n\n`;
    } else if (order.delivery_type === 'pickup') {
      message += `⏰ Horário agendado: ${order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleDateString('pt-BR') : 'Não definido'} às ${order.scheduled_pickup_time || 'Não definido'}\n\n`;
    }
    
    message += `Qualquer dúvida, estamos aqui para ajudar! 😊\n\n`;
    message += `🔗 *ACOMPANHE SEU PEDIDO:*\n`;
    message += `${window.location.origin}/pedido/${order.id}\n\n`;
    message += `Elite Açaí - O melhor açaí da cidade! 🍧`;
    
    return `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden print:hidden transition-all duration-300 hover:shadow-xl ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-3 shadow-lg">
                <Package size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  Pedido #{order.id.slice(-8)}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <OrderStatusBadge status={order.status} className="text-base px-4 py-2 shadow-md" />
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 bg-white/50 rounded-lg p-3">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Cliente</p>
                <p className="font-semibold text-gray-800">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/50 rounded-lg p-3">
              <Phone size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Telefone</p>
                <p className="font-semibold text-gray-800">{order.customer_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/50 rounded-lg p-3 md:col-span-2">
              {order.delivery_type === 'pickup' ? (
                <Store size={16} className="text-gray-400" />
              ) : (
                <MapPin size={16} className="text-gray-400" />
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">
                  {order.delivery_type === 'pickup' ? 'Retirada' : 'Endereço'}
                </p>
                {order.delivery_type === 'pickup' ? (
                  <>
                    <p className="font-semibold text-gray-800">Retirada na Loja</p>
                    <p className="text-sm text-gray-600">
                      📅 {order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleDateString('pt-BR') : 'Data não definida'} às {order.scheduled_pickup_time || 'Horário não definido'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">{order.customer_address}</p>
                    <p className="text-sm text-gray-600">{order.customer_neighborhood}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                  <CreditCard size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Pagamento</p>
                    <p className="font-medium text-gray-800">{getPaymentMethodLabel(order.payment_method)}</p>
                    {order.change_for && (
                      <p className="text-xs text-gray-600">
                        Troco: {formatPrice(order.change_for)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg">
                  <p className="text-xs font-medium">Total</p>
                  <p className="text-xl font-bold">{formatPrice(order.total_price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintView(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl hover:from-green-200 hover:to-emerald-200 transition-all duration-300 text-sm print:hidden shadow-md hover:shadow-lg transform hover:scale-105"
                  title="Imprimir pedido"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                {isAttendant && (
                  <a
                    href={generateWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-sm print:hidden shadow-lg hover:shadow-xl transform hover:scale-105"
                    title="Falar com cliente via WhatsApp"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/70 text-gray-700 rounded-xl hover:bg-white transition-all duration-300 text-sm print:hidden shadow-md hover:shadow-lg"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {isExpanded ? 'Menos' : 'Detalhes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Change (Attendant Only) */}
        {isAttendant && (hasPermission('can_update_status') || hasPermission('can_edit_orders')) && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 print:hidden">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔄 Alterar Status do Pedido:
            </label>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 font-medium"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={18} className="text-purple-600" />
              Itens do Pedido ({order.items.length}):
            </h4>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-xl shadow-md"
                    />
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-800 mb-1">{item.product_name}</h5>
                      {item.selected_size && (
                        <p className="text-sm text-purple-600 font-medium">Tamanho: {item.selected_size}</p>
                      )}
                      
                      {/* Complementos */}
                      {item.complements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-bold text-gray-700 mb-1">Complementos:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.complements.map((comp, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
                              >
                                {comp.name}
                                {comp.price > 0 && ` (+${formatPrice(comp.price)})`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {item.observations && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs font-bold text-yellow-800 mb-1">📝 Observações:</p>
                          <p className="text-sm text-yellow-800 font-medium">
                            {item.observations}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                            Qtd: {item.quantity}x
                          </span>
                        </div>
                        <span className="font-bold text-green-600 text-lg">
                          {formatPrice(item.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Print View Modal */}
      {showPrintView && (
        <OrderPrintView 
          order={order} 
          storeSettings={storeSettings}
          onClose={() => setShowPrintView(false)} 
        />
      )}
    </>
  );
};

export default OrderCard;