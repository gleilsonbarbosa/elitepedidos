import React from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Clock, Package, Truck } from 'lucide-react';
import { PDVCashRegisterSummary } from '../../types/pdv';
import { usePermissions } from '../../hooks/usePermissions';
import { PDVOperator } from '../../types/pdv';

interface CashRegisterDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PDVCashRegisterSummary;
  currentRegister: any;
  operator?: PDVOperator;
}

const CashRegisterDetails: React.FC<CashRegisterDetailsProps> = ({ 
  isOpen, 
  onClose, 
  summary, 
  currentRegister,
  operator 
}) => {
  const { hasPermission } = usePermissions(operator);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatSecureValue = (value: number, permission: keyof PDVOperator['permissions']) => {
    return hasPermission(permission) ? formatPrice(value) : '••••••';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Detalhes do Caixa</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Caixa */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Caixa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Aberto em</p>
                  <p className="font-medium">
                    {currentRegister?.opened_at 
                      ? new Date(currentRegister.opened_at).toLocaleString('pt-BR')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-green-600">
                    {currentRegister?.closed_at ? 'Fechado' : 'Aberto'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo Financeiro</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor de Abertura:</span>
                <span className="font-medium">{formatSecureValue(summary.opening_amount, 'can_view_cash_balance')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendas PDV:</span>
                <span className="font-medium text-green-600">{formatSecureValue(summary.sales_total, 'can_view_sales_totals')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendas Delivery:</span>
                <span className="font-medium text-blue-600">{formatSecureValue(summary.delivery_total, 'can_view_sales_totals')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Outras Entradas:</span>
                <span className="font-medium text-green-600">{formatSecureValue(summary.other_income_total, 'can_view_cash_entries')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total de Saídas:</span>
                <span className="font-medium text-red-600">{formatSecureValue(summary.total_expense, 'can_view_cash_entries')}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Saldo Esperado:</span>
                  <span className="font-bold text-blue-600">{formatSecureValue(summary.expected_balance, 'can_view_expected_balance')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <Package className="mx-auto text-blue-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-800">{summary.sales_count || 0}</p>
              <p className="text-sm text-gray-600">Vendas PDV</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <Truck className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-800">{summary.delivery_count || 0}</p>
              <p className="text-sm text-gray-600">Entregas</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <TrendingUp className="mx-auto text-purple-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-800">{(summary.sales_count || 0) + (summary.delivery_count || 0)}</p>
              <p className="text-sm text-gray-600">Total Transações</p>
            </div>
          </div>

          {/* Movimentações */}
          {hasPermission('can_view_cash_entries') ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Movimentações do Caixa</h3>
              {summary.entries && summary.entries.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {summary.entries.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div>
                        <p className="font-medium text-sm">{entry.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleString('pt-BR')} • {entry.payment_method}
                        </p>
                      </div>
                      <span className={`font-semibold ${
                        entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.type === 'income' ? '+' : '-'}{formatPrice(entry.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Movimentações do Caixa</h3>
              <div className="text-center py-8">
                <div className="bg-gray-200 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">••••••</p>
                <p className="text-gray-400 text-sm">Sem permissão para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashRegisterDetails;