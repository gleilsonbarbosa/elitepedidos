import React, { useState, useEffect } from 'react';
import { Scale, X, Check, AlertCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { WeightReading } from '../../types/pdv';
import { PesagemModal } from './PesagemModal';
import { useWeightFromScale } from '../../hooks/useWeightFromScale';

interface ScaleWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeightConfirm: (weight: number) => void;
  productName: string;
  isScaleConnected: boolean;
  currentWeight: WeightReading | null;
  requestStableWeight: () => Promise<number | null>;
  isReading: boolean;
}

const ScaleWeightModal: React.FC<ScaleWeightModalProps> = ({
  isOpen,
  onClose,
  onWeightConfirm,
  productName,
  isScaleConnected,
  currentWeight,
  requestStableWeight,
  isReading
}) => {
  const [manualWeight, setManualWeight] = useState<string>('');
  const [isRequestingWeight, setIsRequestingWeight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightReading[]>([]);
  const [weightAttempts, setWeightAttempts] = useState(0);
  const { fetchWeight } = useWeightFromScale();

  useEffect(() => {
    if (isOpen) {
      setManualWeight('');
      setError(null);
      setWeightHistory([]);
      setWeightAttempts(0);
    }
  }, [isOpen]);

  // Add current weight to history when it changes
  useEffect(() => {
    if (currentWeight && isOpen) {
      setWeightHistory(prev => {
        // Only add if weight is different from last entry
        if (prev.length === 0 || Math.abs(prev[prev.length - 1].weight - currentWeight.weight) > 0.001) {
          return [...prev.slice(-4), currentWeight]; // Keep last 5 readings
        }
        return prev;
      });
    }
  }, [currentWeight, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <Scale size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pesagem de Produto</h2>
                <p className="text-white/80 text-sm truncate max-w-[200px]">{productName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Selection */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <PesagemModal 
              produto={productName ? { nome: productName } : { nome: "Produto pesável" }} 
              onConfirmar={(peso) => {
                onWeightConfirm(peso);
                onClose();
              }}
              useDirectScale={true}
            />
          </div>
        </div>

        {/* Footer */}
      </div>
    </div>
  );
};

export default ScaleWeightModal;