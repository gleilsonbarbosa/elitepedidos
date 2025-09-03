import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Package, 
  DollarSign, 
  Settings,
  Truck, 
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  User,
  LogOut,
  Users
} from 'lucide-react';
import AttendantPanel from './Orders/AttendantPanel'; 
import PDVSalesScreen from './PDV/PDVSalesScreen';
import CashRegisterMenu from './PDV/CashRegisterMenu';
import SalesHistoryPanel from './Orders/SalesHistoryPanel';
import TableSalesPanel from './TableSales/TableSalesPanel';
import { usePermissions } from '../hooks/usePermissions';
import { useScale } from '../hooks/useScale';
import { useOrders } from '../hooks/useOrders';
import { usePDVCashRegister } from '../hooks/usePDVCashRegister';
import { useStoreHours } from '../hooks/useStoreHours';
import { PDVOperator } from '../types/pdv';

// Função auxiliar para verificar se é admin
const isUserAdmin = (operator?: PDVOperator): boolean => {
  if (!operator) return false;
  
  // Verificar TODAS as condições possíveis para admin
  const isAdminByCode = operator.code?.toUpperCase() === 'ADMIN';
  const isAdminByUsername = operator.username?.toUpperCase() === 'ADMIN';
  const isAdminByName = operator.name?.toUpperCase().includes('ADMIN');
  const isAdminByRole = operator.role === 'admin';
  const isAdminById = operator.id === '1' || operator.id === '00000000-0000-0000-0000-000000000001';
  
  const result = isAdminByCode || isAdminByUsername || isAdminByName || isAdminByRole || isAdminById;
  
  console.log('🔍 isUserAdmin check:', {
    operatorId: operator.id,
    operatorCode: operator.code,
    operatorUsername: operator.username,
    operatorName: operator.name,
    operatorRole: operator.role,
    isAdminByCode,
    isAdminByUsername,
    isAdminByName,
    isAdminByRole,
    isAdminById,
    finalResult: result
  });
  
  return result;
};

interface UnifiedAttendancePanelProps {
  operator?: PDVOperator;
  storeSettings?: any;
  scaleHook?: ReturnType<typeof useScale>;
  onLogout?: () => void;
}

