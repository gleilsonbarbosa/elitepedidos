import React, { useState, useEffect } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { usePermissions } from '../../hooks/usePermissions';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';
import PermissionGuard from '../PermissionGuard';
import OrderPrintView from './OrderPrintView';
import OrderCard from './OrderCard';
import ManualOrderForm from './ManualOrderForm';
import ThermalPrinterSetup from '../PDV/ThermalPrinterSetup';
import { OrderStatus } from '../../types/order';
import { 
  Filter, 
  Search, 
  Bell, 
  Package, 
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ArrowLeft,
  Settings,
  Plus,
  Printer
} from 'lucide-react';

interface AttendantPanelProps {
  onBackToAdmin?: () => void;
  storeSettings?: any;
}

const AttendantPanel: React.FC<AttendantPanelProps> = ({ onBackToAdmin, storeSettings }) => {
  const { hasPermission } = usePermissions();
  const { orders, loading, updateOrderStatus } = useOrders();
  const thermalPrinter = useThermalPrinter();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('pending');
  const [showManualOrderForm, setShowManualOrderForm] = useState(false);
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrder, setNewOrder] = useState<any | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Carregar configuração de som
  useEffect(() => {
    try {
      const soundSettings = localStorage.getItem('orderSoundSettings');
      if (soundSettings) {
        const settings = JSON.parse(soundSettings);
        setSoundEnabled(settings.enabled);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de som:', error);
    }
  }, []);

  // Carregar configurações de impressora
  const [printerSettings, setPrinterSettings] = useState({
    auto_print_delivery: false,
    auto_print_enabled: false
  });
  
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('pdv_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.printer_layout) {
          setPrinterSettings({
            auto_print_delivery: settings.printer_layout.auto_print_delivery || false,
            auto_print_enabled: settings.printer_layout.auto_print_enabled || false
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de impressora:', error);
    }
  }, []);

  // Carregar configurações de impressão automática do banco
  useEffect(() => {
    const loadPrinterSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('pdv_settings')
          .select('auto_print')
          .eq('id', 'loja1')
          .single();

        if (data && !error) {
          setPrinterSettings(prev => ({
            ...prev,
            auto_print_enabled: data.auto_print || false,
            auto_print_delivery: data.auto_print || false
          }));
          console.log('✅ Configurações de impressão carregadas:', data.auto_print);
        }
      } catch (err) {
        console.warn('⚠️ Erro ao carregar configurações de impressão:', err);
      }
    };

    loadPrinterSettings();
  }, []);
  // Alternar som de notificação
  const toggleSound = () => {
    try {
      const newState = !soundEnabled;
      setSoundEnabled(newState);
      
      // Salvar no localStorage
      const soundSettings = localStorage.getItem('orderSoundSettings');
      const settings = soundSettings ? JSON.parse(soundSettings) : { volume: 0.7, soundUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" };
      settings.enabled = newState;
      localStorage.setItem('orderSoundSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Erro ao salvar configurações de som:', error);
    }
  };

  // Efeito para tocar som quando novos pedidos chegarem
  useEffect(() => {
    // Contar pedidos pendentes
    const currentPendingCount = orders.filter(order => order.status === 'pending').length;
    setPendingOrdersCount(currentPendingCount);
    
    // Verificar se há novos pedidos pendentes
    if (currentPendingCount > lastOrderCount && lastOrderCount >= 0) {
      console.log('🔔 Novos pedidos detectados!');
      
      // Encontrar o novo pedido
      const pendingOrders = orders.filter(order => order.status === 'pending');
      const newOrders = pendingOrders.slice(0, currentPendingCount - lastOrderCount);
      
      if (newOrders.length > 0) {
        // Pegar o pedido mais recente
        const latestOrder = newOrders.filter(order => order && order.id).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        if (latestOrder) {
          setNewOrder(latestOrder);
        
          console.log('🖨️ Verificando configuração de impressão automática:', {
            auto_print_enabled: printerSettings.auto_print_enabled,
            auto_print_delivery: printerSettings.auto_print_delivery,
            newOrderId: latestOrder.id,
            thermalPrinterConnected: thermalPrinter.connection.isConnected
          });
        
          // Tentar impressão térmica automática primeiro
          if (thermalPrinter.connection.isConnected && printerSettings.auto_print_enabled && printerSettings.auto_print_delivery) {
            console.log('🖨️ Imprimindo automaticamente na impressora térmica:', latestOrder.id);
            
            try {
              await thermalPrinter.printOrder({
                sale: {
                  sale_number: latestOrder.id.slice(-8),
                  customer_name: latestOrder.customer_name,
                  customer_phone: latestOrder.customer_phone,
                  customer_address: latestOrder.customer_address,
                  customer_neighborhood: latestOrder.customer_neighborhood,
                  customer_complement: latestOrder.customer_complement,
                  total_amount: latestOrder.total_price,
                  payment_type: latestOrder.payment_method,
                  change_amount: latestOrder.change_for ? Math.max(0, latestOrder.change_for - latestOrder.total_price) : 0,
                  created_at: latestOrder.created_at,
                  delivery_type: latestOrder.delivery_type,
                  scheduled_pickup_date: latestOrder.scheduled_pickup_date,
                  scheduled_pickup_time: latestOrder.scheduled_pickup_time,
                  delivery_fee: latestOrder.delivery_fee
                },
                items: latestOrder.items || []
              });
              
              console.log('✅ Pedido impresso automaticamente na impressora térmica');
            } catch (printError) {
              console.error('❌ Erro na impressão térmica, usando fallback:', printError);
              // Fallback para impressão tradicional
              printOrderTraditional(latestOrder);
            }
          }
          // Fallback: Imprimir automaticamente via janela (método tradicional)
          else if (printerSettings.auto_print_enabled && printerSettings.auto_print_delivery && latestOrder.status === 'pending') {
            printOrderTraditional(latestOrder);
          }
        }
      }
    }
    
    // Atualizar contagem para próxima verificação
    setLastOrderCount(currentPendingCount);
  }, [orders, lastOrderCount, soundEnabled, printerSettings.auto_print_enabled, thermalPrinter]);

  // Função para impressão tradicional (fallback)
  const printOrderTraditional = (latestOrder: any) => {
    try {
      console.log('🖨️ Imprimindo pedido automaticamente (método tradicional):', latestOrder.id);
      
      // Criar dados para impressão
      const printData = {
        sale: {
          sale_number: latestOrder.id.slice(-8),
          operator_name: 'Sistema',
          customer_name: latestOrder.customer_name,
          customer_phone: latestOrder.customer_phone,
          subtotal: latestOrder.total_price - (latestOrder.delivery_fee || 0),
          discount_amount: 0,
          total_amount: latestOrder.total_price,
          payment_type: latestOrder.payment_method,
          change_amount: latestOrder.change_for ? Math.max(0, latestOrder.change_for - latestOrder.total_price) : 0,
          created_at: latestOrder.created_at,
          delivery_type: latestOrder.delivery_type,
          scheduled_pickup_date: latestOrder.scheduled_pickup_date,
          scheduled_pickup_time: latestOrder.scheduled_pickup_time,
          customer_address: latestOrder.customer_address,
          customer_neighborhood: latestOrder.customer_neighborhood,
          customer_complement: latestOrder.customer_complement,
          delivery_fee: latestOrder.delivery_fee
        },
        items: latestOrder.items || []
      };
      
      // Imprimir diretamente sem modal
      printOrderDirectly(printData);
    } catch (error) {
      console.error('❌ Erro na impressão tradicional:', error);
    }
  };

  // Função para impressão direta (método tradicional)
  const printOrderDirectly = (orderData: any) => {
    try {
      console.log('🖨️ Iniciando impressão automática direta:', orderData.sale.sale_number);
      
      // Criar janela de impressão
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (!printWindow) {
        console.error('❌ Não foi possível abrir janela de impressão - pop-ups bloqueados');
        return;
      }

      const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
      const getPaymentMethodLabel = (method: string) => method === 'money' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : method;

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Pedido #${orderData.sale.sale_number}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; color: black !important; background: white !important; }
            body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; padding: 2mm; width: 76mm; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .small { font-size: 10px; }
            .separator { border-bottom: 1px dashed black; margin: 5px 0; padding-bottom: 5px; }
            .flex-between { display: flex; justify-content: space-between; align-items: center; }
            .mb-1 { margin-bottom: 2px; }
            .mb-2 { margin-bottom: 5px; }
            .mb-3 { margin-bottom: 8px; }
            .ml-2 { margin-left: 8px; }
          </style>
        </head>
        <body>
          <div class="center mb-3 separator">
            <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
            <div class="small">Pedido ${orderData.sale.delivery_type === 'pickup' ? 'para Retirada' : 'para Entrega'}</div>
            <div class="small">Tel: (85) 98904-1010</div>
          </div>
          
          <div class="mb-3 separator">
            <div class="bold center mb-2">=== PEDIDO #${orderData.sale.sale_number} ===</div>
            <div class="small">Data: ${new Date(orderData.sale.created_at).toLocaleDateString('pt-BR')}</div>
            <div class="small">Hora: ${new Date(orderData.sale.created_at).toLocaleTimeString('pt-BR')}</div>
          </div>
          
          <div class="mb-3 separator">
            <div class="bold mb-1">CLIENTE:</div>
            <div class="small">Nome: ${orderData.sale.customer_name}</div>
            <div class="small">Telefone: ${orderData.sale.customer_phone}</div>
            ${orderData.sale.delivery_type === 'pickup' ? `
            <div class="bold" style="font-size: 14px;">*** RETIRADA NA LOJA ***</div>
            <div class="small">Data: ${orderData.sale.scheduled_pickup_date ? new Date(orderData.sale.scheduled_pickup_date).toLocaleDateString('pt-BR') : 'Não definida'}</div>
            <div class="small">Horário: ${orderData.sale.scheduled_pickup_time || 'Não definido'}</div>
            <div class="small">Local: Rua Um, 1614-C – Residencial 1 – Cágado</div>
            ` : `
            <div class="small">Endereço: ${orderData.sale.customer_address}</div>
            <div class="small">Bairro: ${orderData.sale.customer_neighborhood}</div>
            ${orderData.sale.customer_complement ? `<div class="small">Complemento: ${orderData.sale.customer_complement}</div>` : ''}
            `}
          </div>
          
          <div class="mb-3 separator">
            <div class="bold mb-1">ITENS:</div>
            ${orderData.items.map((item, index) => `
              <div class="mb-2">
                <div class="bold">${item.product_name}</div>
                ${item.selected_size ? `<div class="small">Tamanho: ${item.selected_size}</div>` : ''}
                <div class="flex-between">
                  <span class="small">${item.quantity}x ${formatPrice(item.unit_price)}</span>
                  <span class="small">${formatPrice(item.total_price)}</span>
                </div>
                ${item.complements && item.complements.length > 0 ? `
                  <div class="ml-2">
                    <div class="small">Complementos:</div>
                    ${item.complements.map(comp => `
                      <div class="small ml-2">• ${comp.name}${comp.price > 0 ? ` (+${formatPrice(comp.price)})` : ''}</div>
                    `).join('')}
                  </div>
                ` : ''}
                ${item.observations ? `<div class="small ml-2">Obs: ${item.observations}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="mb-3 separator">
            <div class="bold mb-1">TOTAL:</div>
            ${orderData.sale.delivery_fee && orderData.sale.delivery_fee > 0 ? `
            <div class="flex-between">
              <span class="small">Subtotal:</span>
              <span class="small">${formatPrice(orderData.sale.subtotal)}</span>
            </div>
            <div class="flex-between">
              <span class="small">Taxa Entrega:</span>
              <span class="small">${formatPrice(orderData.sale.delivery_fee)}</span>
            </div>
            ` : ''}
            <div class="flex-between bold">
              <span>VALOR:</span>
              <span>${formatPrice(orderData.sale.total_amount)}</span>
            </div>
          </div>
          
          <div class="mb-3 separator">
            <div class="bold mb-1">PAGAMENTO:</div>
            <div class="small">Forma: ${getPaymentMethodLabel(orderData.sale.payment_type)}</div>
            ${orderData.sale.change_amount > 0 ? `<div class="small">Troco: ${formatPrice(orderData.sale.change_amount)}</div>` : ''}
          </div>
          
          <div class="center small">
            <div class="bold mb-2">Elite Açaí</div>
            <div>Pedido ${orderData.sale.delivery_type === 'pickup' ? 'agendado para retirada' : 'confirmado para entrega'}</div>
            <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguardar carregar e imprimir automaticamente
      printWindow.onload = () => {
        setTimeout(() => {
          console.log('🖨️ Executando impressão automática...');
          printWindow.print();
          
          // Fechar janela após impressão
          setTimeout(() => {
            printWindow.close();
            console.log('✅ Impressão automática concluída');
          }, 1000);
        }, 500);
      };
      
    } catch (error) {
      console.error('❌ Erro na impressão automática:', error);
    }
  };

  // Função para tocar som de novo pedido
  const playNewOrderSound = (order: any) => {
    console.log('🔊 Tocando som de notificação para novo pedido');
    try {
      // Obter configuração de som do localStorage
      const soundSettings = localStorage.getItem('orderSoundSettings');
      const settings = soundSettings ? JSON.parse(soundSettings) : { enabled: true, volume: 0.7, soundUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" };
      
      // Verificar se o som está habilitado
      if (!settings.enabled) {
        console.log('🔕 Som de notificação desabilitado nas configurações');
        return;
      }
      
      // Criar um elemento de áudio e tocar o som configurado
      const audio = new Audio(settings.soundUrl);
      audio.volume = settings.volume; // Ajustar volume conforme configuração
      audio.play().catch(e => {
        console.error('Erro ao tocar som de notificação:', e);
        // Tentar método alternativo se falhar
        playFallbackSound();
      });
      
      // Criar descrição com produtos
      if (order && order.items) {
        const productNames = order.items.map(item => 
          `${item.product_name} (${item.quantity}x)`
        ).join(', ');
        
        const orderDescription = `Pedido Delivery #${order.id.slice(-8)} - ${productNames}`;
        
        // Mostrar notificação visual também, se suportado pelo navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Novo Pedido!', {
            body: orderDescription.length > 100 ? 
              `Pedido Delivery #${order.id.slice(-8)} - ${order.items.length} item(s)` : 
            orderDescription,
            icon: '/vite.svg'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
      // Tentar método alternativo se falhar
      playFallbackSound();
    }
  };
  
  // Método alternativo para tocar som
  const playFallbackSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar sequência de sons para chamar mais atenção
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
      
      // Tocar sequência de notas (como uma campainha)
      playTone(1200, 0, 0.2);
      playTone(900, 0.3, 0.2);
      playTone(1200, 0.6, 0.3);
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error);
    }
  };

  // Função para gerar mensagem de resumo de pedidos pendentes
  const generatePendingOrdersMessage = (pendingOrders: any[]) => {
    let message = `🔔 *RESUMO DE PEDIDOS PENDENTES - ELITE AÇAÍ*\n\n`;
    message += `📊 *${pendingOrders.length} pedido(s) aguardando confirmação*\n\n`;
    
    pendingOrders.forEach((order, index) => {
      message += `*${index + 1}. Pedido #${order.id.slice(-8)}*\n`;
      message += `👤 Cliente: ${order.customer_name}\n`;
      message += `📱 Telefone: ${order.customer_phone}\n`;
      message += `📍 Endereço: ${order.customer_address}, ${order.customer_neighborhood}\n`;
      message += `💰 Total: ${formatPrice(order.total_price)}\n`;
      message += `💳 Pagamento: ${getPaymentMethodLabel(order.payment_method)}\n`;
      message += `🕐 Recebido: ${formatDate(order.created_at)}\n\n`;
    });
    
    const totalValue = pendingOrders.reduce((sum, order) => sum + order.total_price, 0);
    message += `💵 *Valor Total dos Pedidos: ${formatPrice(totalValue)}*\n\n`;
    message += `⚠️ *Ação Necessária:* Confirmar pedidos para iniciar preparo\n\n`;
    message += `📱 Elite Açaí - Sistema de Atendimento\n`;
    message += `🕐 Enviado em: ${new Date().toLocaleString('pt-BR')}`;
    
    return encodeURIComponent(message);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      'pix': 'PIX',
      'money': 'Dinheiro',
      'card': 'Cartão',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito'
    };
    return methods[method] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(order => order.status === status).length;
  };

  const statusOptions = [
    { value: 'all' as const, label: 'Todos', count: orders.length, icon: Package },
    { value: 'pending' as const, label: 'Pendentes', count: getStatusCount('pending'), icon: Clock },
    { value: 'confirmed' as const, label: 'Confirmados', count: getStatusCount('confirmed'), icon: CheckCircle },
    { value: 'preparing' as const, label: 'Em Preparo', count: getStatusCount('preparing'), icon: Package },
    { value: 'out_for_delivery' as const, label: 'Saiu p/ Entrega', count: getStatusCount('out_for_delivery'), icon: Truck },
    { value: 'ready_for_pickup' as const, label: 'Pronto p/ Retirada', count: getStatusCount('ready_for_pickup'), icon: Package },
    { value: 'delivered' as const, label: 'Finalizados', count: getStatusCount('delivered'), icon: CheckCircle },
    { value: 'cancelled' as const, label: 'Cancelados', count: getStatusCount('cancelled'), icon: XCircle }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard hasPermission={hasPermission('can_view_orders')} showMessage={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-lg border-b print:hidden backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onBackToAdmin && (
                  <button
                    onClick={onBackToAdmin}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Voltar ao painel administrativo"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                )}
                <div className="bg-purple-100 rounded-full p-2">
                  <Package size={24} className="text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Painel de Atendimento
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span>Gerencie pedidos e converse com clientes</span>
                    {pendingOrdersCount > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                        {pendingOrdersCount} pendente(s)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className={`p-2 rounded-full transition-colors ${soundEnabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={soundEnabled ? "Desativar som de notificações" : "Ativar som de notificações"}
                >
                  {soundEnabled ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.343 9.657a2 2 0 000 2.828l1.414 1.414a4 4 0 01-1.414 1.414l-1.414-1.414a2 2 0 00-2.828 0L2.1 14.9a2 2 0 000 2.828l1.414 1.414a2 2 0 002.828 0l1.414-1.414a4 4 0 011.414-1.414l-1.414-1.414a2 2 0 000-2.828L6.343 9.657z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.414a2 2 0 002.828 0l1.414-1.414a4 4 0 011.414-1.414l-1.414-1.414a2 2 0 000-2.828L6.343 9.657a2 2 0 00-2.828 0L2.1 14.9a2 2 0 000 2.828l1.414 1.414a2 2 0 002.828 0l1.414-1.414a4 4 0 011.414-1.414l-1.414-1.414a2 2 0 000-2.828L6.343 9.657z" />
                    </svg>
                  )}
                </button>
                
                <button
                  onClick={() => setShowPrinterSetup(true)}
                  className={`p-2 rounded-full transition-colors ${
                    thermalPrinter.connection.isConnected 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Configurar impressora térmica"
                >
                  <Printer size={20} />
                </button>
                
                <button
                  onClick={() => setShowManualOrderForm(true)}
                  disabled={!hasPermission('can_create_manual_orders')}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus size={16} />
                  Pedido Manual
                </button>
                <div className="relative">
                  <Bell size={20} className="text-gray-600" />
                  {orders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {pendingOrdersCount}
                    </span>
                  )}
                </div>
                {onBackToAdmin && (
                  <button
                    onClick={onBackToAdmin}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Settings size={16} />
                    Admin
                  </button>
                )}
                {printerSettings.auto_print_enabled && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs border border-green-200 shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="font-medium">Auto Print</span>
                    {thermalPrinter.connection.isConnected && (
                      <span className="text-green-600">• Térmica</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6 print:hidden">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, telefone ou ID do pedido..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="lg:w-64">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 print:hidden">
              {statusOptions.map(option => {
                const Icon = option.icon;
                const isActive = statusFilter === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 border-purple-400 text-white shadow-lg'
                        : 'bg-white/70 backdrop-blur-sm border-gray-200 text-gray-600 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <Icon size={24} className="mx-auto mb-2" />
                    <div className="text-xs font-medium mb-1">{option.label}</div>
                    <div className={`text-xl font-bold ${
                      isActive ? 'text-white' : 'text-gray-800'
                    }`}>
                      {option.count}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6 print:hidden">
            {filteredOrders.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Package size={48} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Aguardando novos pedidos...'
                  }
                </p>
                {statusFilter === 'pending' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-700 text-sm">
                      💡 <strong>Dica:</strong> Novos pedidos aparecerão automaticamente aqui quando chegarem
                    </p>
                  </div>
                )}
              </div>
            ) : (
              filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  isAttendant={true}
                  className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                />
              ))
            )}
          </div>
        </div>
        
        {/* Manual Order Form */}
        {showManualOrderForm && (
          <ManualOrderForm 
            onClose={() => setShowManualOrderForm(false)}
            onOrderCreated={() => {
              // Refresh orders after creating a new one
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }}
          />
        )}
        
        {/* Thermal Printer Setup */}
        {showPrinterSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ThermalPrinterSetup onClose={() => setShowPrinterSetup(false)} />
            </div>
          </div>
        )}
        
        {/* Print Preview Modal */}
        {showPrintPreview && newOrder && (
          <OrderPrintView 
            order={newOrder} 
            storeSettings={null}
            onClose={() => {
              setShowPrintPreview(false);
              setNewOrder(null);
            }} 
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default AttendantPanel;