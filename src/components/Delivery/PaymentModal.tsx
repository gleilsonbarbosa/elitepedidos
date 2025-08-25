import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto', changeFor?: number) => void;
  totalAmount: number;
  disableConfirm?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  disableConfirm = false
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
    onConfirm(paymentMethod, changeFor);
  };

  const isFormValid = () => {
    // Always return true if a payment method is selected
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
              Forma de Pagamento
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 font-medium">
              Total a pagar: {formatPrice(totalAmount)}
            </p>
          </div>

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
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="misto"
                  checked={paymentMethod === 'misto'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="text-gray-600 h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm7-5a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4a2 2 0 012-2h8z" />
                  </svg>
                  <span className="font-medium">Pagamento Misto</span>
                </div>
              </label>
            </div>
          </div>

          {paymentMethod === 'dinheiro' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Troco para quanto?
              </label>
              <input
                type="number"
                step="0.01"
                min={totalAmount}
                value={changeFor || ''}
                onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Valor para troco"
              />
              {changeFor && changeFor > totalAmount && (
                <p className="text-sm text-green-600">
                  Troco: {formatPrice(changeFor - totalAmount)}
                </p>
              )}
            </div>
          )}

          {paymentMethod === 'pix' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">PIX Selecionado</p>
                  <p className="text-sm text-blue-700">
                    Chave PIX: 85989041010
                  </p>
                  <p className="text-sm text-blue-700">
                    Nome: Amanda Suyelen da Costa Pereira
                  </p>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'misto' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Pagamento Misto</p>
                  <p className="text-sm text-gray-700">
                    Configure as formas de pagamento na finalização da venda.
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
            disabled={!paymentMethod}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;