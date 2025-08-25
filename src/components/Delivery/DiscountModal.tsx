import React, { useState } from 'react';
import { X, Percent, DollarSign, Gift } from 'lucide-react';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (type: 'percentage' | 'amount', value: number) => void;
  subtotal: number;
  currentDiscount: { type: 'none' | 'percentage' | 'amount'; value: number };
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  onApply,
  subtotal,
  currentDiscount
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateDiscountAmount = () => {
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    }
    return Math.min(discountValue, subtotal);
  };

  const handleApply = () => {
    if (discountValue > 0) {
      onApply(discountType, discountValue);
    }
    onClose();
  };

  const handleRemove = () => {
    onApply('percentage', 0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Gift size={24} className="text-orange-600" />
              Aplicar Desconto
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 font-medium">
              Subtotal: {formatPrice(subtotal)}
            </p>
          </div>

          {/* Tipo de Desconto */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de desconto:
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="text-orange-600"
                />
                <Percent size={16} className="text-orange-600" />
                <span className="font-medium">Porcentagem</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="discountType"
                  value="amount"
                  checked={discountType === 'amount'}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="text-orange-600"
                />
                <DollarSign size={16} className="text-orange-600" />
                <span className="font-medium">Valor</span>
              </label>
            </div>
          </div>

          {/* Valor do Desconto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {discountType === 'percentage' ? 'Porcentagem (%)' : 'Valor (R$)'}
            </label>
            <input
              type="number"
              step={discountType === 'percentage' ? '1' : '0.01'}
              min="0"
              max={discountType === 'percentage' ? '100' : subtotal}
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={discountType === 'percentage' ? '10' : '5.00'}
            />
          </div>

          {/* Preview do Desconto */}
          {discountValue > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-700">Desconto:</span>
                  <span className="font-medium text-green-800">
                    -{formatPrice(calculateDiscountAmount())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Total com desconto:</span>
                  <span className="font-bold text-green-800">
                    {formatPrice(subtotal - calculateDiscountAmount())}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Desconto Atual */}
          {currentDiscount.type !== 'none' && currentDiscount.value > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                Desconto atual: {currentDiscount.type === 'percentage' ? `${currentDiscount.value}%` : formatPrice(currentDiscount.value)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          {currentDiscount.type !== 'none' && currentDiscount.value > 0 && (
            <button
              onClick={handleRemove}
              className="px-4 py-3 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              Remover
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={discountValue <= 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Gift size={16} />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;