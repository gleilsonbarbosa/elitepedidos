import React, { useState } from 'react';
import { Gift, Minus, Plus, X } from 'lucide-react';
import { CustomerBalance } from '../../types/cashback';

interface CashbackButtonProps {
  customerBalance: CustomerBalance;
  orderTotal: number;
  appliedCashback: number;
  onApplyCashback: (amount: number) => void;
  onRemoveCashback: () => void;
  className?: string;
}

const CashbackButton: React.FC<CashbackButtonProps> = (props) => {
  // Destructure props inside the component body to ensure proper scoping
  const {
    customerBalance,
    orderTotal,
    appliedCashback,
    onApplyCashback,
    onRemoveCashback,
    className = ''
  } = props;

  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState(0);

  // Early return if customerBalance is not valid
  if (!customerBalance || customerBalance.available_balance <= 0.01) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getMaxCashbackAmount = () => {
    const availableBalance = customerBalance.available_balance || 0;
    const maxUsable = Math.min(availableBalance, orderTotal);
    return Math.max(0, maxUsable);
  };

  const handleApplyCashback = () => {
    const maxAmount = getMaxCashbackAmount();
    const amountToApply = Math.min(cashbackAmount || maxAmount, maxAmount);
    
    if (amountToApply > 0) {
      onApplyCashback(amountToApply);
      setShowCashbackModal(false);
      setCashbackAmount(0);
    }
  };

  const handleQuickApply = (percentage: number) => {
    const maxAmount = getMaxCashbackAmount();
    const amount = Math.min(maxAmount * (percentage / 100), maxAmount);
    onApplyCashback(amount);
  };

  const isExpiringSoon = () => {
    if (!customerBalance.expiration_date) return false;
    
    const expirationDate = new Date(customerBalance.expiration_date);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration <= 7;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Cashback Display */}
      <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Gift size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800">Seu Cashback</h3>
              <p className="text-sm text-purple-600">
                Disponível: {formatPrice(customerBalance.available_balance)}
              </p>
              {isExpiringSoon() && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠️ Expira em breve!
                </p>
              )}
            </div>
          </div>
          
          {appliedCashback > 0 ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">Aplicado:</p>
                <p className="text-lg font-bold text-green-600">
                  -{formatPrice(appliedCashback)}
                </p>
              </div>
              <button
                onClick={onRemoveCashback}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                title="Remover cashback"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCashbackModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Gift size={16} />
              Usar Cashback
            </button>
          )}
        </div>
      </div>

      {/* Quick Apply Buttons */}
      {appliedCashback === 0 && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickApply(25)}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            25%
          </button>
          <button
            onClick={() => handleQuickApply(50)}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            50%
          </button>
          <button
            onClick={() => handleQuickApply(100)}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Máximo
          </button>
        </div>
      )}

      {/* Cashback Modal */}
      {showCashbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Gift size={24} className="text-purple-600" />
                  Usar Cashback
                </h2>
                <button
                  onClick={() => {
                    setShowCashbackModal(false);
                    setCashbackAmount(0);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Saldo disponível:</span>
                    <span className="font-bold text-purple-800">
                      {formatPrice(customerBalance.available_balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Total do pedido:</span>
                    <span className="font-medium text-purple-800">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Máximo utilizável:</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(getMaxCashbackAmount())}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quanto deseja usar?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCashbackAmount(Math.max(0, cashbackAmount - 1))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={getMaxCashbackAmount()}
                    value={cashbackAmount}
                    onChange={(e) => setCashbackAmount(Math.min(getMaxCashbackAmount(), parseFloat(e.target.value) || 0))}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                    placeholder="0,00"
                  />
                  <button
                    onClick={() => setCashbackAmount(Math.min(getMaxCashbackAmount(), cashbackAmount + 1))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCashbackAmount(getMaxCashbackAmount() * 0.25)}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  25%
                </button>
                <button
                  onClick={() => setCashbackAmount(getMaxCashbackAmount() * 0.5)}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  50%
                </button>
                <button
                  onClick={() => setCashbackAmount(getMaxCashbackAmount())}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Máximo
                </button>
              </div>

              {cashbackAmount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Desconto aplicado:</span>
                    <span className="font-bold text-green-800">
                      -{formatPrice(cashbackAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Novo total:</span>
                    <span className="font-bold text-green-800">
                      {formatPrice(Math.max(0, orderTotal - cashbackAmount))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCashbackModal(false);
                  setCashbackAmount(0);
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCashback}
                disabled={cashbackAmount <= 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Gift size={16} />
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashbackButton;