import React, { useState, useEffect } from 'react';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { usePermissions } from '../../hooks/usePermissions';
import { useAttendance } from '../../hooks/useAttendance';
import PermissionGuard from '../PermissionGuard';
import { 
  DollarSign, FileText,
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  ShoppingBag, 
  Clock, 
  Save, 
  Printer, 
  Minus, 
  X, 
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings,
  Edit3,
  Trash2
} from 'lucide-react';
import { PDVOperator } from '../../types/pdv';
import CashRegisterDetails from './CashRegisterDetails';
import CashRegisterCloseConfirmation from './CashRegisterCloseConfirmation';
import { supabase } from '../../lib/supabase';

import CashRegisterCloseDialog from './CashRegisterCloseDialog';
import CashRegisterPrintView from './CashRegisterPrintView';

interface CashRegisterMenuProps {
  isAdmin?: boolean;
  operator?: PDVOperator;
}

const CashRegisterMenu: React.FC<CashRegisterMenuProps> = ({ isAdmin = false, operator }) => {
  const { hasPermission } = usePermissions();
  const { session } = useAttendance();
  const {
    isOpen,
    currentRegister,
    summary,
    entries,
    loading,
    error,
    openCashRegister,
    closeCashRegister,
    addCashEntry,
    refreshData
  } = usePDVCashRegister();

  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [showCashEntry, setShowCashEntry] = useState(false);
  const [showBillCounting, setShowBillCounting] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState('dinheiro');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [closedRegister, setClosedRegister] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [editEntryType, setEditEntryType] = useState<'income' | 'expense'>('income');
  const [editEntryAmount, setEditEntryAmount] = useState(0);
  const [editEntryDescription, setEditEntryDescription] = useState('');
  const [editEntryPaymentMethod, setEditEntryPaymentMethod] = useState('dinheiro');
  const [saving, setSaving] = useState(false);
  
  // Get current user from attendance session if operator is not provided
  const currentUser = operator || (session.isAuthenticated ? session.user : null);
  
  // Check permissions using the current user
  const canEditEntries = isAdmin || 
                         (currentUser && currentUser.permissions?.can_edit_cash_entries) ||
                         hasPermission('can_edit_cash_entries');
                         
  const canDeleteEntries = isAdmin || 
                          (currentUser && currentUser.permissions?.can_delete_cash_entries) ||
                          hasPermission('can_delete_cash_entries');

  console.log('🔍 CashRegisterMenu - Verificação de permissões:', {
    operator: operator ? { name: operator.name, code: operator.code } : 'No operator',
    sessionUser: session.user ? { username: session.user.username, name: session.user.name } : 'No session user',
    currentUser: currentUser ? { name: currentUser.name, username: currentUser.username } : 'No current user',
    isAdmin,
    canEditEntries,
    canDeleteEntries,
    userPermissions: currentUser?.permissions
  });

  // Check Supabase configuration on mount
  React.useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const [billCounts, setBillCounts] = useState({
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '2': 0,
    '1': 0,
    '0.50': 0,
    '0.25': 0,
    '0.10': 0,
    '0.05': 0,
    '0.01': 0
  });

  const billValues = [
    { value: '200', label: 'R$ 200,00', color: 'bg-purple-100' },
    { value: '100', label: 'R$ 100,00', color: 'bg-blue-100' },
    { value: '50', label: 'R$ 50,00', color: 'bg-yellow-100' },
    { value: '20', label: 'R$ 20,00', color: 'bg-orange-100' },
    { value: '10', label: 'R$ 10,00', color: 'bg-red-100' },
    { value: '5', label: 'R$ 5,00', color: 'bg-green-100' },
    { value: '2', label: 'R$ 2,00', color: 'bg-gray-100' },
    { value: '1', label: 'R$ 1,00', color: 'bg-yellow-50' },
    { value: '0.50', label: 'R$ 0,50', color: 'bg-gray-50' },
    { value: '0.25', label: 'R$ 0,25', color: 'bg-gray-50' },
    { value: '0.10', label: 'R$ 0,10', color: 'bg-gray-50' },
    { value: '0.05', label: 'R$ 0,05', color: 'bg-gray-50' },
    { value: '0.01', label: 'R$ 0,01', color: 'bg-gray-50' }
  ];

  const calculateBillTotal = () => {
    return Object.entries(billCounts).reduce((total, [value, count]) => {
      return total + (parseFloat(value) * count);
    }, 0);
  };

  const handleOpenRegister = async () => {
    if (!openingAmount) return;
    
    console.log('🚀 Abrindo caixa com valor:', parseFloat(openingAmount));
    try {
      await openCashRegister(parseFloat(openingAmount));
      setShowOpenRegister(false);
      setOpeningAmount('');
    } catch (err) {
      console.error('Erro ao abrir caixa:', err);
    }
  };

  const handleCloseRegister = async () => {
    setShowCloseConfirmation(true);
  };

  const handleConfirmClose = async (closingAmount: number, shouldPrint: boolean = false) => {
    setIsClosing(true);
    setShowCloseConfirmation(false);
    
    try {
      console.log('🔒 Fechando caixa com valor:', closingAmount);
      console.log('📊 Summary antes do fechamento:', summary);
      const result = await closeCashRegister(closingAmount);
      
      if (result.success) {
        // Criar objeto do caixa fechado com todos os dados necessários
        setClosedRegister({
          ...(currentRegister || {}),
          closing_amount: closingAmount,
          closed_at: new Date().toISOString(),
          difference: closingAmount - (summary?.expected_balance || 0),
          id: currentRegister?.id || 'unknown'
        });
        
        if (shouldPrint) {
          setShowPrintView(true);
        } else {
          setShowCloseDialog(true);
        }
      } else {
        alert(`Erro ao fechar caixa: ${result.error}`);
      }
    } catch (err) {
      console.error('Erro ao fechar caixa:', err);
      alert('Erro ao fechar caixa. Tente novamente.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCashEntry = async () => {
    if (!entryAmount || !entryDescription) return;
    
    console.log('💰 Adicionando entrada ao caixa:', {
      type: entryType,
      amount: parseFloat(entryAmount),
      description: entryDescription,
      payment_method: entryPaymentMethod
    });
    
    try {
      await addCashEntry({
        type: entryType,
        amount: parseFloat(entryAmount),
        description: entryDescription,
        payment_method: entryPaymentMethod
      });
      setShowCashEntry(false);
      setEntryAmount('');
      setEntryDescription('');
      setEntryType('income');
      setEntryPaymentMethod('dinheiro');
    } catch (err) {
      console.error('Erro ao adicionar entrada:', err);
    }
  };

  const handleDeleteEntry = async (entryId: string, description: string) => {
    if (confirm(`Tem certeza que deseja excluir a movimentação "${description}"?`)) {
      try {
        if (!supabaseConfigured) {
          alert('Funcionalidade requer configuração do Supabase');
          return;
        }

        const { error } = await supabase
          .from('pdv_cash_entries')
          .delete()
          .eq('id', entryId);

        if (error) throw error;

        // Refresh data
        refreshData();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Movimentação excluída com sucesso!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } catch (error) {
        console.error('Erro ao excluir movimentação:', error);
        alert('Erro ao excluir movimentação');
      }
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) {
      console.error('❌ Nenhuma entrada sendo editada');
      return;
    }

    setSavingEntry(true);
    try {
      if (!supabaseConfigured) {
        alert('Funcionalidade requer configuração do Supabase');
        return;
      }

      const { error } = await supabase
        .from('pdv_cash_entries')
        .update({
          payment_method: editingEntry.payment_method
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      console.log('✅ Movimentação editada com sucesso');
      setEditingEntry(null);
      refreshData();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Movimentação editada com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao editar movimentação:', error);
      alert('Erro ao editar movimentação');
    } finally {
      setSavingEntry(false);
    }
  };

  const openEditModal = (entry: any) => {
    console.log('📝 Abrindo modal de edição para entrada:', entry);
    setEditingEntry({
      ...entry,
      // Garantir que todos os campos estão presentes
      type: entry.type || 'income',
      amount: entry.amount || 0,
      description: entry.description || '',
      payment_method: entry.payment_method || 'dinheiro'
    });
  };

  const updateBillCount = (value: string, increment: boolean) => {
    setBillCounts(prev => ({
      ...prev,
      [value]: Math.max(0, prev[value] + (increment ? 1 : -1))
    }));
  };

  const resetBillCounts = () => {
    setBillCounts({
      '200': 0,
      '100': 0,
      '50': 0,
      '20': 0,
      '10': 0,
      '5': 0,
      '2': 0,
      '1': 0,
      '0.50': 0,
      '0.25': 0,
      '0.10': 0,
      '0.05': 0,
      '0.01': 0
    });
  };

  const applyBillTotal = () => {
    const total = calculateBillTotal();
    if (showCloseRegister) {
      setClosingAmount(total.toFixed(2));
    } else {
      setOpeningAmount(total.toFixed(2));
    }
    setShowBillCounting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission="can_access_cash_register">
      <div className="space-y-6">
        {!supabaseConfigured && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-800">Configuração Necessária</h3>
                <p className="text-sm text-red-600 mt-1">
                  Configure as variáveis de ambiente do Supabase para usar o controle de caixa.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <DollarSign size={24} />
              Controle de Caixa
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie abertura, fechamento e movimentações do caixa
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
            
            {isOpen && (
              <button
                onClick={handleCloseRegister}
                disabled={!supabaseConfigured}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <ArrowDownCircle size={16} />
                Fechar Caixa
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${isOpen ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status do Caixa</p>
                <p className={`text-lg font-semibold ${isOpen ? 'text-green-600' : 'text-gray-600'}`}>
                  {isOpen ? 'Aberto' : 'Fechado'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${isOpen ? 'bg-green-100' : 'bg-gray-100'}`}>
                <DollarSign className={`h-6 w-6 ${isOpen ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>

          {currentRegister && (
            <>
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor de Abertura</p>
                    <p className="text-lg font-semibold text-blue-600">
                      R$ {currentRegister.opening_amount?.toFixed(2) || '0,00'}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100">
                    <ArrowUpCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                    <p className="text-lg font-semibold text-purple-600" title="Saldo esperado em dinheiro">
                      {formatPrice(summary.expected_balance)}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-purple-100">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!isOpen && (
            <button
              onClick={() => setShowOpenRegister(true)}
              disabled={!supabaseConfigured}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              Abrir Caixa
            </button>
          )}

          {isOpen && supabaseConfigured && (
            <>
              <button
                onClick={() => setShowCashEntry(true)}
                disabled={!hasPermission('can_manage_cash_entries') && !isAdmin}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowDownCircle size={18} />
                Adicionar Entrada
              </button>

              <button
                onClick={() => {
                  setEntryType('expense');
                  setShowCashEntry(true);
                }}
                disabled={!hasPermission('can_manage_cash_entries') && !isAdmin}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowUpCircle size={18} />
                Adicionar Saída
              </button>
            </>
          )}
        </div>

        {/* Close Confirmation Modal */}
        <CashRegisterCloseConfirmation
          isOpen={showCloseConfirmation}
          onClose={() => setShowCloseConfirmation(false)}
          onConfirm={handleConfirmClose}
          register={currentRegister}
          summary={summary}
          isProcessing={isClosing}
        />

        {/* Close Success Dialog */}
        <CashRegisterCloseDialog
          isOpen={showCloseDialog}
          onClose={() => setShowCloseDialog(false)}
          onCloseAll={() => {
            setShowCloseDialog(false);
            setShowPrintView(false);
            setClosedRegister(null);
          }}
          register={closedRegister}
          summary={summary}
          onPrint={() => setShowPrintView(true)}
          onViewDailyReport={() => {
            localStorage.setItem('pdv_active_screen', 'daily_cash_report');
            window.location.href = '/pdv/app?screen=daily_cash_report';
          }}
        />

        {/* Print View Modal */}
        {showPrintView && closedRegister && (
          <CashRegisterPrintView
            register={closedRegister}
            summary={summary}
            entries={entries}
            onClose={() => setShowPrintView(false)}
          />
        )}

        {/* Cash Register Details */}
        {currentRegister && (
          <>
            <CashRegisterDetails register={currentRegister} summary={summary} onRefresh={refreshData} />
            
            {/* Histórico de Movimentações */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Histórico de Movimentações</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Data/Hora</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Forma</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{new Date(entry.created_at).toLocaleString('pt-BR')}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {entry.type === 'income' ? (
                              <ArrowDownCircle size={16} className="text-green-600" />
                            ) : (
                              <ArrowUpCircle size={16} className="text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.type === 'income' ? 'Entrada' : 'Saída'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-800">
                            <div className="font-medium">{entry.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{getPaymentMethodName(entry.payment_method)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-semibold ${
                            entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.type === 'income' ? '+' : '-'}
                            {formatPrice(entry.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {(isAdmin || canEditEntries) && (
                              <button
                                onClick={() => openEditModal(entry)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar movimentação"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            {(isAdmin || canDeleteEntries) && (
                              <button
                                onClick={() => handleDeleteEntry(entry.id, entry.description)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Excluir movimentação"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {entries.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhuma movimentação registrada</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Edit Entry Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Editar Movimentação
                  </h2>
                  <button
                    onClick={() => setEditingEntry(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  {isAdmin ? (
                    <select
                      value={editingEntry.type}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        type: e.target.value as 'income' | 'expense'
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="income">Entrada</option>
                      <option value="expense">Saída</option>
                    </select>
                  ) : (
                    <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                      {editingEntry.type === 'income' ? 'Entrada' : 'Saída'}
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas administradores podem alterar o tipo
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  {isAdmin ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editingEntry.amount}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        amount: parseFloat(e.target.value) || 0
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                      required
                    />
                  ) : (
                    <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                      {formatPrice(editingEntry.amount)}
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas administradores podem alterar o valor
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  {isAdmin ? (
                    <textarea
                      value={editingEntry.description}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        description: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Descreva a movimentação..."
                      required
                    />
                  ) : (
                    <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 min-h-[80px]">
                      {editingEntry.description}
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas administradores podem alterar a descrição
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento * {!isAdmin && <span className="text-green-600">(Editável)</span>}
                  </label>
                  <select
                    value={editingEntry.payment_method}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      payment_method: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="voucher">Voucher</option>
                    <option value="misto">Misto</option>
                  </select>
                  {!isAdmin && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Você pode editar apenas a forma de pagamento
                    </p>
                  )}
                </div>

                {!isAdmin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Permissão Limitada</p>
                        <p>Como atendente, você pode editar apenas a forma de pagamento desta movimentação.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditEntry}
                  disabled={savingEntry || !canEditEntries}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {savingEntry ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isAdmin ? 'Salvar Alterações' : 'Salvar Forma de Pagamento'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open Cash Register Modal */}
        {showOpenRegister && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Abrir Caixa
                  </h2>
                  <button
                    onClick={() => setShowOpenRegister(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de Abertura (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                    autoFocus
                  />
                </div>

                <button
                  onClick={() => setShowBillCounting(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <DollarSign size={16} />
                  Contar Dinheiro
                </button>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowOpenRegister(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOpenRegister}
                  disabled={!openingAmount}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Abrir Caixa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cash Entry Modal */}
        {showCashEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {entryType === 'income' ? 'Adicionar Entrada' : 'Adicionar Saída'}
                  </h2>
                  <button
                    onClick={() => setShowCashEntry(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as 'income' | 'expense')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">Entrada</option>
                    <option value="expense">Saída</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={entryDescription}
                    onChange={(e) => setEntryDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Descreva a movimentação..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={entryPaymentMethod}
                    onChange={(e) => setEntryPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="voucher">Voucher</option>
                    <option value="misto">Misto</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowCashEntry(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCashEntry}
                  disabled={!entryAmount || !entryDescription}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bill Counting Modal */}
        {showBillCounting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Contar Dinheiro
                  </h2>
                  <button
                    onClick={() => setShowBillCounting(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {billValues.map((bill) => (
                    <div key={bill.value} className={`p-4 rounded-lg border-2 ${bill.color}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{bill.label}</span>
                        <span className="text-sm text-gray-600">
                          {billCounts[bill.value]} un.
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateBillCount(bill.value, false)}
                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {billCounts[bill.value]}
                          </span>
                          <button
                            onClick={() => updateBillCount(bill.value, true)}
                            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="font-semibold text-gray-800">
                          R$ {(parseFloat(bill.value) * billCounts[bill.value]).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-blue-800">Total Contado:</span>
                    <span className="text-xl font-bold text-blue-600">
                      R$ {calculateBillTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={resetBillCounts}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowBillCounting(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyBillTotal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Aplicar Total
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

// Helper function to format payment method names
const getPaymentMethodName = (method: string) => {
  const methods: { [key: string]: string } = {
    'dinheiro': 'Dinheiro',
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'pix': 'PIX',
    'voucher': 'Voucher',
    'misto': 'Misto'
  };
  return methods[method] || method;
};

// Helper function to format price
const formatPrice = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default CashRegisterMenu;