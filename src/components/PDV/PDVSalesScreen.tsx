import React, { useState, useEffect, useRef } from 'react';
import { usePDVProducts, usePDVSales, usePDVCart } from '../../hooks/usePDV';
import { usePermissions } from '../../hooks/usePermissions';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useCashback } from '../../hooks/useCashback';
import PermissionGuard from '../PermissionGuard';
import { PesagemModal } from './PesagemModal';
import PaymentModal from '../Delivery/PaymentModal';
import DiscountModal from '../Delivery/DiscountModal';
import SplitModal from '../Delivery/SplitModal';
import SalePrintView from './SalePrintView';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator, 
  CreditCard, 
  Gift, 
  Users, 
  Printer,
  Scale,
  Package,
  DollarSign,
  AlertCircle,
  Check,
  X,
  Phone
} from 'lucide-react';
import { PDVProduct, PDVCartItem, PDVOperator } from '../../types/pdv';

interface PDVSalesScreenProps {
  operator?: PDVOperator;
  scaleHook?: any;
  storeSettings?: any;
  isAdmin?: boolean;
}

const PDVSalesScreen: React.FC<PDVSalesScreenProps> = ({ operator, scaleHook, storeSettings, isAdmin = false }) => {
  const { hasPermission } = usePermissions(operator);
  const { products, loading: productsLoading, searchProducts } = usePDVProducts();
  const { createSale, loading: salesLoading } = usePDVSales();
  const { isOpen: isCashRegisterOpen, currentRegister } = usePDVCashRegister();
  const { getCustomerByPhone, getCustomerBalance, createPurchaseTransaction, createRedemptionTransaction } = useCashback();
  const {
    items,
    discount,
    paymentInfo,
    splitInfo,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemWeight,
    applyItemDiscount,
    setDiscount,
    updatePaymentInfo,
    updateSplitInfo,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal
  } = usePDVCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [debugMode, setDebugMode] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showPesagemModal, setShowPesagemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PDVProduct | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [mixedPayments, setMixedPayments] = useState<Array<{
    method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher';
    amount: number;
  }>>([]);
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [appliedCashback, setAppliedCashback] = useState(0);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

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

  // Search for customer when phone changes
  useEffect(() => {
    const searchCustomer = async () => {
      if (customerPhone.length >= 11) {
        try {
          const foundCustomer = await getCustomerByPhone(customerPhone);
          if (foundCustomer) {
            setIsNewCustomer(false);
            setCustomer(foundCustomer);
            setCustomerName(foundCustomer.name || '');
            
            // Get customer balance
            const balance = await getCustomerBalance(foundCustomer.id);
            setCustomerBalance(balance);
          } else {
            setIsNewCustomer(true);
            setCustomer(null);
            setCustomerBalance(null);
            setCustomerName(''); // Clear name for new customer
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
          setIsNewCustomer(false);
          setCustomer(null);
          setCustomerBalance(null);
        }
      } else {
        setIsNewCustomer(false);
        setCustomer(null);
        setCustomerBalance(null);
        setCustomerName('');
      }
    };

    const timeoutId = setTimeout(searchCustomer, 500);
    return () => clearTimeout(timeoutId);
  }, [customerPhone, getCustomerByPhone, getCustomerBalance, updatePaymentInfo]);

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm ? searchProducts(searchTerm) : products;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [products, searchProducts, searchTerm, selectedCategory]);

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'acai', label: 'Açaí' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleAddProduct = (product: PDVProduct) => {
    if (product.is_weighable) {
      setSelectedProduct(product);
      setShowPesagemModal(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleWeightConfirm = (weightInGrams: number) => {
    if (selectedProduct) {
      const weightInKg = weightInGrams / 1000;
      addItem(selectedProduct, 1, weightInKg);
      setShowPesagemModal(false);
      setSelectedProduct(null);
    }
  };

  const handlePayment = (method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto', changeFor?: number) => {
    if (method === 'misto') {
      setShowMixedPaymentModal(true);
    } else {
      updatePaymentInfo({ method, changeFor });
      setShowPaymentModal(false);
    }
  };

  const handleMixedPaymentConfirm = () => {
    const totalMixed = mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const orderTotal = getTotal();
    
    if (Math.abs(totalMixed - orderTotal) > 0.01) {
      alert(`Erro: Total dos pagamentos (${formatPrice(totalMixed)}) não confere com o total da venda (${formatPrice(orderTotal)})`);
      return;
    }

    updatePaymentInfo({ 
      method: 'misto',
      mixedPayments: mixedPayments
    });
    setShowMixedPaymentModal(false);
    setShowPaymentModal(false);
  };

  const addMixedPayment = () => {
    const remaining = getTotal() - mixedPayments.reduce((sum, p) => sum + p.amount, 0);
    if (remaining > 0) {
      setMixedPayments(prev => [...prev, {
        method: 'dinheiro',
        amount: remaining
      }]);
    }
  };

  const updateMixedPayment = (index: number, field: 'method' | 'amount', value: any) => {
    setMixedPayments(prev => prev.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    ));
  };

  const removeMixedPayment = (index: number) => {
    setMixedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDiscount = (type: 'percentage' | 'amount', value: number) => {
    setDiscount({ type, value });
    setShowDiscountModal(false);
  };

  const handleSplit = (splitData: { parts: number; amounts: number[] }) => {
    updateSplitInfo({
      enabled: true,
      parts: splitData.parts,
      amounts: splitData.amounts
    });
    setShowSplitModal(false);
  };

  const handleApplyCashback = (amount: number) => {
    const availableBalance = customerBalance?.available_balance || 0;
    const orderTotal = getTotal();
    
    // Round to 2 decimal places with consistent precision handling
    const roundedBalance = Math.round(availableBalance * 100) / 100;
    const roundedOrderTotal = Math.round(orderTotal * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Use consistent rounding for all values
    const maxAmount = Math.min(roundedBalance, roundedOrderTotal);
    const appliedAmount = Math.min(roundedAmount, maxAmount);
    
    setAppliedCashback(appliedAmount);
  };

  const handleRemoveCashback = () => {
    setAppliedCashback(0);
  };

  const getFinalTotal = () => {
    const total = getTotal() - appliedCashback;
    return Math.max(0, Math.round(total * 100) / 100);
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

  const handleFinalizeSale = async () => {
    if (items.length === 0) {
      alert('Adicione pelo menos um item à venda');
      return;
    }

    if (!isCashRegisterOpen || !currentRegister) {
      alert('Não há caixa aberto. Por favor, abra o caixa antes de realizar vendas.');
      return;
    }

    if (!operator?.id) {
      alert('Erro: Operador não identificado. Faça login novamente.');
      return;
    }

    if (paymentInfo.method === 'misto' && (!paymentInfo.mixedPayments || paymentInfo.mixedPayments.length === 0)) {
      alert('Configure as formas de pagamento misto');
      setShowMixedPaymentModal(true);
      return;
    }

    try {
      // Process cashback if applied
      if (appliedCashback > 0 && customer) {
        console.log('🎁 Processando resgate de cashback:', { customerId: customer.id, appliedCashback });
        await createRedemptionTransaction(customer.id, appliedCashback);
      }
      
      // Create or update customer for cashback
      let finalCustomerId = customer?.id;
      
      if (!finalCustomerId && customerPhone.length >= 11) {
        // Create new customer if phone is provided but customer doesn't exist
        try {
          console.log('👤 Criando novo cliente para cashback:', { phone: customerPhone, name: customerName });
          
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert([{
              phone: customerPhone.replace(/\D/g, ''),
              name: customerName.trim() || null,
              balance: 0
            }])
            .select()
            .single();
          
          if (createError) {
            console.error('❌ Erro ao criar cliente:', createError);
          } else {
            console.log('✅ Novo cliente criado:', newCustomer);
            finalCustomerId = newCustomer.id;
            setCustomer(newCustomer);
          }
        } catch (error) {
          console.error('❌ Erro ao criar cliente:', error);
        }
      } else if (finalCustomerId && customerName.trim() && customerName !== customer?.name) {
        // Update customer name if it was provided/changed
        try {
          console.log('📝 Atualizando nome do cliente:', { customerId: finalCustomerId, newName: customerName });
          
          const { error: updateError } = await supabase
            .from('customers')
            .update({ name: customerName.trim() })
            .eq('id', finalCustomerId);
          
          if (updateError) {
            console.error('❌ Erro ao atualizar nome do cliente:', updateError);
          } else {
            console.log('✅ Nome do cliente atualizado');
          }
        } catch (error) {
          console.error('❌ Erro ao atualizar cliente:', error);
        }
      }
      
      // Create sale data
      const saleData = {
        operator_id: operator?.id,
        customer_name: customerName.trim() || paymentInfo.customerName,
        customer_phone: customerPhone.replace(/\D/g, '') || paymentInfo.customerPhone,
        subtotal: getSubtotal(),
        discount_amount: getDiscountAmount(),
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        total_amount: getFinalTotal(),
        payment_type: paymentInfo.method,
        payment_details: paymentInfo.method === 'misto' ? {
          mixed_payments: paymentInfo.mixedPayments
        } : undefined,
        change_amount: paymentInfo.changeFor ? Math.max(0, paymentInfo.changeFor - getTotal()) : 0,
        notes: '',
        is_cancelled: false
      };

      const saleItems = items.filter(item => item && item.product && item.product.id).map(item => ({
        product_id: item.product.id,
        product_code: item.product.code,
        product_name: item.product.name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.product.unit_price,
        price_per_gram: item.product.price_per_gram,
        discount_amount: item.discount || 0,
        subtotal: item.subtotal
      }));

      if (saleItems.length === 0) {
        throw new Error('Nenhum item válido encontrado para a venda');
      }

      const createdSale = await createSale(saleData, saleItems);
      
      if (!createdSale) {
        throw new Error('Falha ao criar venda: dados inválidos retornados');
      }
      
      // Create purchase transaction for cashback (5% of original total, not discounted total) 
      if (finalCustomerId) {
        const purchaseAmount = getSubtotal();
        console.log('💳 Criando transação de compra para cashback:', { customerId: finalCustomerId, purchaseAmount });
        const purchaseResult = await createPurchaseTransaction(finalCustomerId, purchaseAmount);
        
        if (purchaseResult) {
          console.log('✅ Cashback de compra creditado:', purchaseResult);
        }
      }

      // Salvar dados da venda para impressão
      setLastSaleData({
        sale: { ...saleData, ...createdSale },
        items: saleItems
      });
      
      // Limpar carrinho após venda bem-sucedida
      clearCart();
      setCustomerPhone('');
      setCustomerName('');
      setCustomer(null);
      setCustomerBalance(null);
      setAppliedCashback(0);
      setCustomerId(null);
      setMixedPayments([]);
      
      // Perguntar se quer imprimir
      setShowPrintConfirmation(true);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Tente novamente.');
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return labels[method] || method;
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_sales')} showMessage={true}>
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
                  Supabase não configurado. Vendas não serão salvas no banco.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Calculator size={24} className="text-green-600" />
              Sistema de Vendas - Loja 1
            </h2>
            <p className="text-gray-600">PDV completo com balança e impressão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-semibold text-sm">
                        {product.is_weighable ? (
                          <div className="flex items-center gap-1">
                            <Scale size={12} />
                            {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                          </div>
                        ) : (
                          formatPrice(product.unit_price || 0)
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.code}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Panel */}
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart size={20} className="text-green-600" />
                Carrinho ({items.length})
              </h3>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Carrinho vazio</p>
                  <p className="text-gray-400 text-sm">Adicione produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">{item.product.code}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.product.is_weighable ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Scale size={14} className="text-green-600" />
                              <span>{(item.weight || 0).toFixed(3)}kg</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {items.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo</h3>
                
                {/* Customer Phone for Cashback */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Phone size={16} />
                    Telefone do Cliente (Cashback)
                  </h4>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                    placeholder="(85) 99999-9999"
                  />
                  
                  {/* New Customer Notification */}
                  {isNewCustomer && customerPhone.length >= 11 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">🎉 Primeiro Cadastro!</h4>
                          <p className="text-blue-700 text-sm">
                            Este telefone não está cadastrado. Será criado um novo cadastro na primeira compra.
                          </p>
                          <p className="text-blue-600 text-xs mt-1">
                            ✅ O cliente ganhará 5% de cashback automaticamente!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={isNewCustomer ? "Nome do cliente (será cadastrado)" : "Nome do cliente (opcional)"}
                    />
                    {isNewCustomer && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Digite o nome para criar o cadastro do cliente
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {customer ? 'Atualize o nome se necessário' : 'Nome será salvo para futuras compras'}
                    </p>
                  </div>
                  
                  {/* Cashback Display */}
                  {customerBalance && customerBalance.available_balance > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">
                          Cashback disponível: {formatPrice(customerBalance.available_balance)}
                        </span>
                      </div>
                      
                      {appliedCashback > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700">
                            Desconto aplicado: {formatPrice(appliedCashback)}
                          </span>
                          <button
                            onClick={handleRemoveCashback}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplyCashback(Math.min(customerBalance.available_balance, getTotal()))}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            Usar Todo Cashback
                          </button>
                          <button
                            onClick={() => {
                              const amount = prompt(`Digite o valor do cashback a usar (máximo: ${formatPrice(Math.min(customerBalance.available_balance, getTotal()))})`);
                              if (amount) {
                                const numericAmount = parseFloat(amount.replace(',', '.'));
                                if (!isNaN(numericAmount) && numericAmount > 0) {
                                  handleApplyCashback(numericAmount);
                                }
                              }
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            Valor Personalizado
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {customerPhone && !customerBalance && (
                    <p className="text-sm text-gray-600">
                      Cliente não encontrado ou sem cashback disponível
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(getSubtotal())}</span>
                  </div>
                  
                  {appliedCashback > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Desconto (Cashback):</span>
                      <span>-{formatPrice(appliedCashback)}</span>
                    </div>
                  )}
                  
                  {discount.type !== 'none' && discount.value > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto:</span>
                      <span>-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">{formatPrice(getFinalTotal())}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={!supabaseConfigured}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    Pagamento
                  </button>
                  
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    disabled={!hasPermission('can_discount')}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Gift size={16} />
                    Desconto
                  </button>
                  
                  <button
                    onClick={() => setShowSplitModal(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Users size={16} />
                    Dividir
                  </button>
                  
                  <button
                    onClick={() => {
                      // Criar dados de venda atual para impressão
                      const currentSaleData = {
                        sale: {
                          sale_number: Date.now(), // Número temporário
                          operator_name: operator?.name || 'Sistema',
                          customer_name: paymentInfo.customerName || '',
                          customer_phone: paymentInfo.customerPhone || '',
                          subtotal: getSubtotal(),
                          discount_amount: getDiscountAmount(),
                          total_amount: getTotal(),
                          payment_type: paymentInfo.method,
                          payment_details: paymentInfo.method === 'misto' ? {
                            mixed_payments: paymentInfo.mixedPayments
                          } : undefined,
                          change_amount: paymentInfo.changeFor ? Math.max(0, paymentInfo.changeFor - getTotal()) : 0,
                          created_at: new Date().toISOString()
                        },
                        items: items.map(item => ({
                          product_name: item.product.name,
                          quantity: item.quantity,
                          weight_kg: item.weight,
                          unit_price: item.product.unit_price,
                          price_per_gram: item.product.price_per_gram,
                          subtotal: item.subtotal
                        }))
                      };
                      
                      setLastSaleData(currentSaleData);
                      setShowPrintView(true);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    Imprimir
                  </button>
                </div>

                {/* Payment Info Display */}
                {paymentInfo.method !== 'dinheiro' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Pagamento: {getPaymentMethodLabel(paymentInfo.method)}
                    </p>
                    {paymentInfo.method === 'misto' && paymentInfo.mixedPayments && (
                      <div className="mt-2 space-y-1">
                        {paymentInfo.mixedPayments.map((payment, index) => (
                          <div key={index} className="flex justify-between text-xs text-blue-700">
                            <span>{getPaymentMethodLabel(payment.method)}:</span>
                            <span>{formatPrice(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {paymentInfo.changeFor && paymentInfo.changeFor > getTotal() && (
                      <p className="text-xs text-blue-700 mt-1">
                        Troco: {formatPrice(paymentInfo.changeFor - getTotal())}
                      </p>
                    )}
                  </div>
                )}

                {/* Finalize Sale Button */}
                <button
                  onClick={handleFinalizeSale}
                  disabled={salesLoading || !supabaseConfigured || !isCashRegisterOpen}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {salesLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : !isCashRegisterOpen ? (
                    <>
                      <DollarSign size={20} />
                      Caixa Fechado
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Finalizar Venda
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showPesagemModal && selectedProduct && (
          <PesagemModal
            produto={selectedProduct}
            onConfirmar={handleWeightConfirm}
            onFechar={() => {
              setShowPesagemModal(false);
              setSelectedProduct(null);
            }}
          />
        )}

        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handlePayment}
            totalAmount={getTotal()}
          />
        )}

        {showDiscountModal && (
          <DiscountModal
            isOpen={showDiscountModal}
            onClose={() => setShowDiscountModal(false)}
            onApply={handleDiscount}
            subtotal={getSubtotal()}
            currentDiscount={discount}
          />
        )}

        {showSplitModal && (
          <SplitModal
            isOpen={showSplitModal}
            onClose={() => setShowSplitModal(false)}
            onConfirm={handleSplit}
            totalAmount={getTotal()}
          />
        )}

        {/* Print Confirmation Modal */}
        {showPrintConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <div className="bg-green-100 rounded-full p-2">
                      <Check size={24} className="text-green-600" />
                    </div>
                    Venda Realizada!
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Venda finalizada com sucesso!
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                   Total: {formatPrice(lastSaleData?.sale?.total_amount || getTotal())}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Printer size={20} className="text-blue-600" />
                    <p className="text-blue-800 font-medium">
                      Deseja imprimir o comprovante da venda?
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowPrintConfirmation(false);
                    setLastSaleData(null);
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Não Imprimir
                </button>
                <button
                  onClick={() => {
                    setShowPrintConfirmation(false);
                    setShowPrintView(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Sim, Imprimir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print View Modal */}
        {showPrintView && lastSaleData && (
          <SalePrintView
            sale={lastSaleData.sale}
            items={lastSaleData.items}
            storeSettings={storeSettings}
            onClose={() => {
              setShowPrintView(false);
              setLastSaleData(null);
            }}
          />
        )}
        {/* Mixed Payment Modal */}
        {showMixedPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard size={24} className="text-purple-600" />
                    Pagamento Misto
                  </h2>
                  <button
                    onClick={() => {
                      setShowMixedPaymentModal(false);
                      setMixedPayments([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-purple-800 font-medium">
                    Total a pagar: {formatPrice(getTotal())}
                  </p>
                  <p className="text-purple-700 text-sm">
                    Configure as formas de pagamento abaixo
                  </p>
                </div>

                {/* Mixed Payments List */}
                <div className="space-y-3">
                  {mixedPayments.map((payment, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <select
                          value={payment.method}
                          onChange={(e) => updateMixedPayment(index, 'method', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="voucher">Voucher</option>
                        </select>
                        <button
                          onClick={() => removeMixedPayment(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={getTotal()}
                        value={payment.amount}
                        onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Valor"
                      />
                    </div>
                  ))}
                </div>

                {/* Add Payment Button */}
                <button
                  onClick={addMixedPayment}
                  disabled={mixedPayments.length >= 5}
                  className="w-full bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 text-purple-700 disabled:text-gray-500 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Forma de Pagamento
                </button>

                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total da venda:</span>
                      <span className="font-medium">{formatPrice(getTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total configurado:</span>
                      <span className="font-medium">
                        {formatPrice(mixedPayments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferença:</span>
                      <span className={`font-medium ${
                        Math.abs(mixedPayments.reduce((sum, p) => sum + p.amount, 0) - getTotal()) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatPrice(mixedPayments.reduce((sum, p) => sum + p.amount, 0) - getTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Message */}
                {mixedPayments.length > 0 && Math.abs(mixedPayments.reduce((sum, p) => sum + p.amount, 0) - getTotal()) > 0.01 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      ⚠️ O total das formas de pagamento deve ser igual ao total da venda
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowMixedPaymentModal(false);
                    setMixedPayments([]);
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMixedPaymentConfirm}
                  disabled={
                    mixedPayments.length === 0 || 
                    Math.abs(mixedPayments.reduce((sum, p) => sum + p.amount, 0) - getTotal()) > 0.01
                  }
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Confirmar Pagamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PDVSalesScreen;