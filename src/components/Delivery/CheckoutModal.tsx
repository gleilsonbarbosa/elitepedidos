import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, CreditCard, Calendar, Clock, Store, Truck, AlertCircle, Gift, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CartItem } from '../../types/cart';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useOrders } from '../../hooks/useOrders';
import { useStoreHours } from '../../hooks/useStoreHours';
import DeliveryTypeSelector from './DeliveryTypeSelector';
import PickupScheduler from './PickupScheduler';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import PushNotificationBanner from './PushNotificationBanner';
import { useWebPush } from '../../hooks/useWebPush';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onOrderComplete: () => void;
  customerId?: string | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  totalPrice,
  onOrderComplete,
  customerId,
}) => {
  const { neighborhoods } = useNeighborhoods();
  const { createOrder } = useOrders();
  const { storeSettings } = useStoreHours();
  const { products: availableProducts } = useDeliveryProducts();
  const { sendServerNotification } = useWebPush();
  
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('');
  const [customerComplement, setCustomerComplement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix_entregador' | 'pix_online' | 'cartao_credito' | 'cartao_debito'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [scheduledPickupDate, setScheduledPickupDate] = useState('');
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerNeighborhood('');
      setCustomerComplement('');
      setPaymentMethod('money');
      setChangeFor(undefined);
      setScheduledPickupDate('');
      setScheduledPickupTime('');
    }
  }, [isOpen]);

  // Função para buscar dados do cliente pelo telefone
  const searchCustomerByPhone = async (phone: string) => {
    if (phone.replace(/\D/g, '').length < 11) return;

    setLoadingCustomerData(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - busca de cliente não disponível');
        return;
      }

      console.log('🔍 Buscando cliente pelo telefone:', cleanPhone);

      // Buscar cliente na tabela customers
      const { data: customer, error } = await supabase
        .from('customers')
        .select('name, phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        return;
      }

      if (customer) {
        console.log('✅ Cliente encontrado:', customer.name);
        
        // Preencher nome automaticamente
        if (customer.name && !customerName.trim()) {
          setCustomerName(customer.name);
          
          // Mostrar feedback visual
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
          successMessage.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Dados do cliente preenchidos automaticamente!
          `;
          document.body.appendChild(successMessage);
          
          setTimeout(() => {
            if (document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
          }, 3000);
        }

        // Buscar último endereço do cliente
        const { data: lastOrder, error: orderError } = await supabase
          .from('orders')
          .select('customer_address, customer_neighborhood, customer_complement')
          .eq('customer_phone', cleanPhone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!orderError && lastOrder) {
          console.log('✅ Último endereço encontrado');
          
          // Preencher endereço apenas se estiver vazio
          if (lastOrder.customer_address && !customerAddress.trim()) {
            setCustomerAddress(lastOrder.customer_address);
          }
          if (lastOrder.customer_neighborhood && !customerNeighborhood.trim()) {
            setCustomerNeighborhood(lastOrder.customer_neighborhood);
          }
          if (lastOrder.customer_complement && !customerComplement.trim()) {
            setCustomerComplement(lastOrder.customer_complement);
          }
        }
      } else {
        console.log('ℹ️ Cliente não encontrado no banco de dados');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados do cliente:', err);
    } finally {
      setLoadingCustomerData(false);
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setCustomerPhone(formatted);
    
    // Buscar dados do cliente quando o telefone estiver completo
    if (formatted.replace(/\D/g, '').length === 11) {
      searchCustomerByPhone(formatted);
    }
  };

  const getDeliveryFee = () => {
    if (deliveryType === 'pickup') return 0;
    
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    return neighborhood ? neighborhood.delivery_fee : storeSettings?.delivery_fee || 5.00;
  };

  const getEstimatedDeliveryTime = () => {
    if (deliveryType === 'pickup') return 0;
    
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    return neighborhood ? neighborhood.delivery_time : storeSettings?.estimated_delivery_time || 35;
  };

  const getFinalTotal = () => {
    const total = totalPrice + getDeliveryFee();
    const roundedTotal = Math.round(total * 100) / 100;
    return roundedTotal;
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      alert('Por favor, digite seu nome');
      return false;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 11) {
      alert('Por favor, digite um telefone válido com 11 dígitos');
      return false;
    }

    if (deliveryType === 'delivery') {
      if (!customerAddress.trim()) {
        alert('Por favor, digite seu endereço');
        return false;
      }

      if (!customerNeighborhood.trim()) {
        alert('Por favor, selecione seu bairro');
        return false;
      }
    }

    if (deliveryType === 'pickup') {
      if (!scheduledPickupDate) {
        alert('Por favor, selecione a data para retirada');
        return false;
      }

      if (!scheduledPickupTime) {
        alert('Por favor, selecione o horário para retirada');
        return false;
      }
    }

    if (paymentMethod === 'money' && changeFor && changeFor < getFinalTotal()) {
      alert('O valor para troco deve ser maior ou igual ao total do pedido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
      
      // Map payment methods to database-accepted values
      const dbPaymentMethod = paymentMethod === 'pix_entregador' || paymentMethod === 'pix_online' 
        ? 'pix' 
        : paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito'
        ? 'card'
        : paymentMethod;
      
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\D/g, ''),
        customer_address: deliveryType === 'delivery' ? customerAddress : '',
        customer_neighborhood: deliveryType === 'delivery' ? customerNeighborhood : '',
        customer_complement: deliveryType === 'delivery' ? customerComplement : '',
        payment_method: dbPaymentMethod,
        change_for: changeFor,
        delivery_type: deliveryType,
        scheduled_pickup_date: deliveryType === 'pickup' ? scheduledPickupDate : undefined,
        scheduled_pickup_time: deliveryType === 'pickup' ? scheduledPickupTime : undefined,
        neighborhood_id: deliveryType === 'delivery' ? neighborhood?.id : undefined,
        delivery_fee: getDeliveryFee(),
        estimated_delivery_minutes: getEstimatedDeliveryTime(),
        items: items.map(item => ({
          product_name: item.product.name,
          product_image: item.product.image,
          selected_size: item.selectedSize?.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.totalPrice,
          observations: item.observations,
          complements: item.selectedComplements.map(sc => ({
            name: sc.complement.name,
            price: sc.complement.price
          }))
        })),
        total_price: getFinalTotal(),
        status: 'pending' as const
      };

      const newOrder = await createOrder(orderData);

      // Send push notification about order status
      if (customerId && customerPhone) {
        try {
          await sendServerNotification(customerPhone.replace(/\D/g, ''), {
            title: '🎉 Pedido Confirmado!',
            body: `Seu pedido #${newOrder.id.slice(-8)} foi recebido e está sendo processado.`,
            tag: 'order-confirmed',
            data: {
              orderId: newOrder.id,
              type: 'order_confirmed',
              url: `/pedido/${newOrder.id}`
            },
            actions: [
              {
                action: 'view',
                title: 'Ver Pedido'
              },
              {
                action: 'close',
                title: 'Fechar'
              }
            ]
          });
          console.log('✅ Notificação Push enviada para o cliente');
        } catch (pushError) {
          // Error is already handled in useWebPush hook, no need to log again
        }
      }

      // Show success message with order tracking
      const orderTrackingLink = `${window.location.origin}/pedido/${newOrder.id}`;
      
      alert(
        `🎉 Pedido realizado com sucesso!\n\n` +
        `📋 ID: ${newOrder.id.slice(-8)}\n` +
        `👤 Cliente: ${customerName}\n` +
        `💰 Total: ${formatPrice(getFinalTotal())}\n` +
        `${deliveryType === 'pickup' ? 
          `📍 *LOCAL DE RETIRADA:*\nRua Um, 1614-C – Residencial 1 – Cágado\n📅 Data: ${scheduledPickupDate ? new Date(scheduledPickupDate).toLocaleDateString('pt-BR') : 'Não definida'}\n⏰ Horário: ${scheduledPickupTime || 'Não definido'}\n\n` :
          `📍 *ENDEREÇO DE ENTREGA:*\n${customerAddress}\n🏘️ Bairro: ${customerNeighborhood}\n${customerComplement ? `🏠 Complemento: ${customerComplement}\n` : ''}\n\n`
        }` +
        `🔗 *ACOMPANHE SEU PEDIDO:*\n${window.location.origin}/pedido/[ID_DO_PEDIDO]\n\n` +
        `Elite Açaí - O melhor açaí da cidade! 🍧`
      );

      onOrderComplete();
      onClose();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao finalizar pedido: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Finalizar Pedido</h2>
              <p className="text-gray-600">Complete seus dados para confirmar o pedido</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Delivery Type Selection */}
          <DeliveryTypeSelector
            selectedType={deliveryType}
            onTypeChange={setDeliveryType}
          />

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seus Dados</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {loadingCustomerData && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      loadingCustomerData ? 'pr-10' : ''
                    }`}
                    placeholder="(85) 99999-9999"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preencheremos seus dados automaticamente se já for cliente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preenchido automaticamente se já for cliente
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Address (only for delivery) */}
          {deliveryType === 'delivery' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Endereço de Entrega</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={customerNeighborhood}
                    onChange={(e) => setCustomerNeighborhood(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Selecione seu bairro</option>
                    {neighborhoods.map(neighborhood => (
                      <option key={neighborhood.id} value={neighborhood.name}>
                        {neighborhood.name} - {formatPrice(neighborhood.delivery_fee)} ({neighborhood.delivery_time}min)
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preenchido automaticamente se já for cliente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Rua, número, casa/apartamento"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preenchido automaticamente se já for cliente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  value={customerComplement}
                  onChange={(e) => setCustomerComplement(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Apartamento, bloco, referência..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preenchido automaticamente se já for cliente
                </p>
              </div>
            </div>
          )}

          {/* Pickup Scheduler (only for pickup) */}
          {deliveryType === 'pickup' && (
            <PickupScheduler
              selectedDate={scheduledPickupDate}
              selectedTime={scheduledPickupTime}
              onDateChange={setScheduledPickupDate}
              onTimeChange={setScheduledPickupTime}
            />
          )}

          {/* Push Notification Banner */}
          {customerPhone && customerPhone.replace(/\D/g, '').length >= 11 && (
            <div className="space-y-4">
              <PushNotificationBanner
                customerPhone={customerPhone.replace(/\D/g, '')}
                customerName={customerName}
                onSubscribed={(subscription) => {
                  console.log('✅ Cliente inscrito para notificações:', subscription);
                }}
              />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma de Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="money"
                  checked={paymentMethod === 'money'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-green-600"
                />
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  <span className="font-medium">Dinheiro</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="pix_entregador"
                  checked={paymentMethod === 'pix_entregador'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <div>
                    <span className="font-medium">PIX Entregador</span>
                    <p className="text-xs text-gray-500">Pagar na entrega</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="pix_online"
                  checked={paymentMethod === 'pix_online'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-green-600"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <div>
                    <span className="font-medium">PIX Online</span>
                    <p className="text-xs text-gray-500">Pagar agora</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cartao_credito"
                  checked={paymentMethod === 'cartao_credito'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-purple-600"
                />
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-purple-600" />
                  <span className="font-medium">Cartão de Crédito</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cartao_debito"
                  checked={paymentMethod === 'cartao_debito'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-indigo-600"
                />
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-indigo-600" />
                  <span className="font-medium">Cartão de Débito</span>
                </div>
              </label>
            </div>

            {paymentMethod === 'money' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Troco para quanto? (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={getFinalTotal()}
                  value={changeFor || ''}
                  onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={"Mínimo: " + formatPrice(getFinalTotal())}
                />
                {changeFor && changeFor > getFinalTotal() && (
                  <p className="text-sm text-green-600 mt-1">
                    Troco: {formatPrice(changeFor - getFinalTotal())}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === 'pix_online' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Dados para PIX Online</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Chave PIX:</strong> 85989041010</p>
                      <p><strong>Nome:</strong> Amanda Suyelen da Costa Pereira</p>
                      <p><strong>Valor:</strong> {formatPrice(getFinalTotal())}</p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Realize o PIX agora e envie o comprovante via WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'pix_entregador' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">PIX na Entrega</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Chave PIX:</strong> 85989041010</p>
                      <p><strong>Nome:</strong> Amanda Suyelen da Costa Pereira</p>
                      <p><strong>Valor:</strong> {formatPrice(getFinalTotal())}</p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Você pagará via PIX quando o entregador chegar
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Resumo do Pedido</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):</span>
                <span className="font-medium text-green-800">{formatPrice(totalPrice)}</span>
              </div>
              
              {deliveryType === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Taxa de entrega:</span>
                  <span className="font-medium text-green-800">{formatPrice(getDeliveryFee())}</span>
                </div>
              )}
              
              {deliveryType === 'pickup' && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Taxa de entrega:</span>
                  <span className="font-medium text-green-600">Grátis (retirada)</span>
                </div>
              )}
              
              <div className="border-t border-green-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-green-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">{formatPrice(getFinalTotal())}</span>
                </div>
              </div>
              
              {deliveryType === 'delivery' && customerNeighborhood && (
                <div className="text-sm text-green-700 mt-2">
                  <p>📍 Entrega em: {customerNeighborhood}</p>
                  <p>⏱️ Tempo estimado: {getEstimatedDeliveryTime()} minutos</p>
                </div>
              )}
              
              {deliveryType === 'pickup' && scheduledPickupDate && scheduledPickupTime && (
                <div className="text-sm text-green-700 mt-2">
                  <p>📅 Retirada agendada para: {new Date(scheduledPickupDate).toLocaleDateString('pt-BR')} às {scheduledPickupTime}</p>
                  <p>📍 Local: Rua Um, 1614-C – Residencial 1 – Cágado</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Finalizando...
              </>
            ) : (
              <>
                {deliveryType === 'pickup' ? <Store size={24} /> : <Truck size={24} />}
                Confirmar Pedido - {formatPrice(getFinalTotal())}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;