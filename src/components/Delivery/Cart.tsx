import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, Edit3 } from 'lucide-react';
import { CartItem } from '../../types/cart';

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  totalPrice: number;
  disabled?: boolean;
  onEditItem?: (item: CartItem) => void;
  onCheckout?: () => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
  disabled = false,
  onEditItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-[600px] sm:max-w-2xl h-full sm:h-auto sm:max-h-[80vh] sm:rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-green-50 sm:rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 rounded-full p-2">
              <ShoppingCart size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Meu Carrinho
              </h2>
              <p className="text-sm text-gray-600">
                {items.length} produto(s) • {getTotalItems()} item(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Seu carrinho está vazio</h3>
              <p className="text-gray-500 text-sm">
                Adicione produtos deliciosos do nosso cardápio!
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 text-sm leading-tight">
                            {item.product.name}
                          </h3>
                          {item.selectedSize && (
                            <p className="text-xs text-gray-600 mt-1">
                              Tamanho: {item.selectedSize.name}
                            </p>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 ml-2">
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              disabled={disabled}
                              title="Editar produto"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            disabled={disabled}
                            title="Remover produto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Complementos */}
                      {item.selectedComplements && item.selectedComplements.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Complementos:</p>
                          <div className="max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <div className="flex flex-wrap gap-1 pr-2">
                            {item.selectedComplements.slice(0, 3).map((selectedComp, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {selectedComp.complement.name}
                                {selectedComp.complement.price > 0 && ` (+${formatPrice(selectedComp.complement.price)})`}
                              </span>
                            ))}
                            {item.selectedComplements.length > 3 && (
                              <>
                                {item.selectedComplements.slice(3).map((selectedComp, idx) => (
                                  <span 
                                    key={idx + 3}
                                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                  >
                                    {selectedComp.complement.name}
                                    {selectedComp.complement.price > 0 && ` (+${formatPrice(selectedComp.complement.price)})`}
                                  </span>
                                ))}
                              </>
                            )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {item.observations && (
                        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800">
                            <strong>Obs:</strong> {item.observations}
                          </p>
                        </div>
                      )}

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-full transition-colors"
                            disabled={disabled}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 rounded-full transition-colors"
                            disabled={disabled}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatPrice(item.totalPrice)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.unit_price)} cada
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white p-4 sm:rounded-b-lg">
            {/* Total */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>{items.length} produto(s)</span>
                <span>{getTotalItems()} item(s)</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClearCart}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                disabled={disabled}
              >
                <Trash2 size={16} />
                Limpar
              </button>
              
             <button
               onClick={onClose}
               className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
               disabled={disabled}
        
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
               Continuar comprando
             </button>
             
              <button
                onClick={onCheckout || onClose}
               className="flex-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                disabled={disabled}
              >
                <ShoppingCart size={18} />
               {onCheckout ? 'Finalizar' : 'Fechar'}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;