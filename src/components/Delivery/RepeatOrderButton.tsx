import React, { useState } from 'react';
import { RotateCcw, Phone, User, Clock, Package, X, AlertCircle } from 'lucide-react';
import { useLastOrder } from '../../hooks/useLastOrder';
import { Product } from '../../types/product';
import { CartItem } from '../../types/cart';

interface RepeatOrderButtonProps {
  availableProducts: Product[];
  onAddItemsToCart: (items: CartItem[]) => void;
  className?: string;
}

const RepeatOrderButton: React.FC<RepeatOrderButtonProps> = ({
  availableProducts,
  onAddItemsToCart,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [lastOrder, setLastOrder] = useState<any>(null);
  const { getLastOrderByPhone, convertOrderToCartItems, loading, error } = useLastOrder();

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
    setPhone(formatted);
  };

  const handleSearchOrder = async () => {
    if (phone.replace(/\D/g, '').length < 11) {
      alert('Digite um telefone válido com 11 dígitos');
      return;
    }

    try {
      const order = await getLastOrderByPhone(phone);
      
      if (!order) {
        alert('Nenhum pedido anterior encontrado para este telefone. Faça seu primeiro pedido!');
        return;
      }

      setLastOrder(order);
    } catch (err) {
      console.error('Erro ao buscar último pedido:', err);
      alert('Erro ao buscar último pedido. Tente novamente.');
    }
  };

  const handleRepeatOrder = () => {
    if (!lastOrder) return;

    try {
      const cartItems = convertOrderToCartItems(lastOrder, availableProducts);
      
      if (cartItems.length === 0) {
        alert('⚠️ Não foi possível repetir o pedido.\n\nAlguns produtos podem não estar mais disponíveis no cardápio atual.');
        return;
      }

      // Check if some items were skipped
      const originalItemsCount = lastOrder.items?.length || 0;
      if (cartItems.length < originalItemsCount) {
        const skippedCount = originalItemsCount - cartItems.length;
        alert(`⚠️ ${skippedCount} produto(s) do seu último pedido não estão mais disponíveis.\n\n${cartItems.length} produto(s) foram adicionados ao carrinho.`);
      }

      onAddItemsToCart(cartItems);
      setShowModal(false);
      setPhone('');
      setLastOrder(null);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        ${cartItems.length} produto(s) adicionados ao carrinho!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

    } catch (err) {
      console.error('Erro ao repetir pedido:', err);
      alert('Erro ao repetir pedido. Tente novamente.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 ${className}`}
      >
        <RotateCcw size={24} />
        <div className="text-left">
          <div className="text-lg">Repetir Último Pedido</div>
          <div className="text-sm text-blue-100">Mesmo sabor, mesma praticidade</div>
        </div>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <RotateCcw size={24} className="text-blue-600" />
                  Repetir Último Pedido
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPhone('');
                    setLastOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {!lastOrder ? (
                <>
                  <div className="text-center mb-4">
                    <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Phone size={24} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Digite seu telefone
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Vamos buscar seu último pedido para repetir
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(85) 99999-9999"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use o mesmo telefone do seu último pedido
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSearchOrder}
                    disabled={loading || phone.replace(/\D/g, '').length < 11}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={20} />
                        Buscar Último Pedido
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Package size={24} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Último Pedido Encontrado!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Confirme se deseja repetir este pedido
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium">{lastOrder.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{formatDate(lastOrder.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span>{lastOrder.items?.length || 0} item(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(lastOrder.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-2">Itens do pedido:</h4>
                    <div className="space-y-1">
                      {(lastOrder.items || []).slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="text-sm text-blue-700">
                          • {item.product_name} (Qtd: {item.quantity})
                        </div>
                      ))}
                      {(lastOrder.items?.length || 0) > 3 && (
                        <div className="text-sm text-blue-600">
                          ... e mais {(lastOrder.items?.length || 0) - 3} item(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setLastOrder(null);
                        setPhone('');
                      }}
                      className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Buscar Outro
                    </button>
                    <button
                      onClick={handleRepeatOrder}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Repetir Pedido
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RepeatOrderButton;