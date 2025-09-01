import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, AlertCircle, DollarSign } from 'lucide-react';
import { RestaurantTable, TableSale } from '../../types/table-sales';

interface TablePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: string, changeFor?: number) => void;
  sale: TableSale | null;
  selectedTable: RestaurantTable | null;
  totalAmount: number;
  disableConfirm?: boolean;
  isCashRegisterOpen?: boolean;
}

const TablePaymentModal: React.FC<TablePaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sale,
  selectedTable,
  totalAmount,
  disableConfirm = false,
  isCashRegisterOpen = true
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleConfirm = () => {
    console.log('💳 Confirmando pagamento da mesa:', {
      saleId: sale?.id,
      tableNumber: selectedTable?.number,
      paymentMethod,
      changeFor,
      totalAmount
    });

    // Validar se o caixa está aberto
    if (!isCashRegisterOpen) {
      alert('Erro: Não é possível finalizar vendas sem um caixa aberto. Abra um caixa primeiro na aba "Caixas".');
      return;
    }

    // Validar troco para pagamento em dinheiro
    if (paymentMethod === 'dinheiro' && changeFor && changeFor < totalAmount) {
      alert('O valor para troco deve ser maior ou igual ao total da venda.');
      return;
    }

    onConfirm(paymentMethod, changeFor);
  };

  const isFormValid = () => {
    if (!isCashRegisterOpen) return false;
    if (paymentMethod === 'dinheiro' && changeFor && changeFor < totalAmount) return false;
    return !!paymentMethod;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CreditCard size={24} className="text-blue-600" />
              Pagamento Mesa {selectedTable?.number}
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
          {/* Sale Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Venda #:</span>
                <span className="font-medium text-blue-800">{sale?.sale_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Cliente:</span>
                <span className="font-medium text-blue-800">{sale?.customer_name || 'Não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total a pagar:</span>
                <span className="font-bold text-blue-800 text-lg">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Cash Register Warning */}
          {!isCashRegisterOpen && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Caixa Fechado</p>
                  <p className="text-red-700 text-sm">
                    Não é possível finalizar vendas sem um caixa aberto. 
                    Abra um caixa primeiro na aba "Caixas".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Selecione a forma de pagamento:
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="dinheiro"
                  checked={paymentMethod === 'dinheiro'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-green-600 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <Banknote size={20} className="text-green-600" />
                  <span className="font-medium">Dinheiro</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-blue-600 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <QrCode size={20} className="text-blue-600" />
                  <span className="font-medium">PIX</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cartao_credito"
                  checked={paymentMethod === 'cartao_credito'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-purple-600 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-purple-600" />
                  <span className="font-medium">Cartão de Crédito</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cartao_debito"
                  checked={paymentMethod === 'cartao_debito'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-indigo-600 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-indigo-600" />
                  <span className="font-medium">Cartão de Débito</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="voucher"
                  checked={paymentMethod === 'voucher'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-yellow-600 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium">Voucher</span>
                </div>
              </label>
            </div>
          </div>

          {/* Change for cash payment */}
          {paymentMethod === 'dinheiro' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Troco para quanto? (opcional)
              </label>
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min={totalAmount}
                  value={changeFor || ''}
                  onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={`Mínimo: ${formatPrice(totalAmount)}`}
                />
              </div>
              {changeFor && changeFor > totalAmount && (
                <p className="text-sm text-green-600">
                  Troco: {formatPrice(changeFor - totalAmount)}
                </p>
              )}
              {changeFor && changeFor < totalAmount && (
                <p className="text-sm text-red-600">
                  ⚠️ Valor deve ser maior ou igual ao total da venda
                </p>
              )}
            </div>
          )}

          {/* PIX Info */}
          {paymentMethod === 'pix' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <QrCode size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">PIX Selecionado</p>
                  <p className="text-sm text-blue-700">
                    Chave PIX: 85989041010
                  </p>
                  <p className="text-sm text-blue-700">
                    Nome: Amanda Suyelen da Costa Pereira
                  </p>
                  <p className="text-sm font-bold text-blue-800">
                    Valor: {formatPrice(totalAmount)}
                  </p>
                </div>
              </div>
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
            disabled={!isFormValid() || disableConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            {!isCashRegisterOpen ? 'Caixa Fechado' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePaymentModal; 