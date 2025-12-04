import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, AlertCircle, Layers } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto', changeFor?: number, mixedPayments?: MixedPayment[]) => void;
  totalAmount: number;
  disableConfirm?: boolean;
}

interface MixedPayment {
  method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
  amount: number;
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
  const [mixedPayments, setMixedPayments] = useState<MixedPayment[]>([
    { method: 'dinheiro', amount: 0 }
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleConfirm = () => {
    onConfirm(paymentMethod, changeFor, paymentMethod === 'misto' ? mixedPayments : undefined);
  };

  const isFormValid = () => {
    if (paymentMethod === 'misto') {
      const total = mixedPayments.reduce((sum, p) => sum + p.amount, 0);
      return total >= totalAmount && mixedPayments.every(p => p.amount > 0);
    }
    return !!paymentMethod;
  };

  const addMixedPayment = () => {
    setMixedPayments([...mixedPayments, { method: 'dinheiro', amount: 0 }]);
  };

  const removeMixedPayment = (index: number) => {
    if (mixedPayments.length > 1) {
      setMixedPayments(mixedPayments.filter((_, i) => i !== index));
    }
  };

  const updateMixedPayment = (index: number, field: 'method' | 'amount', value: any) => {
    const updated = [...mixedPayments];
    updated[index] = { ...updated[index], [field]: value };
    setMixedPayments(updated);
  };

  const getMixedPaymentTotal = () => {
    return mixedPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getMixedPaymentRemaining = () => {
    return Math.max(0, totalAmount - getMixedPaymentTotal());
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'dinheiro':
        return <Banknote size={20} className="text-green-600" />;
      case 'pix':
        return <QrCode size={20} className="text-blue-600" />;
      case 'cartao_credito':
        return <CreditCard size={20} className="text-purple-600" />;
      case 'cartao_debito':
        return <CreditCard size={20} className="text-orange-600" />;
      default:
        return <CreditCard size={20} />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'dinheiro':
        return 'Dinheiro';
      case 'pix':
        return 'PIX';
      case 'cartao_credito':
        return 'Cartão de Crédito';
      case 'cartao_debito':
        return 'Cartão de Débito';
      default:
        return method;
    }
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
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Pagamento Misto</p>
                    <p className="text-sm text-blue-700">
                      Divida o pagamento entre diferentes formas. O total deve ser igual ou maior que {formatPrice(totalAmount)}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {mixedPayments.map((payment, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Pagamento {index + 1}
                      </span>
                      {mixedPayments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMixedPayment(index)}
                          className="ml-auto text-red-600 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Forma de Pagamento
                        </label>
                        <select
                          value={payment.method}
                          onChange={(e) => updateMixedPayment(index, 'method', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Valor
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={payment.amount || ''}
                          onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-sm">
                      {getPaymentMethodIcon(payment.method)}
                      <span className="text-gray-600">
                        {getPaymentMethodName(payment.method)}: {formatPrice(payment.amount)}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMixedPayment}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  + Adicionar outra forma de pagamento
                </button>
              </div>

              <div className={`border rounded-xl p-4 ${
                getMixedPaymentRemaining() > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              }`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Total a pagar:</span>
                    <span className="font-semibold text-gray-800">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Total configurado:</span>
                    <span className={`font-semibold ${getMixedPaymentTotal() >= totalAmount ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(getMixedPaymentTotal())}
                    </span>
                  </div>
                  {getMixedPaymentRemaining() > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-700">Falta configurar:</span>
                        <span className="font-semibold text-red-600">{formatPrice(getMixedPaymentRemaining())}</span>
                      </div>
                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-red-200">
                        <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700">
                          <strong>Atenção:</strong> O valor total configurado é menor que o valor do pedido. Adicione mais {formatPrice(getMixedPaymentRemaining())} para completar o pagamento.
                        </p>
                      </div>
                    </>
                  )}
                  {getMixedPaymentTotal() > totalAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Troco:</span>
                      <span className="font-semibold text-green-600">{formatPrice(getMixedPaymentTotal() - totalAmount)}</span>
                    </div>
                  )}
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
            disabled={!isFormValid()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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