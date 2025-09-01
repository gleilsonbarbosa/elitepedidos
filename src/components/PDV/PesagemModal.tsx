import React, { useState, useEffect } from 'react';
import { X, Scale, Check, AlertCircle } from 'lucide-react';
import { PDVProduct } from '../../types/pdv';
import { useWeightFromScale } from '../../hooks/useWeightFromScale';

interface PesagemModalProps {
  product?: PDVProduct | null;
  onConfirm: (weightInGrams: number) => void;
  onCancel: () => void;
}

export const PesagemModal: React.FC<PesagemModalProps> = ({ 
  product, 
  onConfirm, 
  onCancel 
}) => {
  const [manualWeight, setManualWeight] = useState('');
  const [useManualWeight, setUseManualWeight] = useState(false);
  const { fetchWeight, loading } = useWeightFromScale();
  const [scaleWeight, setScaleWeight] = useState<number | null>(null);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());

  // Verificação de segurança para produto
  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro</h2>
            <p className="text-gray-600 mb-4">Produto não encontrado para pesagem.</p>
            <button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getWeightFromScale = async () => {
    try {
      const weight = await fetchWeight();
      if (weight !== null) {
        setScaleWeight(weight);
        setLastFetch(new Date());
      }
    } catch (error) {
      console.error('Erro ao obter peso da balança:', error);
    }
  };

  const handleConfirm = () => {
    const weightToUse = useManualWeight 
      ? parseFloat(manualWeight) * 1000 // Converter kg para gramas
      : scaleWeight ? scaleWeight * 1000 : 0; // Converter kg para gramas

    if (weightToUse <= 0) {
      alert('Por favor, informe um peso válido');
      return;
    }

    onConfirm(weightToUse);
  };

  const calculatePrice = () => {
    if (!product.price_per_gram) return 0;
    
    const weightInKg = useManualWeight 
      ? parseFloat(manualWeight) || 0
      : scaleWeight || 0;
    
    return weightInKg * product.price_per_gram * 1000; // price_per_gram já está em gramas
  };

  useEffect(() => {
    // Buscar peso inicial da balança
    getWeightFromScale();
    
    // Atualizar peso a cada 2 segundos
    const interval = setInterval(getWeightFromScale, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Scale size={24} className="text-blue-600" />
              Pesagem do Produto
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">{product.name}</h3>
            <p className="text-sm text-blue-700">
              Preço: {formatPrice(product.price_per_gram || 0)}/g
            </p>
          </div>

          {/* Peso da Balança */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Peso da Balança</h4>
              <button
                onClick={getWeightFromScale}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Scale size={16} />
                )}
                Atualizar
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {scaleWeight !== null ? `${scaleWeight.toFixed(3)} kg` : 'Sem leitura'}
                </p>
                <p className="text-sm text-gray-600">
                  Última atualização: {lastFetch.toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="weightSource"
                checked={!useManualWeight}
                onChange={() => setUseManualWeight(false)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Usar peso da balança</span>
            </label>
          </div>

          {/* Peso Manual */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="weightSource"
                checked={useManualWeight}
                onChange={() => setUseManualWeight(true)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Informar peso manualmente</span>
            </label>
            
            {useManualWeight && (
              <div>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,000 kg"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Cálculo do Preço */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-green-700">Preço calculado:</span>
              <span className="text-xl font-bold text-green-800">
                {formatPrice(calculatePrice())}
              </span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              Peso: {useManualWeight 
                ? `${parseFloat(manualWeight) || 0} kg` 
                : `${scaleWeight || 0} kg`
              }
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              (useManualWeight && (!manualWeight || parseFloat(manualWeight) <= 0)) ||
              (!useManualWeight && (!scaleWeight || scaleWeight <= 0))
            }
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Confirmar Pesagem
          </button>
        </div>
      </div>
    </div>
  );
};