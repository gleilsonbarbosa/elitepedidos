import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  LogOut,
  BarChart3,
  Clock,
  FileText,
  Calculator,
  Utensils,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  User,
  Shield
} from 'lucide-react';
import { PDVOperator } from '../types/pdv';
import { supabase } from '../lib/supabase';
import AttendantPanel from './Orders/AttendantPanel';
import PDVSalesScreen from './PDV/PDVSalesScreen';
import CashRegisterMenu from './PDV/CashRegisterMenu';
import PDVReports from './PDV/PDVReports';
import PDVSalesReport from './PDV/PDVSalesReport';
import PDVDailyCashReport from './PDV/PDVDailyCashReport';
import TableSalesPanel from './TableSales/TableSalesPanel';
import SalesHistoryPanel from './Orders/SalesHistoryPanel';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

interface UnifiedAttendancePageProps {
  operator: PDVOperator;
  onLogout: () => void;
}

type TabType = 'orders' | 'sales' | 'cash' | 'reports' | 'sales-report' | 'cash-report' | 'tables' | 'history';

const UnifiedAttendancePage: React.FC<UnifiedAttendancePageProps> = ({ operator, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const previousCountRef = useRef(0);
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { hasPermission } = usePermissions(operator);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      const soundSettings = localStorage.getItem('orderSoundSettings');
      let soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      let volume = 0.7;

      if (soundSettings) {
        const settings = JSON.parse(soundSettings);
        if (settings.enabled !== false) {
          soundUrl = settings.soundUrl || soundUrl;
          volume = settings.volume || volume;
        } else {
          console.log('🔇 Som de pedidos desabilitado nas configurações');
          return;
        }
      }

      const audio = new Audio(soundUrl);
      audio.volume = volume;
      audio.play().catch(err => {
        console.warn('⚠️ Não foi possível tocar o som:', err);
      });
      console.log('🔔 Som de notificação tocado para badge');
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  };

  // Buscar contagem de pedidos pendentes
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (!error && count !== null) {
          const oldCount = previousCountRef.current;
          console.log('📊 Pedidos pendentes:', count, '(anterior:', oldCount, ')');

          // Tocar som apenas se a contagem aumentou (novo pedido)
          if (count > oldCount && oldCount >= 0) {
            console.log('🆕 Novo pedido pendente detectado! Tocando som...');
            playNotificationSound();
          }

          previousCountRef.current = count;
          setPendingOrdersCount(count);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar pedidos pendentes:', error);
      }
    };

    fetchPendingCount();

    // Configurar realtime para atualizar contagem
    // Monitora TODOS os pedidos (sem filtro) para detectar mudanças de status
    const channel = supabase
      .channel('pending_orders_count')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔄 Mudança detectada na tabela orders:', payload);

          // Verifica se a mudança envolve o status pending
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;

          if (
            payload.eventType === 'INSERT' && newStatus === 'pending' ||
            payload.eventType === 'UPDATE' && (oldStatus === 'pending' || newStatus === 'pending') ||
            payload.eventType === 'DELETE' && oldStatus === 'pending'
          ) {
            console.log('✅ Mudança relevante para pedidos pendentes - Atualizando contagem');
            fetchPendingCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sistema de alertas repetitivos a cada 15 segundos para pedidos pendentes
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (alertIntervalRef.current) {
      console.log('🧹 Limpando intervalo de alerta anterior');
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }

    // Se há pedidos pendentes, iniciar alerta repetitivo
    if (pendingOrdersCount > 0) {
      console.log('⏰ Iniciando alertas a cada 15 segundos para', pendingOrdersCount, 'pedido(s) pendente(s)');

      alertIntervalRef.current = setInterval(async () => {
        // Verificar novamente se ainda há pedidos pendentes antes de tocar
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (count && count > 0) {
          console.log('🔔 Alerta repetitivo: ainda há', count, 'pedido(s) pendente(s)');
          playNotificationSound();
        } else {
          console.log('⏹️ Sem mais pedidos pendentes - parando alertas');
          if (alertIntervalRef.current) {
            clearInterval(alertIntervalRef.current);
            alertIntervalRef.current = null;
          }
        }
      }, 15000); // 15 segundos
    } else {
      console.log('✅ Sem pedidos pendentes - alertas repetitivos PARADOS');
    }

    // Cleanup ao desmontar ou quando a contagem mudar
    return () => {
      if (alertIntervalRef.current) {
        console.log('🧹 Cleanup: parando alertas (contagem mudou para', pendingOrdersCount, ')');
        clearInterval(alertIntervalRef.current);
        alertIntervalRef.current = null;
      }
    };
  }, [pendingOrdersCount]);

  // Debug das permissões
  useEffect(() => {
    console.log('🔍 UnifiedAttendancePage - Operador carregado:', {
      name: operator?.name,
      code: operator?.code,
      role: operator?.role,
      permissions: operator?.permissions ? Object.entries(operator.permissions)
        .filter(([_, value]) => value)
        .map(([key, _]) => key) : 'Sem permissões'
    });
  }, [operator]);

  // Verificar se o usuário tem pelo menos uma permissão básica
  const hasAnyPermission = operator?.permissions && (
    operator.permissions.can_view_orders ||
    operator.permissions.can_view_sales ||
    operator.permissions.can_view_cash_register ||
    operator.permissions.can_view_tables ||
    operator.permissions.can_view_history ||
    operator.permissions.can_view_reports
  );

  // Se não tem nenhuma permissão, mostrar aviso
  if (!hasAnyPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sem Permissões</h2>
          <p className="text-gray-600 mb-6">
            Seu usuário não possui permissões para acessar nenhuma funcionalidade do sistema.
            Entre em contato com o administrador para configurar suas permissões.
          </p>
          <div className="space-y-3">
            <div className="text-left bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Usuário atual:</p>
              <p className="text-sm text-gray-600">Nome: {operator?.name || 'Não informado'}</p>
              <p className="text-sm text-gray-600">Código: {operator?.code || 'Não informado'}</p>
              <p className="text-sm text-gray-600">Função: {operator?.role || 'Não informado'}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Definir abas disponíveis baseadas nas permissões
  const availableTabs = [
    {
      id: 'orders' as TabType,
      label: 'Pedidos',
      icon: Package,
      permission: 'can_view_orders',
      description: 'Gerenciar pedidos de delivery'
    },
    {
      id: 'sales' as TabType,
      label: 'Vendas PDV',
      icon: ShoppingCart,
      permission: 'can_view_sales',
      description: 'Sistema de vendas PDV'
    },
    {
      id: 'cash' as TabType,
      label: 'Caixas',
      icon: DollarSign,
      permission: 'can_view_cash_register',
      description: 'Controle de caixa'
    },
    {
      id: 'tables' as TabType,
      label: 'Mesas',
      icon: Utensils,
      permission: 'can_view_tables',
      description: 'Sistema de mesas'
    },
    {
      id: 'history' as TabType,
      label: 'Histórico',
      icon: FileText,
      permission: 'can_view_history',
      description: 'Histórico de vendas'
    },
    {
      id: 'reports' as TabType,
      label: 'Relatórios',
      icon: BarChart3,
      permission: 'can_view_reports',
      description: 'Relatórios gerais'
    },
    {
      id: 'sales-report' as TabType,
      label: 'Rel. Vendas',
      icon: Calculator,
      permission: 'can_view_sales_report',
      description: 'Relatório de vendas'
    },
    {
      id: 'cash-report' as TabType,
      label: 'Rel. Caixa',
      icon: Clock,
      permission: 'can_view_cash_report',
      description: 'Relatório de caixa'
    }
  ].filter(tab => {
    const permission = tab.permission as keyof PDVOperator['permissions'];
    const hasTabPermission = hasPermission(permission);
    
    console.log(`🔍 Tab ${tab.label} - Permissão ${permission}:`, {
      hasPermission: hasTabPermission,
      operatorPermission: operator?.permissions?.[permission],
      operatorCode: operator?.code
    });
    
    return hasTabPermission;
  });

  // Se não há abas disponíveis, definir a primeira aba com permissão
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      console.log('🔄 Definindo aba padrão:', availableTabs[0].id);
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const renderTabContent = () => {
    console.log('🎯 Renderizando conteúdo da aba:', activeTab);
    
    switch (activeTab) {
      case 'orders':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_orders')} showMessage={true}>
            <AttendantPanel operator={operator} />
          </PermissionGuard>
        );
      case 'sales':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_sales')} showMessage={true}>
            <PDVSalesScreen operator={operator} />
          </PermissionGuard>
        );
      case 'cash':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_cash_register')} showMessage={true}>
            <CashRegisterMenu operator={operator} />
          </PermissionGuard>
        );
      case 'tables':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_tables')} showMessage={true}>
            <TableSalesPanel storeId={1} />
          </PermissionGuard>
        );
      case 'history':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_history')} showMessage={true}>
            <SalesHistoryPanel />
          </PermissionGuard>
        );
      case 'reports':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_reports')} showMessage={true}>
            <PDVReports />
          </PermissionGuard>
        );
      case 'sales-report':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_sales_report')} showMessage={true}>
            <PDVSalesReport />
          </PermissionGuard>
        );
      case 'cash-report':
        return (
          <PermissionGuard hasPermission={hasPermission('can_view_cash_report')} showMessage={true}>
            <PDVDailyCashReport />
          </PermissionGuard>
        );
      default:
        return (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Selecione uma aba para começar</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Sistema de Atendimento</h1>
                <p className="text-gray-600">Elite Açaí - Painel Unificado</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <User size={18} className="text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{operator?.name || 'Usuário'}</p>
                  <p className="text-gray-500 text-xs">
                    {operator?.code || 'N/A'} • {(() => {
                      const role = operator?.role;
                     console.log('🔍 DEBUG COMPLETO - Role do operador:', { 
                       role, 
                       operatorName: operator?.name,
                       operatorCode: operator?.code,
                       operatorObject: operator,
                       roleType: typeof role,
                       roleValue: JSON.stringify(role)
                     });
                      if (role === 'admin') return 'Administrador';
                      if (role === 'attendant') return 'Atendente';
                      if (role) return role;
                      return 'Função não definida';
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {availableTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isPendingOrdersTab = tab.id === 'orders';
              const showBadge = isPendingOrdersTab && pendingOrdersCount > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                  }`}
                  title={tab.description}
                >
                  <TabIcon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Badge de pedidos pendentes */}
                  {showBadge && (
                    <span className={`absolute -top-2 -right-2 flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold animate-pulse ${
                      activeTab === tab.id
                        ? 'bg-red-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {availableTabs.length === 0 && (
            <div className="text-center py-8">
              <Shield size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhuma funcionalidade disponível
              </h3>
              <p className="text-gray-500">
                Seu usuário não possui permissões para acessar nenhuma funcionalidade.
                Entre em contato com o administrador.
              </p>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAttendancePage;