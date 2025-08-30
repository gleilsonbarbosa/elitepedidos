import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, CreditCard, ShoppingCart, Check, AlertCircle, Gift } from 'lucide-react';
import { CartItem } from '../../types/cart';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useCashback } from '../../hooks/useCashback';
import { useOrders } from '../../hooks/useOrders';
import { supabase } from '../../lib/supabase';
import CashbackButton from '../Cashback/CashbackButton';

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
  const [step, setStep] = useState<'customer' | 'register' | 'delivery' | 'payment' | 'review'>('customer');
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    complement: ''
  });
  const [registrationData, setRegistrationData] = useState({
    email: '',
    dateOfBirth: '',
    whatsappConsent: true
  });
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix_entregador' | 'pix_online' | 'card'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [appliedCashback, setAppliedCashback] = useState(0);

  const { neighborhoods } = useNeighborhoods();
  const { getCustomerByPhone, getCustomerBalance, createPurchaseTransaction, createRedemptionTransaction, loading: cashbackLoading } = useCashback();
  const { createOrder } = useOrders();

  const validateName = (name: string) => {
    if (!name.trim()) return false;
    if (name.trim().length < 2) return false;
    // Verificar se contém números
    if (/\d/.test(name)) return false;
    return true;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDeliveryFee = () => {
    const neighborhood = neighborhoods.find(n => n.name === selectedNeighborhood);
    return neighborhood ? neighborhood.delivery_fee : 0;
  };

  const getEstimatedTime = () => {
    const neighborhood = neighborhoods.find(n => n.name === selectedNeighborhood);
    return neighborhood ? neighborhood.delivery_time : 50;
  };

  const getFinalTotal = () => {
    return totalPrice + getDeliveryFee() - appliedCashback;
  };

  // Load customer balance when phone changes
  useEffect(() => {
    const loadCustomerBalance = async () => {
      const phoneNumbers = customerData.phone.replace(/\D/g, '');
      if (phoneNumbers.length >= 11) {
        setCheckingCustomer(true);
        try {
          console.log('🔍 Buscando cliente por telefone:', phoneNumbers);
          const customer = await getCustomerByPhone(phoneNumbers);
          if (customer) {
            console.log('✅ Cliente encontrado:', customer);
            setIsFirstOrder(false);
            const balance = await getCustomerBalance(customer.id);
            console.log('💰 Saldo do cliente:', balance);
            
            // Garantir que o saldo seja sempre positivo ou zero
            if (balance) {
              balance.available_balance = Math.max(0, balance.available_balance);
            }
            
            setCustomerBalance(balance);
          } else {
            console.log('ℹ️ Cliente não encontrado - primeiro pedido');
            setIsFirstOrder(true);
            setCustomerBalance(null);
          }
        } catch (error) {
          console.error('Erro ao carregar saldo:', error);
          setIsFirstOrder(false);
          setCustomerBalance(null);
        } finally {
          setCheckingCustomer(false);
        }
      }
    };

    const timeoutId = setTimeout(loadCustomerBalance, 500);
    return () => clearTimeout(timeoutId);
  }, [customerData.phone, getCustomerByPhone, getCustomerBalance]);

  const handleApplyCashback = (amount: number) => {
    setAppliedCashback(amount);
  };

  const handleRemoveCashback = () => {
    setAppliedCashback(0);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    
    try {
      // Validações robustas dos dados
      if (!validateName(customerData.name)) {
        if (!customerData.name || customerData.name.trim().length < 2) {
          throw new Error('Nome deve ter pelo menos 2 caracteres');
        }
        if (/\d/.test(customerData.name)) {
          throw new Error('Nome não pode conter números');
        }
        throw new Error('Nome inválido');
      }
      
      if (!customerData.phone || customerData.phone.replace(/\D/g, '').length !== 11) {
        throw new Error('Telefone deve ter 11 dígitos (DDD + número)');
      }
      
      if (!customerData.address || customerData.address.trim().length < 10) {
        throw new Error('Endereço deve ter pelo menos 10 caracteres');
      }
      
      if (!selectedNeighborhood || selectedNeighborhood.trim().length === 0) {
        throw new Error('Bairro é obrigatório para entrega');
      }
      
      if (!paymentMethod) {
        throw new Error('Forma de pagamento é obrigatória');
      }
      
      if (paymentMethod === 'money' && changeFor && changeFor < getFinalTotal()) {
        throw new Error('Valor para troco deve ser maior que o total da compra');
      }
      
      if (items.length === 0) {
        throw new Error('Carrinho está vazio. Adicione produtos antes de finalizar');
      }
      
      const finalTotal = getFinalTotal();
      if (finalTotal <= 0) {
        throw new Error('Total do pedido deve ser maior que zero');
      }
      
      // Validar se o bairro existe na lista
      const neighborhoodExists = neighborhoods.some(n => n.name === selectedNeighborhood);
      if (!neighborhoodExists) {
        throw new Error('Bairro selecionado não é válido para entrega');
      }
      
      // Validar cadastro de novo cliente se necessário
      if (isFirstOrder) {
        if (registrationData.email && registrationData.email.trim() && 
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
          throw new Error('E-mail inválido');
        }
        
        if (registrationData.dateOfBirth && registrationData.dateOfBirth.trim()) {
          const birthDate = new Date(registrationData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          if (age < 0 || age > 120) {
            throw new Error('Data de nascimento inválida');
          }
        }
      }
      
      // Validate required data
      console.log('✅ Todas as validações passaram, criando pedido...');
      
      // Create customer if it's first order
      let customerId = customerBalance?.customer_id;
      
      if (isFirstOrder) {
        console.log('👤 Criando novo cliente:', {
          name: customerData.name,
          phone: customerData.phone.replace(/\D/g, ''),
          email: registrationData.email,
          dateOfBirth: registrationData.dateOfBirth,
          whatsappConsent: registrationData.whatsappConsent
        });
        
        try {
          const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert([{
              name: customerData.name,
              phone: customerData.phone.replace(/\D/g, ''),
              email: registrationData.email || null,
              date_of_birth: registrationData.dateOfBirth || null,
              whatsapp_consent: registrationData.whatsappConsent,
              balance: 0
            }])
            .select()
            .single();

          if (error) {
            console.error('❌ Erro ao criar cliente:', error);
            // Continue without customer registration if it fails
          } else {
            console.log('✅ Novo cliente criado:', newCustomer);
            customerId = newCustomer.id;
            
            // Load balance for the new customer
            const balance = await getCustomerBalance(newCustomer.id);
            setCustomerBalance(balance);
          }
        } catch (error) {
          console.error('❌ Erro na criação do cliente:', error);
          // Continue without customer registration
        }
      }
      
      // Map payment methods to database-compatible values
      const dbPaymentMethod = paymentMethod === 'pix_entregador' || paymentMethod === 'pix_online' ? 'pix' : paymentMethod;
      
      // Create order data
      const orderData = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_address: customerData.address,
        customer_neighborhood: selectedNeighborhood,
        customer_complement: customerData.complement,
        customer_id: customerId,
        payment_method: dbPaymentMethod,
        change_for: changeFor,
        items: items.filter(item => item && item.product).map(item => ({
          product_name: item.product.name,
          product_image: item.product.image,
          selected_size: item.selectedSize?.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.totalPrice,
          observations: item.observations,
          complements: (item.selectedComplements || []).map(sc => ({
            name: sc.complement.name,
            price: sc.complement.price
          }))
        })),
        total_price: getFinalTotal(),
        delivery_fee: getDeliveryFee(),
        estimated_delivery_minutes: getEstimatedTime(),
        status: 'pending' as const,
        channel: 'delivery'
      };

      // Create the order
      const order = await createOrder(orderData);
      
      if (!order || !order.id) {
        throw new Error('Falha ao criar pedido: dados inválidos retornados');
      }

      // Handle cashback transactions
      if (customerId) {
        // Re-fetch customer balance to ensure it's current
        const currentBalance = await getCustomerBalance(customerId);
        
        // Check if applied cashback is still valid
        if (appliedCashback > 0) {
          const availableBalance = currentBalance?.available_balance || 0;
          if (appliedCashback > availableBalance) {
            // Reset applied cashback and inform user
            setAppliedCashback(0);
            throw new Error(`Saldo de cashback insuficiente. Saldo atual: ${formatPrice(availableBalance)}`);
          }
        }

        // Create purchase transaction (earn cashback)
        await createPurchaseTransaction(
          customerId,
          getFinalTotal(),
          order.id
        );

        // Create redemption transaction if cashback was used
        if (appliedCashback > 0) {
          await createRedemptionTransaction(
            customerId,
            appliedCashback,
            order.id
          );
        }
      }

      // Show success message with options
      const success = confirm(
        `🎉 Pedido criado com sucesso!\n\n` +
        `📋 ID: ${order.id.slice(-8)}\n` +
        `👤 Cliente: ${customerData.name}\n` +
        `💰 Total: ${formatPrice(getFinalTotal())}\n\n` +
        `🔗 Link de acompanhamento:\n` +
        `${window.location.origin}/pedido/${order.id}\n\n` +
        `Deseja fazer um novo pedido?\n\n` +
        `• OK = Fazer novo pedido\n` +
        `• Cancelar = Acompanhar este pedido`
      );
      
      if (success) {
        // Reset form for new order
        setStep('customer');
        setCustomerData({
          name: '',
          phone: '',
          address: '',
          complement: ''
        });
        setRegistrationData({
          email: '',
          dateOfBirth: '',
          whatsappConsent: true
        });
        setIsFirstOrder(false);
        setSelectedNeighborhood('');
        setPaymentMethod('money');
        setChangeFor(undefined);
        setAppliedCashback(0);
        setCustomerBalance(null);
        
        // Clear cart
        onOrderComplete();
        
        // Keep modal open for new order
        return;
      } else {
        // Redirect to tracking
        window.location.href = `/pedido/${order.id}`;
        onOrderComplete();
      }
      // Show simple success message
      alert(
        `🎉 Pedido criado com sucesso!\n\n` +
        `📋 ID: ${order.id.slice(-8)}\n` +
        `👤 Cliente: ${customerData.name}\n` +
        `💰 Total: ${formatPrice(getFinalTotal())}\n\n` +
        `🔗 Você será redirecionado para acompanhar seu pedido!\n\n` +
        `Obrigado pela preferência! 😊`
      );
      
      // Clear cart and close modal
      onOrderComplete();
      
      // Redirect directly to order tracking
      window.location.href = `/pedido/${order.id}`;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert(`Erro ao criar pedido: ${error instanceof Error ? error.message : 'Tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (step) {
      case 'customer':
        const nameValid = validateName(customerData.name);
        const phoneValid = customerData.phone.replace(/\D/g, '').length === 11;
        return nameValid && phoneValid;
      case 'register':
        // Validar campos de cadastro se preenchidos
        if (registrationData.email.trim() && 
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
          return false;
        }
        
        if (registrationData.dateOfBirth.trim()) {
          const birthDate = new Date(registrationData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          if (age < 0 || age > 120) {
            return false;
          }
        }
        
        return true;
      case 'delivery':
        const addressValid = customerData.address.trim().length >= 10;
        const neighborhoodValid = selectedNeighborhood && 
          neighborhoods.some(n => n.name === selectedNeighborhood);
        return addressValid && neighborhoodValid;
      case 'payment':
        if (!paymentMethod) return false;
        if (paymentMethod === 'money' && changeFor && changeFor < getFinalTotal()) {
          return false;
        }
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    // Skip registration step if not first order
    const steps = isFirstOrder 
      ? ['customer', 'register', 'delivery', 'payment', 'review'] as const
      : ['customer', 'delivery', 'payment', 'review'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    // Skip registration step if not first order
    const steps = isFirstOrder 
      ? ['customer', 'register', 'delivery', 'payment', 'review'] as const
      : ['customer', 'delivery', 'payment', 'review'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-green-500 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Finalizar Pedido</h2>
                <p className="text-white/80 text-sm">
                  {step === 'customer' && 'Seus dados'}
                  {step === 'delivery' && 'Endereço de entrega'}
                  {step === 'payment' && 'Forma de pagamento'}
                  {step === 'review' && 'Revisar pedido'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            {(isFirstOrder 
              ? ['customer', 'register', 'delivery', 'payment', 'review']
              : ['customer', 'delivery', 'payment', 'review']
            ).map((stepName, index) => {
              const stepLabels = isFirstOrder 
                ? ['Dados', 'Cadastro', 'Entrega', 'Pagamento', 'Revisar']
                : ['Dados', 'Entrega', 'Pagamento', 'Revisar'];
              const allSteps = isFirstOrder 
                ? ['customer', 'register', 'delivery', 'payment', 'review']
                : ['customer', 'delivery', 'payment', 'review'];
              const currentIndex = allSteps.indexOf(step);
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-purple-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? <Check size={16} /> : index + 1}
                  </div>
                  <span className={`ml-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
                    {stepLabels[index]}
                  </span>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 'customer' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Seus Dados</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Seu nome completo"
                    required
                    minLength={2}
                  />
                </div>
                {customerData.name.trim() && !validateName(customerData.name) && (
                  <p className="text-xs text-red-600 mt-1">
                    {customerData.name.trim().length < 2 
                      ? 'Nome deve ter pelo menos 2 caracteres'
                      : /\d/.test(customerData.name) 
                        ? 'Nome não pode conter números'
                        : 'Nome inválido'
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                      setCustomerData(prev => ({ ...prev, phone: formatted }));
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(85) 99999-9999"
                    required
                    minLength={15}
                    maxLength={15}
                  />
                </div>
                {customerData.phone && customerData.phone.replace(/\D/g, '').length > 0 && customerData.phone.replace(/\D/g, '').length !== 11 && (
                  <p className="text-xs text-red-600 mt-1">
                    Telefone deve ter 11 dígitos (DDD + 9 dígitos)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Usado para contato e cashback
                </p>
                {checkingCustomer && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Verificando cliente...
                  </div>
                )}
                {isFirstOrder && customerData.phone.length >= 11 && !checkingCustomer && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <div>
                        <p className="text-green-800 font-medium text-sm">🎉 Bem-vindo à Elite Açaí!</p>
                        <p className="text-green-700 text-sm">Primeiro pedido detectado. Complete seu cadastro para ganhar cashback!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cashback Display */}
              {customerBalance && customerBalance.available_balance > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={18} className="text-purple-600" />
                    <h4 className="font-medium text-purple-800">Seu Cashback</h4>
                  </div>
                  <p className="text-purple-700 text-sm mb-3">
                    Você tem {formatPrice(customerBalance.available_balance)} disponível!
                  </p>
                  <CashbackButton
                    availableBalance={customerBalance.available_balance}
                    onApplyCashback={handleApplyCashback}
                    onRemoveCashback={handleRemoveCashback}
                    appliedAmount={appliedCashback}
                    maxAmount={totalPrice + getDeliveryFee()}
                  />
                </div>
              )}
              
            </div>
          )}

          {step === 'register' && isFirstOrder && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-green-800">Complete seu cadastro</h3>
                    <p className="text-green-700 text-sm">Ganhe vantagens exclusivas!</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Adicionais</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="seu@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para receber promoções e ofertas especiais
                </p>
                {registrationData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email) && (
                  <p className="text-xs text-red-600 mt-1">
                    Formato de e-mail inválido
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento (opcional)
                </label>
                <input
                  type="date"
                  value={registrationData.dateOfBirth}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para ofertas especiais de aniversário
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={registrationData.whatsappConsent}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, whatsappConsent: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-blue-800">
                      Aceito receber notificações via WhatsApp
                    </span>
                    <p className="text-blue-700 text-xs mt-1">
                      Status do pedido, promoções e ofertas especiais
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Gift size={18} />
                  Vantagens do seu cadastro
                </h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>5% de cashback em todos os pedidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Promoções exclusivas por WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Ofertas especiais de aniversário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Histórico de pedidos sempre disponível</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 'delivery' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Endereço de Entrega</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço completo *
                </label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    value={customerData.address}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    placeholder="Rua, número, referências..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  value={customerData.complement}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, complement: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Apartamento, bloco, ponto de referência..."
                />
              </div>

              {selectedNeighborhood && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Resumo da Entrega</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Taxa de entrega:</span>
                    <span className="font-semibold text-blue-800">{formatPrice(getDeliveryFee())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Tempo estimado:</span>
                    <span className="font-semibold text-blue-800">{getEstimatedTime()} minutos</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                    <span className="text-blue-700">Total com entrega:</span>
                    <span className="font-bold text-blue-900">{formatPrice(totalPrice + getDeliveryFee())}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && (
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
                    <div className="bg-green-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm7-5a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4a2 2 0 012-2h8z" />
                      </svg>
                    </div>
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
                    <div className="bg-blue-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
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
                    <div className="bg-green-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium">PIX Online</span>
                      <p className="text-xs text-gray-500">Chave: 85989041010</p>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="text-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 rounded-full p-2">
                      <CreditCard size={20} className="text-purple-600" />
                    </div>
                    <span className="font-medium">Cartão (Crédito/Débito)</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'money' && (
                <div className="mt-4">
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
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revisar Pedido</h3>
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-3">Resumo do Pedido</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.length} produto(s)):</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>{formatPrice(getDeliveryFee())}</span>
                  </div>
                  {appliedCashback > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Cashback aplicado:</span>
                      <span>-{formatPrice(appliedCashback)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">{formatPrice(getFinalTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cashback section in review */}
              {customerBalance && customerBalance.available_balance > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={18} className="text-purple-600" />
                    <h4 className="font-medium text-purple-800">Cashback Disponível</h4>
                  </div>
                  <p className="text-purple-700 text-sm mb-3">
                    Saldo: {formatPrice(customerBalance.available_balance)}
                  </p>
                  <CashbackButton
                    availableBalance={customerBalance.available_balance}
                    onApplyCashback={handleApplyCashback}
                    onRemoveCashback={handleRemoveCashback}
                    appliedAmount={appliedCashback}
                    maxAmount={totalPrice + getDeliveryFee()}
                  />
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-3">Dados de Entrega</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Nome:</strong> {customerData.name}</p>
                  <p><strong>Telefone:</strong> {customerData.phone}</p>
                  <p><strong>Endereço:</strong> {customerData.address}</p>
                  <p><strong>Bairro:</strong> {selectedNeighborhood}</p>
                  {customerData.complement && <p><strong>Complemento:</strong> {customerData.complement}</p>}
                  <p><strong>Pagamento:</strong> {
                    paymentMethod === 'money' ? 'Dinheiro' :
                    paymentMethod === 'pix' ? 'PIX' : 'Cartão'
                  }</p>
                  {changeFor && <p><strong>Troco para:</strong> {formatPrice(changeFor)}</p>}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Itens do Pedido</h4>
                {items.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 text-sm">{item.product.name}</h5>
                        {item.selectedSize && (
                          <p className="text-xs text-gray-600">Tamanho: {item.selectedSize.name}</p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600">Qtd: {item.quantity}</span>
                          <span className="font-medium text-green-600">{formatPrice(item.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {paymentMethod === 'pix_entregador' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">PIX Entregador Selecionado</p>
                  <p className="text-sm text-blue-700">
                    Você pagará via PIX diretamente ao entregador na hora da entrega.
                  </p>
                  <p className="text-sm text-blue-700 font-medium">
                    Chave PIX: 85989041010
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {paymentMethod === 'pix_online' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">PIX Online Selecionado</p>
                  <p className="text-sm text-green-700">
                    Faça o PIX agora e envie o comprovante via WhatsApp.
                  </p>
                  <div className="mt-2 p-2 bg-white rounded border border-green-200">
                    <p className="text-sm font-bold text-green-800">Chave PIX: 85989041010</p>
                    <p className="text-sm text-green-700">Nome: Amanda Suyelen da Costa Pereira</p>
                    <p className="text-sm font-bold text-green-800">Valor: {formatPrice(getFinalTotal())}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between gap-3">
            {step !== 'customer' && (
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
              >
                Voltar
              </button>
            )}
            
            {step !== 'review' ? (
              <button
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Finalizar Pedido - {formatPrice(getFinalTotal())} ({
                      paymentMethod === 'money' ? 'Dinheiro' :
                      paymentMethod === 'pix_entregador' ? 'PIX Entregador' :
                      paymentMethod === 'pix_online' ? 'PIX Online' :
                      'Cartão'
                    })
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;