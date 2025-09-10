import React from 'react';
import { Gift, Clock, TrendingUp } from 'lucide-react';
import { CustomerBalance } from '../../types/cashback';

interface CashbackDisplayProps {
  balance: CustomerBalance;
  className?: string;
}

const CashbackDisplay: React.FC<CashbackDisplayProps> = ({ balance, className = '' }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Don't show component if balance is effectively zero
  if (balance.available_balance <= 0.01) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Gift size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Sem Cashback Disponível
          </h3>
          <p className="text-gray-500">
            Você não possui cashback disponível no momento.
          </p>
        </div>
      </div>
    );
  }

  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Para lógica mensal, calcular dias até o fim do mês
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const diffTime = endOfMonth.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expira hoje';
    if (diffDays === 1) return 'Expira amanhã (fim do mês)';
    if (diffDays <= 7) return `Expira em ${diffDays} dias (fim do mês)`;
    
    return `Expira no fim do mês (${endOfMonth.toLocaleDateString('pt-BR')})`;
  };

  const getExpirationColor = (dateString?: string) => {
    if (!dateString) return 'text-gray-500';
    
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const diffTime = endOfMonth.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'text-red-600';
    if (diffDays <= 3) return 'text-orange-600';
    if (diffDays <= 7) return 'text-yellow-600';
    
    return 'text-green-600';
  };

  if (balance.available_balance <= 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Gift size={20} className="text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">Cashback disponível</p>
            <p className="font-semibold text-gray-800">{formatPrice(Math.max(0, balance.available_balance))}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Faça pedidos e ganhe 5% de cashback! O cashback expira 31 dias após o registro da compra.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-2">
            <Gift size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Cashback disponível</p>
            <p className="text-xl font-bold text-green-800">{formatPrice(Math.max(0, balance.available_balance))}</p>
            {balance.expiring_amount > 0 && balance.expiration_date && (
              <p className="text-xs text-orange-600 font-medium mt-1">
                {formatPrice(balance.expiring_amount)} expira nos próximos 7 dias
              </p>
            )}
          </div>
        </div>
        <TrendingUp size={24} className="text-green-600" />
      </div>

      {balance.expiration_date && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200">
          <Clock size={14} className={getExpirationColor(balance.expiration_date)} />
          <p className={`text-xs font-medium ${getExpirationColor(balance.expiration_date)}`}>
            {formatExpirationDate(balance.expiration_date)}
          </p>
        </div>
      )}

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Gift size={14} className="text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">ℹ️ Como funciona o Cashback Mensal:</p>
            <ul className="space-y-1">
              <li>• <strong>Ganhe 5%</strong> de cashback em cada compra</li>
              <li>• <strong>Válido apenas no mês atual</strong> da compra</li>
              <li>• <strong>Zera automaticamente</strong> no início de cada mês</li>
              <li>• <strong>Use como desconto</strong> em novos pedidos</li>
              <li>• <strong>Saldo mostrado:</strong> apenas do mês atual</li>
            </ul>
          </div>
        </div>
      </div>
      
      {balance.expiring_amount > 0 && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-800">
            <strong>⚠️ Atenção:</strong> Todo seu saldo ({formatPrice(balance.expiring_amount)}) expira no fim do mês!
          </p>
        </div>
      )}
    </div>
  );
};

export default CashbackDisplay;