import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Plus, Minus } from 'lucide-react';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (splitInfo: { parts: number; amounts: number[] }) => void;
  totalAmount: number;
}

const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount
}) => {
  const [splitParts, setSplitParts] = useState(2);
  const [splitAmounts, setSplitAmounts] = useState<number[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Atualizar valores quando mudar o número de partes ou tipo
  useEffect(() => {
    if (splitType === 'equal') {
      const equalAmount = totalAmount / splitParts;
      setSplitAmounts(Array(splitParts).fill(equalAmount));
    } else {
      // Para divisão customizada, inicializar com valores iguais se não houver valores
      if (splitAmounts.length !== splitParts) {
        const equalAmount = totalAmount / splitParts;
        setSplitAmounts(Array(splitParts).fill(equalAmount));
      }
    }
  }, [splitParts, splitType, totalAmount]);

  const updateSplitAmount = (index: number, value: number) => {
    const newAmounts = [...splitAmounts];
    newAmounts[index] = value;
    setSplitAmounts(newAmounts);
  };

  const getTotalSplit = () => {
    return splitAmounts.reduce((sum, amount) => sum + amount, 0);
  };

  const getDifference = () => {
    return getTotalSplit() - totalAmount;
  };

  const handleConfirm = () => {
    onConfirm({
      parts: splitParts,
      amounts: splitAmounts
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={24} className="text-purple-600" />
              Dividir Conta
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-purple-800 font-medium">
              Total a dividir: {formatPrice(totalAmount)}
            </p>
          </div>

          {/* Número de Partes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dividir em quantas partes?
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSplitParts(Math.max(2, splitParts - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-bold w-12 text-center">{splitParts}</span>
              <button
                onClick={() => setSplitParts(Math.min(10, splitParts + 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Tipo de Divisão */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Como dividir?
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="splitType"
                  value="equal"
                  checked={splitType === 'equal'}
                  onChange={(e) => setSplitType(e.target.value as any)}
                  className="text-purple-600"
                />
                <span className="font-medium">Igualmente</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="splitType"
                  value="custom"
                  checked={splitType === 'custom'}
                  onChange={(e) => setSplitType(e.target.value as any)}
                  className="text-purple-600"
                />
                <span className="font-medium">Personalizado</span>
              </label>
            </div>
          </div>

          {/* Valores por Pessoa */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Valor por pessoa:
            </label>
            
            <div className="space-y-2">
              {splitAmounts.map((amount, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-16">
                    Pessoa {index + 1}:
                  </span>
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => updateSplitAmount(index, parseFloat(e.target.value) || 0)}
                      disabled={splitType === 'equal'}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-20">
                    {formatPrice(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-700">Total dividido:</span>
                <span className="font-medium">{formatPrice(getTotalSplit())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Diferença:</span>
                <span className={`font-medium ${
                  Math.abs(getDifference()) < 0.01 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(getDifference()) < 0.01 ? 'Exato' : formatPrice(getDifference())}
                </span>
              </div>
            </div>
          </div>

          {Math.abs(getDifference()) > 0.01 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">
                ⚠️ A soma das partes não confere com o total. Ajuste os valores.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={Math.abs(getDifference()) > 0.01}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Users size={16} />
            Aplicar Divisão
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitModal;