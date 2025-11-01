import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, User, Phone, MapPin, Package, DollarSign, AlertCircle } from 'lucide-react';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { useNeighborhoods } from '../../hooks/useNeighborhoods';
import { useOrders } from '../../hooks/useOrders';
import { Order } from '../../types/order';

interface ManualOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  observations?: string;
  complements: Array<{
    name: string;
    price: number;
  }>;
}

const ManualOrderForm: React.FC<ManualOrderFormProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const { products } = useDeliveryProducts();
  const { neighborhoods } = useNeighborhoods();
  const { createOrder } = useOrders();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('');
  const [customerComplement, setCustomerComplement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'pix' | 'card'>('money');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemObservations, setItemObservations] = useState('');
  const [selectedComplements, setSelectedComplements] = useState<Array<{ name: string; price: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  // Contar quantos complementos de um grupo específico foram selecionados
  const getGroupSelectionCount = (groupName: string) => {
    const product = getSelectedProduct();
    if (!product?.complement_groups) return 0;

    const group = product.complement_groups.find(g => g.name === groupName);
    if (!group) return 0;

    const complementsList = group.complements || group.options || [];
    const groupComplementNames = complementsList.map(c => c.name);

    return selectedComplements.filter(c =>
      groupComplementNames.includes(c.name)
    ).length;
  };

  // Verificar se pode adicionar mais complementos neste grupo
  const canAddToGroup = (groupName: string, maxItems?: number) => {
    if (!maxItems) return true; // Sem limite
    return getGroupSelectionCount(groupName) < maxItems;
  };

  const toggleComplement = (complementName: string, complementPrice: number, groupName: string, maxItems?: number) => {
    const exists = selectedComplements.find(c => c.name === complementName);

    if (exists) {
      // Remove se já estiver selecionado
      setSelectedComplements(prev => prev.filter(c => c.name !== complementName));
    } else {
      // Verificar se pode adicionar
      if (!canAddToGroup(groupName, maxItems)) {
        alert(`Você já selecionou o máximo de ${maxItems} ${maxItems === 1 ? 'item' : 'itens'} para "${groupName}"`);
        return;
      }

      // Adiciona se não estiver selecionado
      setSelectedComplements(prev => [...prev, { name: complementName, price: complementPrice }]);
    }
  };

  const isComplementSelected = (complementName: string) => {
    return selectedComplements.some(c => c.name === complementName);
  };

  const getSelectedProduct = () => {
    return products.find(p => p.id === selectedProductId);
  };

  // Limpar complementos quando trocar de produto
  const handleProductChange = (productId: string) => {
    try {
      setSelectedProductId(productId);
      setSelectedComplements([]);

      // Debug: verificar se produto tem complementos
      if (!productId) {
        console.log('⚠️ Produto desmarcado');
        return;
      }

      const product = products.find(p => p.id === productId);
      if (product) {
        console.log('🔍 Produto selecionado:', {
          name: product.name,
          hasComplementGroups: !!product.complement_groups,
          complementGroupsLength: product.complement_groups?.length || 0,
          complementGroupsType: typeof product.complement_groups,
          isArray: Array.isArray(product.complement_groups)
        });

        // Verificar estrutura dos grupos
        if (product.complement_groups && Array.isArray(product.complement_groups)) {
          product.complement_groups.forEach((group, idx) => {
            console.log(`  📦 Grupo ${idx + 1}:`, {
              id: group?.id,
              name: group?.name,
              hasComplements: !!group?.complements,
              complementsLength: group?.complements?.length || 0
            });
          });
        }
      } else {
        console.warn('⚠️ Produto não encontrado:', productId);
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar produto:', error);
      setError('Erro ao carregar complementos do produto');
    }
  };

  const addItem = () => {
    if (!selectedProductId) {
      alert('Selecione um produto');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      alert('Produto não encontrado');
      return;
    }

    // Validar grupos obrigatórios de complementos
    if (product.complement_groups && Array.isArray(product.complement_groups)) {
      const invalidGroups: string[] = [];

      product.complement_groups.forEach(group => {
        if (!group.required) return; // Pula grupos não obrigatórios

        const minItems = group.min_items || group.minItems || 1;
        const maxItems = group.max_items || group.maxItems;
        const currentCount = getGroupSelectionCount(group.name);

        // Verificar mínimo
        if (currentCount < minItems) {
          invalidGroups.push(`"${group.name}" requer no mínimo ${minItems} ${minItems === 1 ? 'item' : 'itens'} (você selecionou ${currentCount})`);
        }

        // Verificar máximo
        if (maxItems && currentCount > maxItems) {
          invalidGroups.push(`"${group.name}" permite no máximo ${maxItems} ${maxItems === 1 ? 'item' : 'itens'} (você selecionou ${currentCount})`);
        }
      });

      if (invalidGroups.length > 0) {
        alert('Por favor, complete os grupos obrigatórios:\n\n' + invalidGroups.join('\n'));
        return;
      }
    }

    // Calcular preço com complementos
    const complementsTotal = selectedComplements.reduce((sum, comp) => sum + comp.price, 0);
    const unitPriceWithComplements = product.price + complementsTotal;

    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      quantity: itemQuantity,
      unit_price: unitPriceWithComplements,
      total_price: unitPriceWithComplements * itemQuantity,
      observations: itemObservations,
      complements: [...selectedComplements]
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemObservations('');
    setSelectedComplements([]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity,
          total_price: item.unit_price * quantity
        };
      }
      return item;
    }));
  };

  const getTotalPrice = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    const deliveryFee = neighborhood ? neighborhood.delivery_fee : 5.00;
    return subtotal + deliveryFee;
  };

  const getDeliveryFee = () => {
    const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
    return neighborhood ? neighborhood.delivery_fee : 5.00;
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      setError('Nome do cliente é obrigatório');
      return false;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 11) {
      setError('Telefone válido é obrigatório');
      return false;
    }

    if (!customerAddress.trim()) {
      setError('Endereço é obrigatório');
      return false;
    }

    if (!customerNeighborhood.trim()) {
      setError('Bairro é obrigatório');
      return false;
    }

    if (items.length === 0) {
      setError('Adicione pelo menos um item ao pedido');
      return false;
    }

    if (paymentMethod === 'money' && changeFor && changeFor < getTotalPrice()) {
      setError('Valor para troco deve ser maior ou igual ao total');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const neighborhood = neighborhoods.find(n => n.name === customerNeighborhood);
      
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\D/g, ''),
        customer_address: customerAddress,
        customer_neighborhood: customerNeighborhood,
        customer_complement: customerComplement,
        payment_method: paymentMethod,
        change_for: changeFor,
        neighborhood_id: neighborhood?.id,
        delivery_fee: getDeliveryFee(),
        estimated_delivery_minutes: neighborhood?.delivery_time || 35,
        items: items,
        total_price: getTotalPrice(),
        status: 'confirmed' as const,
        channel: 'manual'
      };

      const newOrder = await createOrder(orderData);
      
      // Show success message
      alert(`✅ Pedido manual criado com sucesso!\n\nID: ${newOrder.id.slice(-8)}\nCliente: ${customerName}\nTotal: ${formatPrice(getTotalPrice())}`);
      
      onOrderCreated(newOrder);
      onClose();
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerNeighborhood('');
      setCustomerComplement('');
      setPaymentMethod('money');
      setChangeFor(undefined);
      setItems([]);
      setError('');
    } catch (err) {
      console.error('Erro ao criar pedido manual:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Criar Pedido Manual</h2>
              <p className="text-gray-600">Crie um pedido diretamente pelo sistema</p>
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
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados do Cliente</h3>
            
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do cliente"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(85) 99999-9999"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={customerNeighborhood}
                  onChange={(e) => setCustomerNeighborhood(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione o bairro</option>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apartamento, bloco, referência..."
              />
            </div>
          </div>

          {/* Add Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Produtos</h3>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um produto</option>
                    {products.filter(p => p.is_active).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-16 text-center py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedProductId}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Complementos/Opcionais */}
              {(() => {
                try {
                  const selectedProduct = getSelectedProduct();

                  console.log('🔄 Renderizando complementos:', {
                    selectedProductId,
                    hasProduct: !!selectedProduct,
                    productName: selectedProduct?.name
                  });

                  const hasComplements = selectedProduct?.complement_groups &&
                                        Array.isArray(selectedProduct.complement_groups) &&
                                        selectedProduct.complement_groups.length > 0;

                  if (!selectedProductId || !hasComplements) {
                    console.log('❌ Sem complementos para exibir');
                    return null;
                  }

                  console.log('✅ Exibindo', selectedProduct.complement_groups.length, 'grupos de complementos');

                  return (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Opcionais / Complementos</h4>

                    <div className="space-y-4">
                      {selectedProduct.complement_groups.map((group, groupIdx) => {
                        // Suportar ambas estruturas: 'complements' e 'options'
                        const complementsList = group.complements || group.options || [];

                        console.log(`📦 Renderizando grupo ${groupIdx + 1}/${selectedProduct.complement_groups.length}:`, {
                          name: group.name,
                          hasComplements: !!group.complements,
                          hasOptions: !!group.options,
                          complementsListLength: complementsList.length,
                          required: group.required
                        });

                        if (!group || !complementsList || !Array.isArray(complementsList)) {
                          console.warn('⚠️ Grupo sem complementos:', group);
                          return null;
                        }

                        if (complementsList.length === 0) {
                          console.warn('⚠️ Grupo vazio:', group.name);
                          return null;
                        }

                        const groupKey = group.id || `group-${groupIdx}-${group.name}`;

                        const currentCount = getGroupSelectionCount(group.name);
                        const minItems = group.min_items || group.minItems || 0;
                        const maxItems = group.max_items || group.maxItems;
                        const hasLimit = maxItems !== undefined && maxItems !== null;

                        return (
                          <div key={groupKey} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-800">{group.name}</h5>
                              <div className="flex items-center gap-2">
                                {hasLimit && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    currentCount >= maxItems
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {currentCount}/{maxItems} {maxItems === 1 ? 'item' : 'itens'}
                                  </span>
                                )}
                                {group.required && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                    Obrigatório
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {complementsList.map((complement, compIdx) => {
                                // Pular complementos inativos
                                if (complement.is_active === false || complement.isActive === false) {
                                  return null;
                                }

                                const isSelected = isComplementSelected(complement.name);
                                const complementKey = complement.id || `comp-${groupIdx}-${compIdx}-${complement.name}`;
                                const isGroupFull = hasLimit && currentCount >= maxItems && !isSelected;

                                return (
                                  <button
                                    key={complementKey}
                                    type="button"
                                    onClick={() => toggleComplement(complement.name, complement.price || 0, group.name, maxItems)}
                                    disabled={isGroupFull}
                                    className={`
                                      p-3 rounded-lg border-2 transition-all text-left
                                      ${isSelected
                                        ? 'border-green-500 bg-green-50'
                                        : isGroupFull
                                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                          : 'border-gray-200 bg-white hover:border-gray-300'
                                      }
                                    `}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-800">
                                      {complement.name}
                                    </p>
                                    {complement.price > 0 && (
                                      <p className="text-xs text-green-600 font-semibold">
                                        +{formatPrice(complement.price)}
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <div className="ml-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedComplements.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Complementos selecionados ({selectedComplements.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedComplements.map((comp, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-green-700 border border-green-200">
                              {comp.name}
                              {comp.price > 0 && <span className="font-semibold">+{formatPrice(comp.price)}</span>}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-green-700 mt-2">
                          Preço unitário total: {formatPrice((selectedProduct?.price || 0) + selectedComplements.reduce((sum, c) => sum + c.price, 0))}
                        </p>
                      </div>
                    )}
                  </div>
                  );
                } catch (error) {
                  console.error('❌ Erro ao renderizar complementos:', error);
                  return (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">
                          Erro ao carregar complementos do produto. Por favor, tente novamente.
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações do Item (opcional)
                </label>
                <input
                  type="text"
                  value={itemObservations}
                  onChange={(e) => setItemObservations(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Sem açúcar, mais granola..."
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Itens do Pedido ({items.length})</h3>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity}x {formatPrice(item.unit_price)} = {formatPrice(item.total_price)}
                        </p>
                        {item.complements && item.complements.length > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            <span className="font-medium">Complementos: </span>
                            {item.complements.map((comp, idx) => (
                              <span key={idx}>
                                {comp.name}
                                {comp.price > 0 && ` (+${formatPrice(comp.price)})`}
                                {idx < item.complements.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.observations && (
                          <p className="text-xs text-gray-500">Obs: {item.observations}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma de Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">PIX</span>
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
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-medium">Cartão</span>
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
                  min={getTotalPrice()}
                  value={changeFor || ''}
                  onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={`Mínimo: ${formatPrice(getTotalPrice())}`}
                />
                {changeFor && changeFor > getTotalPrice() && (
                  <p className="text-sm text-green-600 mt-1">
                    Troco: {formatPrice(changeFor - getTotalPrice())}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''}):</span>
                  <span className="font-medium text-green-800">
                    {formatPrice(items.reduce((sum, item) => sum + item.total_price, 0))}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Taxa de entrega:</span>
                  <span className="font-medium text-green-800">{formatPrice(getDeliveryFee())}</span>
                </div>
                
                <div className="border-t border-green-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-green-800">Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="flex-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Criando Pedido...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Criar Pedido Manual - {formatPrice(getTotalPrice())}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualOrderForm;