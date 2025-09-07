import React, { useState, useEffect, useCallback } from 'react';
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
  Users,
  Bell,
  X
} from 'lucide-react';
import AttendantPanel from './Orders/AttendantPanel'; 
import PDVSalesScreen from './PDV/PDVSalesScreen';
import CashRegisterMenu from './PDV/CashRegisterMenu';
import SalesHistoryPanel from './Orders/SalesHistoryPanel';
import TableSalesPanel from './TableSales/TableSalesPanel';
import OrderPrintView from './Orders/OrderPrintView';
import { usePermissions } from '../hooks/usePermissions';
import { useScale } from '../hooks/useScale';
import { usePDVCashRegister } from '../hooks/usePDVCashRegister';
import { useStoreHours } from '../hooks/useStoreHours';
import { PDVOperator } from '../types/pdv';
import { supabase } from '../lib/supabase';

interface UnifiedAttendancePanelProps {
  operator?: PDVOperator;
  storeSettings?: any;
  scaleHook?: ReturnType<typeof useScale>;
  onLogout?: () => void;
}

function UnifiedAttendancePage({ operator, storeSettings, scaleHook, onLogout }: UnifiedAttendancePanelProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'cash' | 'tables' | 'history'>('sales');
  const { hasPermission } = usePermissions(operator);
  const { storeSettings: localStoreSettings } = useStoreHours();
  const { isOpen: isCashRegisterOpen, currentRegister } = usePDVCashRegister();
  const scale = useScale();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printOrderData, setPrintOrderData] = useState<any>(null);
  const [printerSettings, setPrinterSettings] = useState({
    auto_print_enabled: false,
    auto_print_delivery: false
  });
  const [soundSettings, setSoundSettings] = useState({
    enabled: true,
    volume: 0.7,
    soundUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
  });
  const [lastOrdersCheck, setLastOrdersCheck] = useState<string[]>([]);

  // Função para verificar se um pedido deve gerar alerta
  const shouldShowAlert = (order: any): boolean => {
    // Verificar se o pedido existe e tem dados válidos
    if (!order || !order.id || !order.status) {
      console.log('❌ [ALERT-FILTER] Pedido inválido ou sem dados:', order);
      return false;
    }
    
    // Verificar se é o pedido específico que deve ser ignorado
    if (order.id.includes('e569030f')) {
      console.log('🚫 [ALERT-FILTER] Pedido e569030f ignorado (removido do sistema)');
      return false;
    }
    
    // Verificar se o status é pendente
    if (order.status !== 'pending') {
      console.log('🚫 [ALERT-FILTER] Pedido ignorado - status não é pendente:', {
        orderId: order.id.slice(-8),
        status: order.status
      });
      return false;
    }
    
    // Verificar se já foi processado
    if (lastOrdersCheck.includes(order.id)) {
      console.log('🚫 [ALERT-FILTER] Pedido já processado anteriormente:', order.id.slice(-8));
      return false;
    }
    
    console.log('✅ [ALERT-FILTER] Pedido aprovado para alerta:', {
      orderId: order.id.slice(-8),
      status: order.status,
      customerName: order.customer_name
    });
    
    return true;
  };

  // Carregar configurações de impressão
  useEffect(() => {
    const loadPrinterSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('pdv_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.printer_layout) {
            setPrinterSettings({
              auto_print_enabled: settings.printer_layout.auto_print_enabled || false,
              auto_print_delivery: settings.printer_layout.auto_print_delivery || false
            });
          }
        }

        // Também tentar carregar do banco
        const { data, error } = await supabase
          .from('pdv_settings')
          .select('auto_print')
          .eq('id', 'loja1')
          .maybeSingle();

        if (data && !error) {
          setPrinterSettings(prev => ({
            ...prev,
            auto_print_enabled: data.auto_print || false,
            auto_print_delivery: data.auto_print || false
          }));
        }
      } catch (err) {
        console.warn('⚠️ Erro ao carregar configurações de impressão:', err);
      }
    };

    loadPrinterSettings();
  }, []);

  // Carregar configurações de som
  useEffect(() => {
    try {
      const savedSoundSettings = localStorage.getItem('orderSoundSettings');
      if (savedSoundSettings) {
        const settings = JSON.parse(savedSoundSettings);
        setSoundSettings({
          enabled: settings.enabled !== false,
          volume: settings.volume || 0.7,
          soundUrl: settings.soundUrl || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de som:', error);
    }
  }, []);
  // Carregar pedidos independentemente
  const fetchOrders = async () => {
    if (!currentRegister) return;

    try {
      setOrdersLoading(true);
      
      let query = supabase
        .from('orders')
        .select('*');
      
      query = query.or(`cash_register_id.eq.${currentRegister.id},cash_register_id.is.null`);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
      
    } catch (err) {
      console.error('❌ Erro ao carregar pedidos:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Carregar pedidos quando o caixa mudar
  useEffect(() => {
    if (currentRegister) {
      fetchOrders();
      // Reset do controle de novos pedidos quando o caixa muda
      setLastOrdersCheck([]);
    }
  }, [currentRegister]);
  
  // Função para atualizar status de pedido
  const handleOrderStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      console.log('🔄 [UNIFIED] Atualizando status do pedido:', { orderId: orderId.slice(-8), newStatus });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ [UNIFIED] Erro ao atualizar status no banco:', error);
        throw error;
      }
      
      console.log('✅ [UNIFIED] Status atualizado no banco com sucesso');
      
      // Atualizar estado local imediatamente
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
      
      console.log('✅ [UNIFIED] Estado local atualizado');
      
      // Recarregar pedidos para garantir sincronização
      setTimeout(() => {
        console.log('🔄 [UNIFIED] Recarregando pedidos após atualização de status');
        fetchOrders();
      }, 1000);

    } catch (err) {
      console.error('❌ [UNIFIED] Erro ao atualizar status:', err);
      throw err;
    }
  }, [fetchOrders]);

  // SISTEMA GLOBAL DE ALERTAS - MONITORAMENTO POR POLLING E REALTIME
  useEffect(() => {
    console.log('🔄 [GLOBAL-ALERTS] Configurando sistema global de alertas');
    console.log('📊 [GLOBAL-ALERTS] Caixa:', currentRegister?.id || 'NENHUM', 'Aba atual:', activeTab);
    
    // POLLING PARA GARANTIR DETECÇÃO DE NOVOS PEDIDOS
    const pollingInterval = setInterval(async () => {
      try {
        console.log('🔍 [GLOBAL-ALERTS] Verificando novos pedidos via polling...');
        
        // Buscar TODOS os pedidos se não há caixa, ou pedidos do caixa + órfãos se há caixa
        let query = supabase.from('orders').select('*');
        
        if (currentRegister) {
          // Se há caixa aberto, buscar pedidos do caixa + órfãos
          query = query.or(`cash_register_id.eq.${currentRegister.id},cash_register_id.is.null`);
        } else {
          // Se não há caixa, buscar apenas pedidos órfãos (sem caixa)
          query = query.is('cash_register_id', null);
        }
        
        const { data: latestOrders, error } = await query
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ [GLOBAL-ALERTS] Erro no polling:', error);
          return;
        }

        if (latestOrders && latestOrders.length > 0) {
          // Verificar se há pedidos novos que não estavam na última verificação
          const currentOrderIds = latestOrders.map(order => order.id);
          const newOrders = latestOrders.filter(order => 
            !lastOrdersCheck.includes(order.id) && shouldShowAlert(order)
          );
          
          if (newOrders.length > 0) {
            console.log('🚨 [GLOBAL-ALERTS] NOVOS PEDIDOS VÁLIDOS DETECTADOS VIA POLLING!', newOrders.length);
            
            // Processar cada novo pedido
            newOrders.forEach(newOrder => {
              console.log('📦 [GLOBAL-ALERTS] Processando novo pedido válido:', {
                orderId: newOrder.id.slice(-8),
                status: newOrder.status,
                customerName: newOrder.customer_name
              });
                
              // Atualizar lista de pedidos
              setOrders(prev => {
                const exists = prev.some(p => p.id === newOrder.id);
                if (!exists) {
                  return [newOrder, ...prev];
                }
                return prev;
              });
                
              // Mostrar alerta
              setNewOrderAlert(newOrder);
                
              // Tocar som
              playGlobalNotificationSound(newOrder);
                
              // Impressão automática (apenas se há caixa aberto)
              if (currentRegister && printerSettings.auto_print_enabled && printerSettings.auto_print_delivery) {
                console.log('🖨️ [GLOBAL-ALERTS] Ativando impressão automática via polling');
                  
                const printData = {
                  id: newOrder.id,
                  customer_name: newOrder.customer_name,
                  customer_phone: newOrder.customer_phone,
                  customer_address: newOrder.customer_address,
                  customer_neighborhood: newOrder.customer_neighborhood,
                  customer_complement: newOrder.customer_complement,
                  total_price: newOrder.total_price,
                  payment_method: newOrder.payment_method,
                  change_for: newOrder.change_for,
                  created_at: newOrder.created_at,
                  delivery_type: newOrder.delivery_type,
                  scheduled_pickup_date: newOrder.scheduled_pickup_date,
                  scheduled_pickup_time: newOrder.scheduled_pickup_time,
                  delivery_fee: newOrder.delivery_fee,
                  status: newOrder.status,
                  items: newOrder.items || []
                };
                // Mostrar tela de impressão
                setPrintOrderData(printData);
                setShowPrintPreview(true);
              } else if (!currentRegister) {
                console.log('⚠️ [GLOBAL-ALERTS] Impressão automática desabilitada - nenhum caixa aberto');
              }
                
              // Auto-ocultar alerta após 15 segundos
              setTimeout(() => {
                console.log('⏰ [GLOBAL-ALERTS] Ocultando alerta automaticamente');
                setNewOrderAlert(null);
              }, 15000);
            });
            
            // Atualizar controle de pedidos verificados
            setLastOrdersCheck(prev => [...prev, ...newOrders.map(o => o.id)]);
          }
        }
      } catch (err) {
        console.error('❌ [GLOBAL-ALERTS] Erro no polling:', err);
      }
    }, 5000); // Verificar a cada 5 segundos
    
    // REALTIME SUBSCRIPTION - MONITORA NOVOS PEDIDOS
    // REALTIME SUBSCRIPTION GLOBAL - MONITORA TODOS OS PEDIDOS
    const globalAlertsChannel = supabase
      .channel('global_alerts_all_orders')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders'
        },
        (payload) => {
          console.log('🚨 [GLOBAL-ALERTS] NOVO PEDIDO VIA REALTIME!');
          console.log('📋 [GLOBAL-ALERTS] Aba atual:', activeTab);
          console.log('💰 [GLOBAL-ALERTS] Caixa atual:', currentRegister?.id || 'NENHUM');
          
          const newOrder = payload.new;
          if (newOrder && newOrder.id) {
            // Verificar se deve mostrar alerta para este pedido
            if (!shouldShowAlert(newOrder)) {
              console.log('🚫 [GLOBAL-ALERTS] Pedido via realtime ignorado:', {
                orderId: newOrder.id.slice(-8),
                status: newOrder.status,
                reason: 'Não atende critérios para alerta'
              });
              return;
            }
            
            console.log('🔔 [GLOBAL-ALERTS] Processando pedido válido via realtime:', {
              orderId: newOrder.id.slice(-8),
              status: newOrder.status,
              customerName: newOrder.customer_name
            });
            
            // Se há caixa aberto e o pedido não tem caixa, vincular automaticamente
            if (currentRegister && !newOrder.cash_register_id) {
              console.log('🔗 [GLOBAL-ALERTS] Vinculando pedido órfão ao caixa atual');
              
              supabase
                .from('orders')
                .update({ cash_register_id: currentRegister.id })
                .eq('id', newOrder.id)
                .then(({ error }) => {
                  if (error) {
                    console.error('❌ Erro ao vincular pedido ao caixa:', error);
                  } else {
                    console.log('✅ Pedido vinculado ao caixa atual');
                    newOrder.cash_register_id = currentRegister.id;
                  }
                });
            }
            
            // SEMPRE processar o alerta, independente do caixa
            setOrders(prev => {
              const exists = prev.some(p => p.id === newOrder.id);
              if (!exists) {
                return [newOrder, ...prev];
              }
              return prev;
            });
            
            setLastOrdersCheck(prev => [newOrder.id, ...prev]);
            setNewOrderAlert(newOrder);
            playGlobalNotificationSound(newOrder);
            
            // Impressão automática apenas se há caixa aberto
            if (currentRegister && printerSettings.auto_print_enabled && printerSettings.auto_print_delivery) {
              console.log('🖨️ [GLOBAL-ALERTS] Ativando impressão automática via realtime');
              
              const printData = {
                id: newOrder.id,
                customer_name: newOrder.customer_name,
                customer_phone: newOrder.customer_phone,
                customer_address: newOrder.customer_address,
                customer_neighborhood: newOrder.customer_neighborhood,
                customer_complement: newOrder.customer_complement,
                total_price: newOrder.total_price,
                payment_method: newOrder.payment_method,
                change_for: newOrder.change_for,
                created_at: newOrder.created_at,
                delivery_type: newOrder.delivery_type,
                scheduled_pickup_date: newOrder.scheduled_pickup_date,
                scheduled_pickup_time: newOrder.scheduled_pickup_time,
                delivery_fee: newOrder.delivery_fee,
                status: newOrder.status,
                items: newOrder.items || []
              };
              
              setPrintOrderData(printData);
              setShowPrintPreview(true);
            } else if (!currentRegister) {
              console.log('⚠️ [GLOBAL-ALERTS] Impressão automática desabilitada - nenhum caixa aberto');
            }
            
            // Auto-ocultar alerta
            setTimeout(() => {
              console.log('⏰ [GLOBAL-ALERTS] Ocultando alerta automaticamente');
              setNewOrderAlert(null);
            }, 15000);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 [GLOBAL-ALERTS] Status da subscription:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [GLOBAL-ALERTS] Sistema de alertas ativo globalmente');
        }
      });

    return () => {
      console.log('🔌 [GLOBAL-ALERTS] Limpando sistema de alertas');
      clearInterval(pollingInterval);
      supabase.removeChannel(globalAlertsChannel);
    };
  }, [currentRegister, printerSettings.auto_print_enabled, printerSettings.auto_print_delivery, lastOrdersCheck, activeTab]);

  // FUNÇÃO GLOBAL PARA TOCAR SOM - FUNCIONA EM QUALQUER ABA
  const playGlobalNotificationSound = (order?: any) => {
    try {
      console.log('🔊 [GLOBAL-ALERTS] Reproduzindo som para novo pedido');
      
      if (!soundSettings.enabled) {
        console.log('🔕 [GLOBAL-ALERTS] Som desabilitado nas configurações');
        return;
      }
      
      // MÉTODO 1: Tentar reproduzir áudio normal
      const audio = new Audio(soundSettings.soundUrl);
      audio.volume = soundSettings.volume;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('🔊 [GLOBAL-ALERTS] Som reproduzido com sucesso');
        }).catch(e => {
          console.warn('⚠️ [GLOBAL-ALERTS] Erro no áudio principal, usando fallback:', e);
          playFallbackSound();
        });
      }
      
      // MÉTODO 2: Notificação do navegador (funciona mesmo em aba inativa)
      if ('Notification' in window && Notification.permission === 'granted') {
        console.log('🔔 [GLOBAL-ALERTS] Criando notificação do navegador');
        
        const orderDescription = order ? 
          `Pedido #${order.id.slice(-8)} de ${order.customer_name} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price || 0)}` :
          'Um novo pedido foi recebido';
          
        new Notification('🔔 Novo Pedido - Elite Açaí!', {
          body: orderDescription,
          icon: '/logo.jpg',
          tag: 'new-order',
          requireInteraction: true,
          vibrate: [200, 100, 200],
          silent: false
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        console.log('📋 [GLOBAL-ALERTS] Solicitando permissão para notificações');
        Notification.requestPermission();
      }
      
    } catch (error) {
      console.error('❌ [GLOBAL-ALERTS] Erro ao tocar som:', error);
      playFallbackSound();
    }
  };

  // SOM DE FALLBACK USANDO WEB AUDIO API
  const playFallbackSound = () => {
    try {
      console.log('🔊 [GLOBAL-ALERTS] Usando som de fallback');
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Sequência de 3 bips para chamar atenção
      const playTone = (freq: number, time: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + duration);
        
        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + duration);
      };
      
      // Tocar sequência de alertas
      playTone(1200, 0, 0.2);    // Primeiro bip
      playTone(900, 0.3, 0.2);   // Segundo bip
      playTone(1200, 0.6, 0.3);  // Terceiro bip (mais longo)
      
      console.log('✅ [GLOBAL-ALERTS] Som de fallback executado');
    } catch (error) {
      console.error('❌ [GLOBAL-ALERTS] Erro no som de fallback:', error);
    }
  };

  // Check if user is admin for sale deletion permissions
  const isAdmin = !operator || 
                  operator.code?.toUpperCase() === 'ADMIN' ||
                  operator.name?.toUpperCase().includes('ADMIN');

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
            
            console.log('🔍 Buscando permissões atualizadas do banco para operador:', {
              operatorId: operator.id,
              operatorName: operator.name,
              currentTab: activeTab
            });
            
            const { data: updatedUser, error } = await supabase
              .from('attendance_users')
              .select('*')
              .eq('id', operator.id)
              .single();
            
            if (!error && updatedUser) {
              console.log('🔄 Permissões recarregadas do banco:', {
                userName: updatedUser.name,
                permissions: updatedUser.permissions,
                activePermissions: Object.keys(updatedUser.permissions).filter(key => updatedUser.permissions[key])
              });
              
              // Verificar se as permissões mudaram
              if (JSON.stringify(updatedUser.permissions) !== JSON.stringify(operator.permissions)) {
                console.log('📊 Permissões diferentes detectadas! Atualizando sessão...');
                console.log('📋 Permissões antigas:', operator.permissions);
                console.log('📋 Permissões novas:', updatedUser.permissions);
                // Atualizar sessão com permissões atualizadas
                const currentSession = JSON.parse(localStorage.getItem('attendance_session') || '{}');
                if (currentSession.user) {
                  currentSession.user = updatedUser;
                  localStorage.setItem('attendance_session', JSON.stringify(currentSession));
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
    // Debug logging removed
  }, [operator, isAdmin, activeTab, isCashRegisterOpen, pendingOrdersCount]);

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
              <div className="w-12 h-12 bg-white rounded-full p-1 border-2 border-green-200 flex items-center justify-center shadow-md">
                <img 
                  src="/Logo_açai.jpeg" 
                  alt="Elite Açaí Logo" 
                  className="w-10 h-10 object-contain rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/logo.jpg';
                  }}
                />
              </div>
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
                  <span className="text-sm font-medium text-gray-700" title={"Código: " + operator.code}>
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
                  Supabase não configurado ou sem conexão. Usando produtos de demonstração.
                  Os produtos do banco aparecerão quando a conexão for restaurada.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Warning */}
      {supabaseConfigured && !isCashRegisterOpen && (activeTab === 'sales' || activeTab === 'orders') && (
        <div className="max-w-7xl mx-auto px-4 mt-6 print:hidden">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Caixa Fechado</h3>
                <p className="text-yellow-700 text-sm">
                  Não é possível {activeTab === 'sales' ? 'realizar vendas' : 'visualizar pedidos'} sem um caixa aberto.
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

        {/* 🚨 ALERTA GLOBAL DE NOVO PEDIDO - APARECE EM TODAS AS ABAS */}
        {newOrderAlert && (
          <div className="fixed top-4 right-4 max-w-sm print:hidden animate-bounce" style={{ zIndex: 999999 }}>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-2xl p-4 border-2 border-yellow-400 border border-white/20 transform scale-110">
              <div className="flex items-start gap-3">
                <div className="bg-white/30 rounded-full p-2 animate-pulse">
                  <Bell size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1 animate-pulse">🚨 NOVO PEDIDO!</h3>
                  <p className="text-sm mb-2">
                    Pedido #{newOrderAlert.id?.slice(-8)} de {newOrderAlert.customer_name}
                  </p>
                  <p className="text-xs text-orange-100 mb-3">
                    💰 Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newOrderAlert.total_price || 0)}
                  </p>
                  <p className="text-xs text-yellow-200 mb-3">
                    📱 {newOrderAlert.customer_phone} • 📍 {newOrderAlert.customer_neighborhood}
                  </p>
                  <p className="text-xs text-blue-200 mb-3">
                    🕐 Recebido: {new Date(newOrderAlert.created_at).toLocaleTimeString('pt-BR')}
                  </p>
                  <div className="bg-white/20 rounded-lg p-2 mb-3">
                    <p className="text-xs text-white font-bold">
                      📋 Sistema: ALERTA GLOBAL ATIVO
                    </p>
                    <p className="text-xs text-yellow-200">
                      🔔 Funciona em todas as abas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('orders');
                        setNewOrderAlert(null);
                        console.log('🔄 [GLOBAL-ALERTS] Indo para aba de pedidos');
                      }}
                      className="bg-white/30 hover:bg-white/40 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                    >
                      <Truck size={14} />
                      Ver Pedido
                    </button>
                    <button
                      onClick={() => {
                        console.log('❌ [GLOBAL-ALERTS] Alerta dispensado');
                        setNewOrderAlert(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-2 py-2 rounded-lg text-sm transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('❌ [GLOBAL-ALERTS] Alerta fechado');
                    setNewOrderAlert(null);
                  }}
                  className="text-white/90 hover:text-white p-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🖨️ MODAL DE IMPRESSÃO GLOBAL - APARECE EM QUALQUER ABA */}
        {showPrintPreview && printOrderData && (
          <OrderPrintView
            order={printOrderData}
            storeSettings={settings}
            onClose={() => {
              console.log('🖨️ [GLOBAL-ALERTS] Fechando modal de impressão');
              setShowPrintPreview(false);
              setPrintOrderData(null);
            }}
          />
        )}
        {/* Content */}
        <div className="transition-all duration-300 print:hidden">
          {activeTab === 'orders' && (isAdmin || hasPermission('can_view_orders')) && (
            <AttendantPanel 
              storeSettings={settings} 
              orders={orders}
              ordersLoading={ordersLoading}
              onOrdersRefresh={fetchOrders}
              onOrderStatusChange={handleOrderStatusChange}
            />
          )}
          {activeTab === 'sales' && (isAdmin || hasPermission('can_view_sales')) && <PDVSalesScreen operator={operator} scaleHook={scaleHook || scale} storeSettings={settings} />}
          {activeTab === 'cash' && <CashRegisterMenu isAdmin={isAdmin} operator={operator} />}
          {activeTab === 'tables' && (isAdmin || hasPermission('can_view_sales')) && <TableSalesPanel storeId={1} operatorName={operator?.name} isCashRegisterOpen={isCashRegisterOpen} />}
          {activeTab === 'history' && (isAdmin || hasPermission('can_view_sales')) && <SalesHistoryPanel storeId={1} operator={operator} isAdmin={isAdmin} />}
        </div>
      </div>
    </div>
  );
}

export default UnifiedAttendancePage;