import React, { useState } from 'react';
import { Gift, RefreshCw, AlertTriangle, Users, DollarSign, Calendar, Check, X } from 'lucide-react';
import { useCashback } from '../../hooks/useCashback';

const CashbackManagementPanel: React.FC = () => {
  const { resetExpiredCashbackBalances, executeMonthlyReset, fixNegativeBalances } = useCashback();
  const [loading, setLoading] = useState(false);
  const [lastReset, setLastReset] = useState<Date | null>(null);
  const [resetResult, setResetResult] = useState<any>(null);

  const handleResetExpiredBalances = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá resetar os saldos de cashback expirados de TODOS os clientes.\n\nIsso significa:\n• Saldos serão recalculados baseados apenas no mês atual\n• Cashback de meses anteriores será removido\n• Esta ação não pode ser desfeita\n\nTem certeza que deseja continuar?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Executando reset de saldos expirados...');
      const result = await resetExpiredCashbackBalances();
      
      setResetResult(result);
      setLastReset(new Date());
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Reset de cashback concluído! ${result.reset_customers} clientes atualizados.
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Erro ao resetar saldos:', error);
      alert(`Erro ao resetar saldos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFixNegativeBalances = async () => {
    if (!confirm('Tem certeza que deseja corrigir todos os saldos negativos de cashback?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await fixNegativeBalances();
      alert(`✅ Saldos negativos corrigidos! ${result.fixed_count} registros atualizados.`);
    } catch (error) {
      console.error('❌ Erro ao corrigir saldos negativos:', error);
      alert(`Erro ao corrigir saldos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReset = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação executará o reset mensal automático de cashback.\n\nIsso irá:\n• Zerar todos os saldos de cashback\n• Criar registros de fechamento mensal\n• Esta ação é irreversível\n\nTem certeza que deseja continuar?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await executeMonthlyReset();
      alert('✅ Reset mensal executado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar reset mensal:', error);
      alert(`Erro ao executar reset mensal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Gift size={24} className="text-yellow-600" />
            Gerenciamento de Cashback
          </h2>
          <p className="text-gray-600">Gerencie saldos e execute operações de manutenção</p>
          {lastReset && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Check size={14} className="text-green-500" />
              Último reset: {lastReset.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Reset Result */}
      {resetResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Check size={20} className="text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800 mb-2">✅ Reset Concluído com Sucesso</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Clientes processados:</strong> {resetResult.processed_customers}</p>
                <p><strong>Saldos atualizados:</strong> {resetResult.reset_customers}</p>
                <p><strong>Sem alterações:</strong> {resetResult.processed_customers - resetResult.reset_customers}</p>
                <p className="text-green-600 font-medium">{resetResult.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCw size={20} className="text-blue-600" />
          Operações de Manutenção
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reset Expired Balances */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <Calendar size={20} className="text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Reset Saldos Expirados</h4>
                <p className="text-sm text-gray-600">Atualizar saldos baseados no mês atual</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  <strong>O que faz:</strong> Recalcula o saldo de todos os clientes baseado apenas nas transações do mês atual, removendo cashback expirado.
                </p>
              </div>
              
              <button
                onClick={handleResetExpiredBalances}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Resetar Saldos Expirados
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fix Negative Balances */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 rounded-full p-2">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Corrigir Saldos Negativos</h4>
                <p className="text-sm text-gray-600">Zerar saldos negativos no sistema</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs text-red-800">
                  <strong>O que faz:</strong> Identifica e corrige saldos negativos, definindo-os como zero para evitar erros no sistema.
                </p>
              </div>
              
              <button
                onClick={handleFixNegativeBalances}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Corrigir Negativos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monthly Reset */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 rounded-full p-2">
                <RefreshCw size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Reset Mensal</h4>
                <p className="text-sm text-gray-600">Executar reset automático mensal</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <p className="text-xs text-purple-800">
                  <strong>O que faz:</strong> Executa o reset mensal automático que normalmente acontece no início de cada mês.
                </p>
              </div>
              
              <button
                onClick={handleMonthlyReset}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Reset Mensal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Gift size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como funciona o Cashback Mensal</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Cashback de 5%</strong> é creditado automaticamente em cada compra</li>
              <li>• <strong>Válido apenas no mês atual</strong> - expira no último dia do mês</li>
              <li>• <strong>Reset automático</strong> acontece no dia 1º de cada mês às 00:00</li>
              <li>• <strong>Saldos negativos</strong> são automaticamente corrigidos para zero</li>
              <li>• <strong>Transações antigas</strong> não afetam o saldo do mês atual</li>
              <li>• <strong>Use "Reset Saldos Expirados"</strong> para sincronizar saldos manualmente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warning Panel */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800 mb-2">⚠️ Cuidados Importantes</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• <strong>Backup recomendado</strong> antes de executar operações de reset</li>
              <li>• <strong>Operações irreversíveis</strong> - não podem ser desfeitas</li>
              <li>• <strong>Teste em ambiente de desenvolvimento</strong> primeiro</li>
              <li>• <strong>Comunique aos clientes</strong> sobre mudanças nos saldos</li>
              <li>• <strong>Execute fora do horário de pico</strong> para evitar conflitos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashbackManagementPanel;