import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, CreditCard, Calendar, Clock, Store, Truck, AlertCircle, Gift, DollarSign, Layers, Banknote, QrCode, CheckCircle, Copy } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix_entregador' | 'cartao_credito' | 'cartao_debito' | 'misto'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [scheduledPickupDate, setScheduledPickupDate] = useState('');
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);
  const [mixedPayments, setMixedPayments] = useState<Array<{method: 'money' | 'pix_entregador' | 'cartao_credito' | 'cartao_debito', amount: number}>>([
    { method: 'money', amount: 0 }
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

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

          let fieldsUpdated: string[] = [];

          // Preencher endereço apenas se estiver vazio
          if (lastOrder.customer_address && !customerAddress.trim()) {
            setCustomerAddress(lastOrder.customer_address);
            fieldsUpdated.push('endereço');
          }
          if (lastOrder.customer_neighborhood && !customerNeighborhood.trim()) {
            setCustomerNeighborhood(lastOrder.customer_neighborhood);
            fieldsUpdated.push('bairro');
          }
          if (lastOrder.customer_complement && !customerComplement.trim()) {
            setCustomerComplement(lastOrder.customer_complement);
            fieldsUpdated.push('complemento');
          }

          // Mostrar feedback visual apenas se algum campo foi preenchido
          if (customer.name || fieldsUpdated.length > 0) {
            const fields = [];
            if (customer.name) fields.push('nome');
            fields.push(...fieldsUpdated);

            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in';
            successMessage.innerHTML = `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Preenchido automaticamente: ${fields.join(', ')}</span>
            `;
            document.body.appendChild(successMessage);

            setTimeout(() => {
              if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
              }
            }, 4000);
          }
        } else {
          // Mostrar feedback apenas com nome se não encontrou endereço
          if (customer.name) {
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
            successMessage.innerHTML = `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Nome preenchido automaticamente</span>
            `;
            document.body.appendChild(successMessage);

            setTimeout(() => {
              if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
              }
            }, 3000);
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

  const addMixedPayment = () => {
    setMixedPayments([...mixedPayments, { method: 'money', amount: 0 }]);
  };

  const removeMixedPayment = (index: number) => {
    if (mixedPayments.length > 1) {
      setMixedPayments(mixedPayments.filter((_, i) => i !== index));
    }
  };

  const updateMixedPayment = (index: number, field: 'method' | 'amount', value: any) => {
    const updated = [...mixedPayments];
    updated[index] = { ...updated[index], [field]: value };
    setMixedPayments(updated);
  };

  const getMixedPaymentTotal = () => {
    return mixedPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getMixedPaymentRemaining = () => {
    return Math.max(0, getFinalTotal() - getMixedPaymentTotal());
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'money':
        return <DollarSign size={20} className="text-green-600" />;
      case 'pix_entregador':
        return <QrCode size={20} className="text-blue-600" />;
      case 'cartao_credito':
        return <CreditCard size={20} className="text-purple-600" />;
      case 'cartao_debito':
        return <CreditCard size={20} className="text-orange-600" />;
      default:
        return <CreditCard size={20} />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'money':
        return 'Dinheiro';
      case 'pix_entregador':
        return 'PIX';
      case 'cartao_credito':
        return 'Cartão de Crédito';
      case 'cartao_debito':
        return 'Cartão de Débito';
      default:
        return method;
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

    if (paymentMethod === 'misto') {
      const total = getMixedPaymentTotal();
      if (total < getFinalTotal()) {
        alert(`O total do pagamento misto (${formatPrice(total)}) deve ser igual ou maior que o valor do pedido (${formatPrice(getFinalTotal())})`);
        return false;
      }
      if (mixedPayments.some(p => p.amount <= 0)) {
        alert('Todos os valores do pagamento misto devem ser maiores que zero');
        return false;
      }
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
      const dbPaymentMethod = paymentMethod === 'misto'
        ? 'mixed'
        : paymentMethod === 'pix_entregador'
        ? 'pix'
        : paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito'
        ? 'card'
        : paymentMethod;

      // Prepare mixed payment details and change_for
      let mixedPaymentDetailsJson = undefined;
      let finalChangeFor = undefined;

      if (paymentMethod === 'misto') {
        // For mixed payment, save payment breakdown
        mixedPaymentDetailsJson = JSON.stringify(
          mixedPayments.map(p => ({
            method: p.method === 'pix_entregador' ? 'pix' : p.method === 'cartao_credito' || p.method === 'cartao_debito' ? 'card' : p.method,
            method_display: getPaymentMethodName(p.method),
            amount: p.amount
          }))
        );

        // Calculate change if total paid is more than order total
        const totalPaid = getMixedPaymentTotal();
        if (totalPaid > getFinalTotal()) {
          finalChangeFor = totalPaid;
        }
      } else if (paymentMethod === 'money') {
        // For money payment, use the changeFor value if provided
        finalChangeFor = changeFor;
      }

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\D/g, ''),
        customer_address: deliveryType === 'delivery' ? customerAddress : '',
        customer_neighborhood: deliveryType === 'delivery' ? customerNeighborhood : '',
        customer_complement: deliveryType === 'delivery' ? customerComplement : '',
        payment_method: dbPaymentMethod,
        change_for: finalChangeFor,
        mixed_payment_details: mixedPaymentDetailsJson,
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

      // Show success modal with order details
      setOrderDetails({
        orderId: newOrder.id,
        orderNumber: newOrder.id.slice(-8),
        customerName,
        total: getFinalTotal(),
        deliveryType,
        scheduledPickupDate,
        scheduledPickupTime,
        customerAddress,
        customerNeighborhood,
        customerComplement
      });
      setShowSuccess(true);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao finalizar pedido: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingLink = () => {
    if (orderDetails) {
      const link = `${window.location.origin}/pedido/${orderDetails.orderId}`;
      navigator.clipboard.writeText(link);

      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Link copiado!';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setOrderDetails(null);
    onOrderComplete();
    onClose();
  };

  if (!isOpen) return null;

  // Success Modal
  if (showSuccess && orderDetails) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl transform animate-scale-in">
          {/* Success Header with Animation */}
          <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 sm:p-8 rounded-t-2xl text-white text-center overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-4 animate-bounce">
                  <CheckCircle size={48} className="sm:w-16 sm:h-16 text-white drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Pedido Realizado!</h2>
              <p className="text-green-100 text-base sm:text-lg">Seu pedido foi confirmado com sucesso</p>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
            <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -ml-10 sm:-ml-12 -mb-10 sm:-mb-12"></div>
          </div>

          {/* Order Details */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* Order Number */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-green-700 mb-1">Número do Pedido</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 tracking-wider">#{orderDetails.orderNumber}</p>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <User size={18} className="sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{orderDetails.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <DollarSign size={18} className="sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Valor Total</p>
                  <p className="font-semibold text-green-600 text-base sm:text-lg">{formatPrice(orderDetails.total)}</p>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
              {orderDetails.deliveryType === 'pickup' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2 sm:mb-3">
                    <Store size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Retirada no Local</span>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700 space-y-1.5 sm:space-y-1">
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                      <span className="break-words">Rua Um, 1614-C – Residencial 1 – Cágado</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{orderDetails.scheduledPickupDate ? new Date(orderDetails.scheduledPickupDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data não definida'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{orderDetails.scheduledPickupTime || 'Horário não definido'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2 sm:mb-3">
                    <Truck size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Entrega em Domicílio</span>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700 space-y-1.5 sm:space-y-1">
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{orderDetails.customerAddress}</span>
                    </p>
                    <p className="pl-5 sm:pl-6 break-words">{orderDetails.customerNeighborhood}</p>
                    {orderDetails.customerComplement && (
                      <p className="pl-5 sm:pl-6 text-blue-600 break-words">{orderDetails.customerComplement}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Link */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-semibold text-purple-800 mb-2">Acompanhe seu pedido:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/pedido/${orderDetails.orderId}`}
                  className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs sm:text-sm text-gray-600 min-w-0"
                />
                <button
                  onClick={copyTrackingLink}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium whitespace-nowrap"
                >
                  <Copy size={16} />
                  <span>Copiar Link</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-green-700 mb-1">
                📱 Dúvidas? Fale conosco no WhatsApp:
              </p>
              <a
                href="https://wa.me/5585989041010"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 font-semibold hover:text-green-700 active:text-green-800 text-sm sm:text-base inline-block"
              >
                (85) 98904-1010
              </a>
            </div>

            {/* Action Button */}
            <button
              onClick={handleSuccessClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:from-green-700 active:to-emerald-700 text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl active:shadow-md transform hover:scale-[1.02] active:scale-100"
            >
              Fechar
            </button>

            {/* Footer */}
            <p className="text-center text-xs sm:text-sm text-gray-500 pt-2">
              Elite Açaí - O melhor açaí da cidade! 🍧
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                    <span className="font-medium">PIX com entregador na maquineta</span>
                    <p className="text-xs text-gray-500">Pagar na entrega com PIX</p>
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
                  className="text-orange-600"
                />
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-orange-600" />
                  <span className="font-medium">Cartão de Débito</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors md:col-span-2">
                <input
                  type="radio"
                  name="payment"
                  value="misto"
                  checked={paymentMethod === 'misto'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-gray-600"
                />
                <div className="flex items-center gap-2">
                  <Layers size={20} className="text-gray-600" />
                  <div>
                    <span className="font-medium">Pagamento Misto</span>
                    <p className="text-xs text-gray-500">Divida entre diferentes formas</p>
                  </div>
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

            {paymentMethod === 'pix_entregador' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">PIX com Entregador na Maquineta</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Valor:</strong> {formatPrice(getFinalTotal())}</p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Você pagará via PIX na maquineta do entregador quando ele chegar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'misto' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Pagamento Misto</p>
                      <p className="text-sm text-blue-700">
                        Divida o pagamento entre diferentes formas. O total deve ser igual ou maior que {formatPrice(getFinalTotal())}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {mixedPayments.map((payment, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers size={18} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Pagamento {index + 1}
                        </span>
                        {mixedPayments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMixedPayment(index)}
                            className="ml-auto text-red-600 hover:text-red-700 text-sm"
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Forma de Pagamento
                          </label>
                          <select
                            value={payment.method}
                            onChange={(e) => updateMixedPayment(index, 'method', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="money">Dinheiro</option>
                            <option value="pix_entregador">PIX</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Valor
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={payment.amount || ''}
                            onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm">
                        {getPaymentMethodIcon(payment.method)}
                        <span className="text-gray-600">
                          {getPaymentMethodName(payment.method)}: {formatPrice(payment.amount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addMixedPayment}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
                  >
                    + Adicionar outra forma de pagamento
                  </button>
                </div>

                <div className={`border rounded-xl p-4 ${
                  getMixedPaymentRemaining() > 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                }`}>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Total a pagar:</span>
                      <span className="font-semibold text-gray-800">{formatPrice(getFinalTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Total configurado:</span>
                      <span className={`font-semibold ${getMixedPaymentTotal() >= getFinalTotal() ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(getMixedPaymentTotal())}
                      </span>
                    </div>
                    {getMixedPaymentRemaining() > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-700">Falta configurar:</span>
                          <span className="font-semibold text-red-600">{formatPrice(getMixedPaymentRemaining())}</span>
                        </div>
                        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-red-200">
                          <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-700">
                            <strong>Atenção:</strong> O valor total configurado é menor que o valor do pedido. Adicione mais {formatPrice(getMixedPaymentRemaining())} para completar o pagamento.
                          </p>
                        </div>
                      </>
                    )}
                    {getMixedPaymentTotal() > getFinalTotal() && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Troco:</span>
                        <span className="font-semibold text-green-600">{formatPrice(getMixedPaymentTotal() - getFinalTotal())}</span>
                      </div>
                    )}
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
                  <p>📅 Retirada agendada para: {new Date(scheduledPickupDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {scheduledPickupTime}</p>
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