import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, CreditCard, ShoppingCart, Check, AlertCircle, Gift } from 'lucide-react';
import { CartItem } from '../../types/cart';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useCashback } from '../../hooks/useCashback';
import { useOrders } from '../../hooks/useOrders';
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
  const [step, setStep] = useState<'customer' | 'delivery' | 'payment' | 'review'>('customer');
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    complement: ''
  });
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix' | 'card'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [appliedCashback, setAppliedCashback] = useState(0);

  const { neighborhoods } = useNeighborhoods();
  const { getCustomerByPhone, getCustomerBalance, createPurchaseTransaction, createRedemptionTransaction } = useCashback();
  const { createOrder } = useOrders();

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
      if (customerData.phone.length >= 11) {
        try {
          const customer = await getCustomerByPhone(customerData.phone);
          if (customer) {
            const balance = await getCustomerBalance(customer.id);
            setCustomerBalance(balance);
          } else {
            setCustomerBalance(null);
          }
        } catch (error) {
          console.error('Erro ao carregar saldo:', error);
          setCustomerBalance(null);
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
      // Create order data
      const orderData = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_address: customerData.address,
        customer_neighborhood: selectedNeighborhood,
        customer_complement: customerData.complement,
        payment_method: paymentMethod,
        change_for: changeFor,
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
        delivery_fee: getDeliveryFee(),
        estimated_delivery_minutes: getEstimatedTime(),
        status: 'pending' as const,
        channel: 'delivery'
      };

      // Create the order
      const order = await createOrder(orderData);

      // Handle cashback transactions
      if (customerBalance) {
        // Create purchase transaction (earn cashback)
        await createPurchaseTransaction(
          customerBalance.customer_id,
          getFinalTotal(),
          order.id
        );

        // Create redemption transaction if cashback was used
        if (appliedCashback > 0) {
          await createRedemptionTransaction(
            customerBalance.customer_id,
            appliedCashback,
            order.id
          );
        }
      }

      // Show success and redirect to tracking
      alert(`Pedido criado com sucesso! ID: ${order.id.slice(-8)}`);
      window.location.href = `/pedido/${order.id}`;
      
      onOrderComplete();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (step) {
      case 'customer':
        return customerData.name.trim() && customerData.phone.length >= 11;
      case 'delivery':
        return customerData.address.trim() && selectedNeighborhood;
      case 'payment':
        return paymentMethod && (paymentMethod !== 'money' || !changeFor || changeFor >= getFinalTotal());
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const steps = ['customer', 'delivery', 'payment', 'review'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = ['customer', 'delivery', 'payment', 'review'] as const;
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
            {['customer', 'delivery', 'payment', 'review'].map((stepName, index) => {
              const stepLabels = ['Dados', 'Entrega', 'Pagamento', 'Revisar'];
              const currentIndex = ['customer', 'delivery', 'payment', 'review'].indexOf(step);
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
                    value={customerData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                      setCustomerData(prev => ({ ...prev, phone: formatted }));
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(85) 99999-9999"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Usado para contato e cashback
                </p>
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
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Taxa de entrega:</span>
                    <span className="font-semibold text-blue-800">{formatPrice(getDeliveryFee())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Tempo estimado:</span>
                    <span className="font-semibold text-blue-800">{getEstimatedTime()} minutos</span>
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
                    value="pix"
                    checked={paymentMethod === 'pix'}
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
                      <span className="font-medium">PIX</span>
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
                    Finalizar Pedido
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