import React, { useState } from 'react';
import { MessageCircle, Filter, ShoppingCart, Star, Zap, AlertCircle, Gift } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import Cart from './Cart';
import IARecommender from './IARecommender';
import StoreStatusBanner from './StoreStatusBanner';
import CheckoutModal from './CheckoutModal';
import RepeatOrderButton from './RepeatOrderButton';
import PromotionBanner from './PromotionBanner';
import PromotionCountdown from './PromotionCountdown';
import PushNotificationBanner from './PushNotificationBanner';
import { categoryNames } from '../../data/products';
import { Product } from '../../types/product';
import { CartItem } from '../../types/cart';
import { useCart } from '../../hooks/useCart';
import { useStoreHours } from '../../hooks/useStoreHours';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { usePromotions } from '../../hooks/usePromotions';
import { 
  getPromotionsOfTheDay, 
  hasTodaySpecialPromotions, 
  getTodaySpecialMessage,
  getTodaySpecialDescription,
  isQuintaElite,
  getQuintaEliteProducts,
  isProductAvailable,
  validateProductSchedules,
  setProductSchedulingHook
} from '../../utils/availability';

const DeliveryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Product['category'] | 'all' | 'today'>('today');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Customer state for recommendations
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const {
    items,
    isOpen: isCartOpen,
    setIsOpen: setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
  } = useCart();

  const { storeSettings } = useStoreHours();
  const { getStoreStatus } = useStoreHours();
  const productScheduling = useProductScheduling();
  const { getRecommendations } = useRecommendations();
  const { products: deliveryProducts, loading: productsLoading, refetch: refetchProducts } = useDeliveryProducts();
  const { activePromotions, getPromotionForProduct } = usePromotions();
  
  // Configurar hook para funções de availability
  React.useEffect(() => {
    setProductSchedulingHook(productScheduling);
  }, [productScheduling]);
  
  // Try to get customer ID from localStorage
  React.useEffect(() => {
    const storedCustomerId = localStorage.getItem('customer_id');
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
    }
  }, []);
  
  // Show connection status if there are issues
  const [showConnectionWarning, setShowConnectionWarning] = useState(false);
  
  React.useEffect(() => {
    // Check if we're in offline mode
    const hasError = deliveryProducts.length === 0 && !productsLoading;
    setShowConnectionWarning(hasError);
  }, [deliveryProducts, productsLoading]);
  
  // Converter produtos do banco para o formato esperado pelo componente
  const products = React.useMemo(() => {
    return deliveryProducts.map(dbProduct => ({
      id: dbProduct.id,
      name: dbProduct.name,
      category: dbProduct.category as Product['category'],
      price: dbProduct.price,
      originalPrice: dbProduct.original_price,
      pricePerGram: dbProduct.price_per_gram,
      description: dbProduct.description,
      image: dbProduct.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      isActive: dbProduct.is_active,
      is_weighable: dbProduct.is_weighable,
      complementGroups: Array.isArray(dbProduct.complement_groups) 
        ? dbProduct.complement_groups.map(group => ({
            id: group.id || `group-${Math.random()}`,
            name: group.name || 'Grupo sem nome',
            required: group.required || false,
            minItems: group.min_items || 0,
            maxItems: group.max_items || 1,
            complements: Array.isArray(group.complements) 
              ? group.complements
                  .filter(comp => {
                    const isActive = comp.isActive !== false && comp.is_active !== false;
                    if (!isActive) {
                      console.log(`🚫 Complemento ${comp.name} filtrado (inativo):`, comp);
                    }
                    return isActive;
                  })
                  .map(comp => ({
                    id: comp.id || `comp-${Math.random()}`,
                    name: comp.name || 'Complemento',
                    price: comp.price || 0,
                    description: comp.description || '',
                    isActive: comp.isActive !== false && comp.is_active !== false
                  }))
              : (Array.isArray(group.options) 
                ? group.options
                    .filter(opt => {
                      const isActive = opt.isActive !== false && opt.is_active !== false;
                      if (!isActive) {
                        console.log(`🚫 Opção ${opt.name} filtrada (inativa):`, opt);
                      }
                      return isActive;
                    })
                    .map(opt => ({
                      id: opt.id || `opt-${Math.random()}`,
                      name: opt.name || 'Opção',
                      price: opt.price || 0,
                      description: opt.description || '',
                      isActive: opt.isActive !== false && opt.is_active !== false
                    }))
                : [])
          }))
        : [],
      sizes: dbProduct.sizes,
      scheduledDays: dbProduct.scheduled_days,
      availability: dbProduct.availability_type ? {
        type: dbProduct.availability_type as any,
        scheduledDays: dbProduct.scheduled_days
      } : undefined,
      // Apply promotion price if active
      price: (() => {
        const promotion = getPromotionForProduct(dbProduct.id);
        return promotion ? promotion.promotional_price : dbProduct.price;
      })(),
      originalPrice: (() => {
        const promotion = getPromotionForProduct(dbProduct.id);
        return promotion ? dbProduct.price : dbProduct.original_price;
      })()
    }));
  }, [deliveryProducts, getPromotionForProduct]);

  // Recarregar produtos quando necessário
  React.useEffect(() => {
    // Disponibilizar função de refresh globalmente
    (window as any).refreshDeliveryProducts = refetchProducts;
    // Também disponibilizar função de correção de produto
    (window as any).fixDeliveryProduct = async (productId: string) => {
      try {
        console.log('🔧 Corrigindo produto via console:', productId);
        // Note: We need to access fixProduct from the hook, but it's not exposed yet
        // This will be added in a subsequent update
        await refetchProducts(); // For now, just refresh
        console.log('✅ Produtos atualizados');
      } catch (err) {
        console.error('❌ Erro ao corrigir produto:', err);
      }
    };
    
    return () => {
      delete (window as any).refreshDeliveryProducts;
      delete (window as any).fixDeliveryProduct;
    };
  }, [refetchProducts]);
  
  // Filtrar apenas produtos ativos
  const activeProducts = products.filter(product => {
    const isActive = product.isActive !== false;
    if (!isActive) {
      console.log(`🚫 Produto ${product.name} filtrado (inativo)`);
    }
    return isActive;
  });
  
  // Verificar se hoje tem promoções especiais
  const hasSpecialToday = hasTodaySpecialPromotions(activeProducts);
  const isThursdayElite = isQuintaElite();
  
  // Validar programação de produtos (apenas em desenvolvimento)
  React.useEffect(() => {
    validateProductSchedules(activeProducts);
  }, [activeProducts]);
  
  // Função para filtrar produtos baseado na categoria selecionada
  const getFilteredProducts = () => {
    console.log('🔍 Filtrando produtos para categoria:', selectedCategory, 'no dia:', ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]);
    console.log('📊 Total de produtos ativos:', activeProducts.length);
    
    let baseProducts = activeProducts;
    
    // FILTRO CRÍTICO: Remover produtos programados que não estão disponíveis hoje
    baseProducts = activeProducts.filter(product => {
      const isAvailable = isProductAvailable(product);
      
      if (!isAvailable) {
        console.log(`🚫 Produto ${product.name} removido da lista (não disponível hoje)`);
      }
      
      return isAvailable;
    });
    
    console.log('📊 Produtos disponíveis hoje:', baseProducts.length);
    
    if (selectedCategory === 'today') {
      const promotions = getPromotionsOfTheDay(baseProducts);
      console.log(`🎯 Promoções do dia (${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]}) encontradas:`, promotions.length);
      
      if (promotions.length > 0) {
        console.log('📋 Lista de promoções:', promotions.map(p => ({ 
          name: p.name, 
          scheduledDays: p.scheduledDays,
          availability: p.availability,
          isAvailable: isProductAvailable(p),
          currentDay: new Date().getDay()
        })));
      }
      
      return promotions;
    } else if (selectedCategory === 'all') {
      return baseProducts;
    } else {
      return baseProducts.filter(product => product.category === selectedCategory);
    }
  };

  const filteredProducts = getFilteredProducts();
  const quintaEliteProducts = getQuintaEliteProducts(activeProducts);

  // Debug adicional
  console.log('📈 Estatísticas:', {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    filteredProducts: filteredProducts.length,
    selectedCategory,
    hasSpecialToday,
    isThursdayElite,
    currentDay: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()]
  });

  // Categorias disponíveis (incluindo "Promoção do Dia" se houver)
  const availableCategories = [
    ...(hasSpecialToday ? [{ 
      id: 'today' as const, 
      label: isThursdayElite ? '⚡ QUINTA ELITE' : '🔥 Promoção do Dia',
      count: getPromotionsOfTheDay(activeProducts).length
    }] : []),
    { id: 'all' as const, label: 'Todos', count: activeProducts.length },
    ...Object.entries(categoryNames).map(([key, label]) => ({ 
      id: key as keyof typeof categoryNames, 
      label,
      count: activeProducts.filter(p => p.category === key).length
    })).filter(category => {
      // Remove categorias específicas
      const categoriesToRemove = ['complementos', 'sobremesas', 'outros'];
      return !categoriesToRemove.includes(category.id);
    })
  ];

  // Verificar se a loja está aberta
  const storeStatus = getStoreStatus();

  const handleEditCartItem = (cartItem: CartItem) => {
    // Abrir modal de produto para edição
    setSelectedProduct(cartItem.product);
    setEditingCartItem(cartItem);
  };
  
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  
  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Status da Loja */}
      <section className="py-4 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* Push Notification Banner */}
          <div className="mb-6">
            <PushNotificationBanner />
          </div>
          
          {/* Promotion Banners */}
          {activePromotions.length > 0 && (
            <div className="mb-6">
              <PromotionBanner 
                onPromotionClick={(promotion) => {
                  // Find the product and open its modal
                  const product = products.find(p => p.id === promotion.product_id);
                  if (product) {
                    setSelectedProduct(product);
                  }
                }}
              />
            </div>
          )}
          
          <StoreStatusBanner />
          
          {/* Connection Warning */}
          {showConnectionWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 rounded-full p-2">
                  <AlertCircle size={20} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">Modo Offline</h3>
                  <p className="text-yellow-700 text-sm">
                    Conectividade limitada com o servidor. Exibindo produtos em modo demonstração.
                    Alguns produtos podem não estar atualizados.
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </section>

      {/* Banner de Promoção do Dia */}
      {hasSpecialToday && selectedCategory === 'today' && (
        <section className={`py-8 text-white relative overflow-hidden ${
          isThursdayElite 
            ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500' 
            : 'bg-gradient-to-r from-orange-500 to-red-500'
        }`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              {isThursdayElite ? (
                <>
                  <Zap size={32} className="text-yellow-300 animate-pulse" />
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {getTodaySpecialMessage()}
                  </h2>
                  <Zap size={32} className="text-yellow-300 animate-pulse" />
                </>
              ) : (
                <>
                  <Star size={28} className="text-yellow-300" />
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {getTodaySpecialMessage()}
                  </h2>
                  <Star size={28} className="text-yellow-300" />
                </>
              )}
            </div>
            <p className={`text-lg mb-4 ${
              isThursdayElite ? 'text-yellow-100' : 'text-orange-100'
            }`}>
              {getTodaySpecialDescription()}
            </p>
            
            {isThursdayElite && quintaEliteProducts.length > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
                <p className="text-yellow-100 font-semibold">
                  🎯 {quintaEliteProducts.length} promoções especiais da Quinta Elite disponíveis!
                </p>
              </div>
            )}
          </div>
          
          {/* Elementos decorativos */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full"></div>
          </div>
        </section>
      )}
      
      {/* Menu de Categorias */}
      <section className="py-8 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {availableCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? category.id === 'today'
                      ? isThursdayElite
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.id === 'all' && <Filter size={16} />}
                {category.id === 'today' && (
                  isThursdayElite ? <Zap size={16} /> : <Star size={16} />
                )}
                {category.label}
                {category.id === 'today' && (
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                    {category.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Cardápio */}
      <section id="cardapio" className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {selectedCategory === 'today' 
                ? getTodaySpecialMessage()
                : selectedCategory === 'all' 
                  ? 'Nosso Cardápio' 
                  : categoryNames[selectedCategory as keyof typeof categoryNames]
              }
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {selectedCategory === 'today'
                ? getTodaySpecialDescription()
                : 'Produtos frescos, sabores únicos e qualidade garantida. Escolha seu favorito e monte seu pedido!'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOpenModal={setSelectedProduct}
                disabled={!storeStatus.isOpen || !isProductAvailable(product)}
                isSpecialOfTheDay={selectedCategory === 'today'}
              />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
                {selectedCategory === 'today' ? (
                  <>
                    {isThursdayElite ? (
                      <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                    ) : (
                      <Star size={48} className="mx-auto text-gray-300 mb-4" />
                    )}
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      {isThursdayElite 
                        ? 'Nenhuma promoção Quinta Elite hoje'
                        : 'Nenhuma promoção especial hoje'
                      }
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {isThursdayElite
                        ? 'As promoções da Quinta Elite podem não estar configuradas ou ativas no momento.'
                        : 'Não há promoções programadas para hoje, mas temos muitas outras opções deliciosas!'
                      }
                    </p>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Ver Todos os Produtos
                    </button>
                  </>
                ) : (
                  <>
                    <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">
                      Nenhum produto encontrado nesta categoria.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className={`py-16 ${
        hasSpecialToday && selectedCategory === 'today'
          ? isThursdayElite
            ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500'
            : 'bg-gradient-to-r from-orange-500 to-red-500'
          : 'bg-gradient-to-r from-purple-600 to-green-500'
      }`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para fazer seu pedido?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            {hasSpecialToday && selectedCategory === 'today'
              ? isThursdayElite
                ? 'Aproveite as promoções exclusivas da Quinta Elite e receba seu açaí fresquinho em casa!'
                : 'Aproveite as promoções especiais de hoje e receba seu açaí fresquinho em casa!'
              : 'Monte seu carrinho e receba seu açaí fresquinho em casa!'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <RepeatOrderButton
              availableProducts={activeProducts}
              onAddItemsToCart={(items) => {
                items.forEach(item => {
                  addToCart(
                    item.product,
                    item.selectedSize,
                    item.quantity,
                    item.observations,
                    item.selectedComplements
                  );
                });
                setIsCartOpen(true);
              }}
            />
            
            <button
              onClick={() => setIsCartOpen(true)}
              disabled={!storeStatus.isOpen}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2 shadow-lg ${
                storeStatus.isOpen
                  ? 'bg-white text-purple-600 hover:bg-gray-100'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={24} />
              {storeStatus.isOpen ? `Ver Carrinho (${getTotalItems()})` : 'Loja Fechada'}
            </button>
          </div>
        </div>
      </section>
      
      <Footer storeSettings={storeSettings} />
      
      {/* Botão Carrinho Flutuante */}
      {getTotalItems() > 0 && storeStatus.isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center relative"
          >
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {getTotalItems()}
            </span>
          </button>
        </div>
      )}

      {/* Botões Flutuantes */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        {/* WhatsApp */}
        <a
          href="https://wa.me/5585989041010"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
          title="Falar no WhatsApp"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        </a>
      </div>

      {/* Modais */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={true}
          onClose={() => {
            setSelectedProduct(null);
            setEditingCartItem(null);
          }}
          onAddToCart={(product, selectedSize, quantity, observations, selectedComplements) => {
            if (editingCartItem) {
              // Modo edição: substituir item na mesma posição
              addToCart(product, selectedSize, quantity, observations, selectedComplements, editingCartItem.id);
              setEditingCartItem(null);
            } else {
              // Modo normal: apenas adicionar
              addToCart(product, selectedSize, quantity, observations, selectedComplements);
            }
            setSelectedProduct(null);
          }}
          disabled={!storeStatus.isOpen || !isProductAvailable(selectedProduct)}
          isEditing={!!editingCartItem}
          initialSize={editingCartItem?.selectedSize}
          initialQuantity={editingCartItem?.quantity}
          initialObservations={editingCartItem?.observations}
          initialComplements={editingCartItem?.selectedComplements}
        />
      )}

      <Cart
        items={items}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalPrice={getTotalPrice()}
        disabled={!storeStatus.isOpen}
        onEditItem={handleEditCartItem}
        availableProducts={activeProducts}
        onAddProduct={(product) => {
          // Add product with default settings
          addToCart(product, undefined, 1, '', []);
        }}
        onCheckout={() => {
          setIsCartOpen(false);
          setShowCheckout(true);
        }}
      />
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={items}
        totalPrice={getTotalPrice()}
        customerId={customerId}
        onOrderComplete={() => {
          clearCart();
          setShowCheckout(false);
          setIsCartOpen(false);
        }}
      />
      
    </div>
  );
};

export default DeliveryPage;