const UnifiedAttendancePage: React.FC<UnifiedAttendancePanelProps> = ({ operator, storeSettings, scaleHook, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'cash' | 'tables' | 'history'>('sales');
  const { hasPermission } = usePermissions(operator);
  const { storeSettings: localStoreSettings } = useStoreHours();
  const { isOpen: isCashRegisterOpen, currentRegister } = usePDVCashRegister();
  const scale = useScale();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  
  // Check if user is admin - mais permissivo
  const isAdmin = isUserAdmin(operator);

  // Calculate pending orders count from the orders data
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;

  // Recarregar permissões quando a aba muda
  useEffect(() => {
    if (operator) {
      console.log('🔄 Verificando permissões atualizadas para:', operator.name, 'na aba:', activeTab);
      console.log('📋 Permissões atuais do operador:', operator.permissions);
      
      // Forçar recarregamento das permissões do banco quando mudar de aba
      const reloadPermissions = async () => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseKey && 
              !supabaseUrl.includes('placeholder') && 
              !supabaseKey.includes('placeholder')) {
            
            console.log('🔍 Buscando permissões atualizadas do banco para operador:', operator.id);
            
            const { data: updatedUser, error } = await supabase
              .from('attendance_users')
              .select('*')
              .eq('id', operator.id)
              .single();
            
            if (!error && updatedUser) {
              console.log('🔄 Permissões recarregadas do banco para', updatedUser.name, ':', updatedUser.permissions);
              
              // Verificar se as permissões mudaram
              if (JSON.stringify(updatedUser.permissions) !== JSON.stringify(operator.permissions)) {
                console.log('📊 Permissões diferentes detectadas!');
                console.log('📋 Permissões antigas:', operator.permissions);
                console.log('📋 Permissões novas:', updatedUser.permissions);
                console.log('🔄 Atualizando sessão e recarregando página...');
                
                // Atualizar sessão com permissões atualizadas
                const currentSession = JSON.parse(localStorage.getItem('attendance_session') || '{}');
                if (currentSession.user) {
                  currentSession.user = updatedUser;
                  localStorage.setItem('attendance_session', JSON.stringify(currentSession));
                  
                  // Forçar reload da página para aplicar novas permissões
                  console.log('🔄 Recarregando página em 1 segundo para aplicar novas permissões...');
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              } else {
                console.log('✅ Permissões estão sincronizadas');
              }
            } else if (error) {
              console.error('❌ Erro ao buscar permissões atualizadas:', error);
            }
          }
        } catch (err) {
          console.warn('⚠️ Erro ao recarregar permissões:', err);
        }
      };
      
      // Delay para evitar múltiplas chamadas
      const timeoutId = setTimeout(reloadPermissions, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, operator]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 UnifiedAttendancePage - Estado completo:', {
      operator: operator ? {
        id: operator.id || 'no-id',
        username: operator.username || 'no-username',
        name: operator.name || 'no-name', 
        code: operator.code || 'no-code',
        role: operator.role || 'no-role',
        permissions: operator.permissions || {}
      } : 'No operator',
      isAdmin,
      activeTab,
      isCashRegisterOpen,
      pendingOrdersCount,
      ordersLoading,
      ordersError,
      totalOrders: orders.length
    });
  }, [operator, isAdmin, activeTab, isCashRegisterOpen, pendingOrdersCount, ordersLoading, ordersError, orders.length]);

  const settings = storeSettings || localStoreSettings;
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo elite.jpeg" 
                alt="Elite Açaí Logo" 
                className="w-12 h-12 object-contain bg-white rounded-full p-1 border-2 border-green-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="bg-green-100 rounded-full p-2">
                <ShoppingBag size={24} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Atendimento Unificado</h1>
                <p className="text-gray-600">Elite Açaí - Vendas, Pedidos e Caixa</p>
              </div>
            </div>
            
            {/* User info and logout */}
            {operator && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <User size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700" title={`Código: ${operator.code}`}>
                    {operator.name}
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                    title="Sair do sistema"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="max-w-7xl mx-auto px-4 mt-6 print:hidden">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Sistema em Modo Demonstração</h3>
                <p className="text-yellow-700 text-sm">
                  O Supabase não está configurado. Algumas funcionalidades estarão limitadas.
                  Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acesso completo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Warning */}
      {supabaseConfigured && !isCashRegisterOpen && activeTab === 'sales' && (
        <div className="max-w-7xl mx-auto px-4 mt-6 print:hidden">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Caixa Fechado</h3>
                <p className="text-yellow-700 text-sm">
                  Não é possível realizar vendas sem um caixa aberto.
                  Por favor, abra um caixa primeiro na aba "Caixas".
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 print:hidden">
          <div className="flex flex-wrap gap-4">
            {(isAdmin || hasPermission('can_view_sales')) && (
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'sales'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calculator size={20} />
                Vendas
              </button>
            )}
            
            {(isAdmin || hasPermission('can_view_orders')) && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 relative ${
                  activeTab === 'orders'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Truck size={20} />
                Pedidos
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            )}
            
            {(isAdmin || 
              hasPermission('can_view_cash_register')) && (
              <button
                onClick={() => setActiveTab('cash')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'cash'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <DollarSign size={20} />
                Caixas
              </button>
            )}
            
            {(isAdmin || hasPermission('can_view_sales')) && (
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'tables'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users size={20} />
                Mesas
              </button>
            )}
            
            {(isAdmin || hasPermission('can_view_sales')) && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ShoppingBag size={20} />
                Histórico
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300 print:hidden">
          {activeTab === 'sales' && (isAdmin || hasPermission('can_view_sales')) && <PDVSalesScreen operator={operator} scaleHook={scaleHook || scale} storeSettings={settings} isAdmin={isAdmin} />}
          {activeTab === 'orders' && (isAdmin || hasPermission('can_view_orders')) && <AttendantPanel storeSettings={settings} operator={operator} />}
          {activeTab === 'cash' && (
            <div>
              {(isAdmin || hasPermission('can_view_cash_register')) ? (
                <CashRegisterMenu isAdmin={isAdmin} operator={operator} />
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                    <DollarSign size={32} className="text-red-600 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Acesso Negado ao Caixa</h3>
                  <p className="text-gray-600 mb-4">
                    Você não tem permissão para acessar o controle de caixa.
                  </p>
                  
                  {/* Debug Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-medium text-gray-800 mb-2">🐛 Debug - Informações do Usuário:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Nome:</strong> {operator?.name || 'N/A'}</p>
                      <p><strong>Username:</strong> {operator?.username || 'N/A'}</p>
                      <p><strong>ID:</strong> {operator?.id || 'N/A'}</p>
                      <p><strong>Role:</strong> {operator?.role || 'N/A'}</p>
                      <p><strong>Is Admin:</strong> {isAdmin ? 'Sim' : 'Não'}</p>
                      <p><strong>can_view_cash_register:</strong> {operator?.permissions?.can_view_cash_register ? 'Sim' : 'Não'}</p>
                      <p><strong>Todas as permissões:</strong></p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(operator?.permissions || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">💡 Como Liberar Acesso:</h4>
                    <ol className="text-sm text-yellow-700 space-y-1 text-left">
                      <li>1. Acesse <strong>/administrativo</strong> (admin / elite2024)</li>
                      <li>2. Vá na aba <strong>"Usuários"</strong></li>
                      <li>3. Edite o usuário <strong>"{operator?.name}"</strong></li>
                      <li>4. Marque a permissão <strong>"Visualizar Caixa"</strong></li>
                      <li>5. Salve as alterações</li>
                      <li>6. Faça logout e login novamente aqui</li>
                      <li>7. <strong>OU</strong> clique no botão abaixo para forçar atualização</li>
                    </ol>
                    
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🔄 Recarregar Página
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'tables' && (isAdmin || hasPermission('can_view_sales')) && <TableSalesPanel storeId={1} operatorName={operator?.name} isCashRegisterOpen={isCashRegisterOpen} isAdmin={isAdmin} />}
          {activeTab === 'history' && (isAdmin || hasPermission('can_view_sales')) && <SalesHistoryPanel storeId={1} operator={operator} isAdmin={isAdmin} />}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAttendancePage;