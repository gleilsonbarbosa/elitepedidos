import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, CreditCard, Calendar, Clock, Store, Truck, AlertCircle, Gift, DollarSign } from 'lucide-react';
import { CartItem } from '../../types/cart';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useOrders } from '../../hooks/useOrders';
import { useCashback } from '../../hooks/useCashback';
import { useStoreHours } from '../../hooks/useStoreHours';
import DeliveryTypeSelector from './DeliveryTypeSelector';
import PickupScheduler from './PickupScheduler';
import CashbackButton from '../Cashback/CashbackButton';
import AISalesAssistant from './AISalesAssistant';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import PushNotificationBanner from './PushNotificationBanner';
import { useWebPush } from '../../hooks/useWebPush';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onOrderComplete: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  totalPrice,
  onOrderComplete
}) => {
  const { neighborhoods } = useNeighborhoods();
  const { createOrder } = useOrders();
  const { getCustomerByPhone, getCustomerBalance, createPurchaseTransaction, createRedemptionTransaction } = useCashback();
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
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [appliedCashback, setAppliedCashback] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);

  // Verificar se as sugestões IA estão habilitadas
  useEffect(() => {
    try {
      const aiEnabled = localStorage.getItem('ai_sales_assistant_enabled');
      if (aiEnabled !== null) {
        const enabled = JSON.parse(aiEnabled);
        setAiSuggestionsEnabled(enabled);
        setShowAISuggestions(enabled);
      } else {
        const savedSettings = localStorage.getItem('delivery_suggestions_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const enabled = settings.enabled !== false && settings.showInCheckout !== false;
          setAiSuggestionsEnabled(enabled);
          setShowAISuggestions(enabled);
        }
      }
    } catch (error) {
      console.warn('Erro ao verificar configuração de sugestões no checkout:', error);
    }
  }, []);

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
      setCustomerBalance(null);
      setAppliedCashback(0);
      setCustomerId(null);
      setShowAISuggestions(aiSuggestionsEnabled);
    }
  }, [isOpen, aiSuggestionsEnabled]);

  // Search for customer when phone changes
  useEffect(() => {
    const searchCustomer = async () => {
      if (customerPhone.length >= 11) {
        try {
          const customer = await getCustomerByPhone(customerPhone);
          if (customer) {
            setCustomerId(customer.id);
            setCustomerName(customer.name || '');
            
            // Get customer balance
            const balance = await getCustomerBalance(customer.id);
            
            // Only set balance if it's positive
            if (balance && balance.available_balance > 0) {
              setCustomerBalance(balance);
            } else {
              setCustomerBalance(null);
              setAppliedCashback(0); // Reset any applied cashback
            }
          } else {
            setCustomerId(null);
            setCustomerBalance(null);
            setAppliedCashback(0);
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
          setCustomerBalance(null);
          setAppliedCashback(0);
        }
      }
    };

    const timeoutId = setTimeout(searchCustomer, 500);
    return () => clearTimeout(timeoutId);
  }, [customerPhone, getCustomerByPhone, getCustomerBalance]);

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
    const total = totalPrice + getDeliveryFee() - appliedCashback;
    const roundedTotal = Math.round(total * 100) / 100;
    return Math.max(0, roundedTotal);
  };

  const handleApplyCashback = (amount: number) => {
    const availableBalance = customerBalance?.available_balance || 0;
    const orderTotal = totalPrice + getDeliveryFee();
    
    // Prevent applying cashback if balance is zero or negative
    if (availableBalance <= 0) {
      console.warn('⚠️ Tentativa de aplicar cashback com saldo zero/negativo:', availableBalance);
      setAppliedCashback(0);
      return;
    }
    
    // Round to 2 decimal places with consistent precision handling
    const roundedBalance = Math.round(availableBalance * 100) / 100;
    const roundedOrderTotal = Math.round(orderTotal * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Use consistent rounding for all values
    const maxAmount = Math.min(roundedBalance, roundedOrderTotal);
    const appliedAmount = Math.min(roundedAmount, maxAmount);
    
    // Final safety check
    if (appliedAmount <= 0) {
      setAppliedCashback(0);
      return;
    }
    
    setAppliedCashback(appliedAmount);
  };

  const handleRemoveCashback = () => {
    setAppliedCashback(0);
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
      // Process cashback redemption if applied (validation already done when applying)
      if (appliedCashback > 0 && customerId) {
        console.log('🎁 Processando resgate de cashback (já validado):', { customerId, appliedCashback });
        const redemptionResult = await createRedemptionTransaction(customerId, appliedCashback);
        console.log('✅ Cashback resgatado com sucesso:', redemptionResult);
      }

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

      // Create purchase transaction for cashback (5% of original total, not discounted total)
      if (customerId) {
        const purchaseAmount = totalPrice + getDeliveryFee();
        console.log('💳 Criando transação de compra para cashback:', { customerId, purchaseAmount, orderId: newOrder.id });
        const purchaseResult = await createPurchaseTransaction(customerId, purchaseAmount, newOrder.id);
        
        if (purchaseResult) {
          console.log('✅ Cashback de compra creditado:', purchaseResult);
        }
      }

      // Store customer ID for future recommendations
      if (customerId) {
        localStorage.setItem('customer_id', customerId);
      }

      // Show success message with order tracking
      const orderTrackingLink = `${window.location.origin}/pedido/${newOrder.id}`;
      
      alert(
        `🎉 Pedido realizado com sucesso!\n\n` +
        `📋 ID: ${newOrder.id.slice(-8)}\n` +
        `👤 Cliente: ${customerName}\n` +
        `💰 Total: ${formatPrice(getFinalTotal())}\n` +
        `${appliedCashback > 0 ? `🎁 Cashback usado: ${formatPrice(appliedCashback)}\n` : ''}` +
        `${deliveryType === 'pickup' 
          ? `📅 Retirada: ${new Date(scheduledPickupDate).toLocaleDateString('pt-BR')} às ${scheduledPickupTime}\n`
          : `🚚 Entrega: ${getEstimatedDeliveryTime()} minutos\n`
        }` +
        `\n🔗 Acompanhe seu pedido:\n${orderTrackingLink}\n\n` +
        `Você receberá atualizações por WhatsApp!`
      );

      onOrderComplete();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Fix malformed currency in error messages - improved regex
      const currencyMatch = errorMessage.match(/R\$\s*(-?[\d.,]+)(?:\.2f|f)?/);
      if (currencyMatch) {
        // Clean the numeric value and parse it
        const cleanValue = currencyMatch[1].replace(/[^\d.,-]/g, '').replace(',', '.');
        const numericValue = parseFloat(cleanValue);
        if (!isNaN(numericValue)) {
          const formattedCurrency = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(numericValue);
          errorMessage = errorMessage.replace(/R\$\s*-?[\d.,]+(?:\.2f|f)?/, formattedCurrency);
        }
      }
      
      // Also fix patterns like "-R$ 18,91f"
      const negativeMatch = errorMessage.match(/-R\$\s*([\d.,]+)f?/);
      if (negativeMatch) {
        const cleanValue = negativeMatch[1].replace(',', '.');
        const numericValue = parseFloat(cleanValue);
        if (!isNaN(numericValue)) {
          const formattedCurrency = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(-numericValue);
          errorMessage = errorMessage.replace(/-R\$\s*[\d.,]+f?/, formattedCurrency);
        }
      }
      
      // Fix patterns like "R$ -18.1105500000000002.2f"
      const precisionMatch = errorMessage.match(/R\$\s*(-?[\d.]+\d{10,})(?:\.2f)?/);
      if (precisionMatch) {
        const numericValue = parseFloat(precisionMatch[1]);
        if (!isNaN(numericValue)) {
          const formattedCurrency = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(numericValue);
          errorMessage = errorMessage.replace(/R\$\s*-?[\d.]+\d{10,}(?:\.2f)?/, formattedCurrency);
        }
      }
      
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(85) 99999-9999"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Usado para atualizações do pedido via WhatsApp
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
              </div>
            </div>
          )}

          {/* Cashback Section */}

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

          {/* AI Sales Assistant */}
          {showAISuggestions && aiSuggestionsEnabled && items.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">🤖 Sugestões Personalizadas</h3>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Ocultar sugestões"
                >
                  <X size={16} />
                </button>
              </div>
              
              <AISalesAssistant
                cartItems={items}
                availableProducts={availableProducts.map(dbProduct => ({
                  id: dbProduct.id,
                  name: dbProduct.name,
                  category: dbProduct.category as any,
                  price: dbProduct.price,
                  originalPrice: dbProduct.original_price,
                  description: dbProduct.description,
                  image: dbProduct.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
                  isActive: dbProduct.is_active,
                  complementGroups: dbProduct.complement_groups || [],
                  sizes: dbProduct.sizes || []
                }))}
                onAddSuggestion={(product, reason) => {
                  // Close suggestions after adding
                  setShowAISuggestions(false);
                  
                  // Show notification that user should add via main menu
                  const suggestionMessage = document.createElement('div');
                  suggestionMessage.className = 'fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
                  suggestionMessage.innerHTML = `
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <p class="font-medium text-sm">💡 Sugestão da IA</p>
                        <p class="text-xs opacity-90 mt-1">Volte ao cardápio para adicionar <strong>${product.name}</strong></p>
                        <p class="text-xs opacity-75 mt-1">${reason.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(suggestionMessage);
                  
                  setTimeout(() => {
                    if (document.body.contains(suggestionMessage)) {
                      document.body.removeChild(suggestionMessage);
                    }
                  }, 6000);
                }}
              />
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

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma de Pagamento</h3>
            
            <div className="space-y-3">
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
                  placeholder={`Mínimo: ${formatPrice(getFinalTotal())}`}
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
              
              {appliedCashback > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Desconto (Cashback):</span>
                  <span className="font-medium text-purple-600">-{formatPrice(appliedCashback)}</span>
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