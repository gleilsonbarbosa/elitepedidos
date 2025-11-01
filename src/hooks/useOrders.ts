import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, ChatMessage } from '../types/order';
import { usePDVCashRegister } from './usePDVCashRegister';

export const useOrders = (onNewOrder?: (order: Order) => void) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentRegister, isOpen: isCashRegisterOpen } = usePDVCashRegister();
  const onNewOrderRef = useRef(onNewOrder);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Manter a referência atualizada
  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando pedidos...');
      
      let query = supabase
        .from('orders')
        .select('*');
      
      if (currentRegister) {
        // If there's an open register, show orders linked to it OR orders without register
        query = query.or(`cash_register_id.eq.${currentRegister.id},cash_register_id.is.null`);
      } else {
        // If no register is open, show only orders without register
        query = query.is('cash_register_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // If there's an open register, automatically link orders without register to it
      if (currentRegister && data) {
        const ordersWithoutRegister = data.filter(order => !order.cash_register_id);
        
        if (ordersWithoutRegister.length > 0) {
          console.log(`🔗 Vinculando ${ordersWithoutRegister.length} pedidos ao caixa aberto`);
          
          // Update orders to link them to current register
          const { error: updateError } = await supabase
            .from('orders')
            .update({ cash_register_id: currentRegister.id })
            .in('id', ordersWithoutRegister.map(o => o.id));
          
          if (updateError) {
            console.warn('⚠️ Erro ao vincular pedidos ao caixa:', updateError);
          } else {
            console.log('✅ Pedidos vinculados ao caixa com sucesso');
            // Update local data to reflect the changes
            data.forEach(order => {
              if (!order.cash_register_id) {
                order.cash_register_id = currentRegister.id;
              }
            });
          }
        }
      }
      
      setOrders(data || []);
      console.log(`✅ ${data?.length || 0} pedidos carregados`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [currentRegister]);

  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando pedido:', orderData);
      
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Pedido deve conter pelo menos um item');
      }
      
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        throw new Error('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
      }
      
      const orderWithChannel = orderData.channel === 'manual' ? orderData : {
        ...orderData,
        channel: orderData.channel || 'delivery',
        cash_register_id: currentRegister ? currentRegister.id : null
      };
      
      console.log('📝 Dados do pedido preparados:', orderWithChannel);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...orderWithChannel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Pedido criado no banco:', data);
      
      // Criar notificação para novo pedido
      const notificationTitle = orderData.channel === 'manual' ? 'Pedido Manual Criado' : 'Novo Pedido';
      const notificationMessage = orderData.channel === 'manual' 
        ? `Pedido manual criado para ${orderData.customer_name}`
        : `Novo pedido de ${orderData.customer_name}`;
        
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          order_id: data.id,
          type: 'new_order',
          title: notificationTitle,
          message: notificationMessage,
          read: false,
          created_at: new Date().toISOString()
        }]);
      
      if (notificationError) {
        console.warn('⚠️ Erro ao criar notificação (não crítico):', notificationError);
      }

      return data;
    } catch (err) {
      console.error('❌ Erro ao criar pedido:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar pedido');
    }
  }, [currentRegister]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      console.log('🔄 Atualizando status do pedido:', { orderId: orderId.slice(-8), status });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Erro ao atualizar status no banco:', error);
        throw error;
      }
      
      console.log('✅ Status atualizado no banco com sucesso');
      
      // Atualizar estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      ));
      
      console.log('✅ Estado local atualizado');

      // Criar notificação de atualização de status
      const statusMessages = {
        pending: 'Pedido recebido',
        confirmed: 'Pedido confirmado',
        preparing: 'Pedido em preparo',
        out_for_delivery: 'Pedido saiu para entrega',
        ready_for_pickup: 'Pedido pronto para retirada',
        delivered: 'Pedido entregue',
        cancelled: 'Pedido cancelado'
      };

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          order_id: orderId,
          type: 'status_update',
          title: 'Status Atualizado',
          message: statusMessages[status],
          read: false,
          created_at: new Date().toISOString()
        }]);
      
      if (notificationError) {
        console.warn('⚠️ Erro ao criar notificação (não crítico):', notificationError);
      } else {
        console.log('✅ Notificação criada com sucesso');
      }

    } catch (err) {
      console.error('❌ Erro completo ao atualizar status:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  }, []);

  const playNotificationSound = () => {
    // Criar um som de notificação simples
    try {
      // Parar qualquer som anterior antes de tocar um novo
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
      }

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
      audio.volume = settings.volume;
      audio.loop = false; // Garantir que não toque em loop
      notificationAudioRef.current = audio; // Guardar referência

      audio.play().catch(e => {
        console.error('Erro ao tocar som de notificação:', e);
        // Tentar método alternativo se falhar
        playFallbackSound();
      });

      // Mostrar notificação visual também, se suportado pelo navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
          body: 'Um novo pedido de delivery foi recebido.',
          icon: '/vite.svg'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        // Solicitar permissão
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
      // Tentar método alternativo se falhar
      playFallbackSound();
    }
  };
  
  // Função de fallback para tocar som usando Web Audio API
  const playFallbackSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar um som de campainha/sino
      const playBellSound = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Frequência mais alta para chamar atenção
        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        
        // Volume inicial mais alto
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };
      
      // Tocar o som duas vezes com intervalo para chamar mais atenção
      playBellSound();
      
      // Tocar novamente após 300ms
      window.setTimeout(() => {
        playBellSound();
      }, 300);
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up realtime for all orders, not just cash register orders
    let ordersChannel: any = null;
    
    // Configurar realtime para TODOS os pedidos
    ordersChannel = supabase
      .channel('orders_global')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders'
        },
        (payload) => {
          console.log('🔔 Novo pedido recebido via realtime (useOrders):', payload);
          
          const newOrder = payload.new as Order;
          
          // Se há caixa aberto e o pedido não tem caixa, vincular automaticamente
          if (currentRegister && !newOrder.cash_register_id) {
            console.log('🔗 Vinculando pedido órfão ao caixa atual via useOrders');
            
            supabase
              .from('orders')
              .update({ cash_register_id: currentRegister.id })
              .eq('id', newOrder.id)
              .then(({ error }) => {
                if (!error) {
                  newOrder.cash_register_id = currentRegister.id;
                }
              });
          }
          
          // Adicionar à lista se for relevante para o contexto atual
          const shouldInclude = !currentRegister || // Se não há caixa, mostrar todos
                               !newOrder.cash_register_id || // Pedidos órfãos
                               newOrder.cash_register_id === currentRegister.id; // Pedidos do caixa atual
          
          if (shouldInclude) {
            setOrders(prev => [newOrder, ...prev]);

            // Tocar som de notificação para novos pedidos
            console.log('🔔 Tocando som de notificação para novo pedido');
            playNotificationSound();

            // Chamar callback se fornecido
            console.log('🎯 Verificando callback onNewOrderRef:', !!onNewOrderRef.current);
            if (onNewOrderRef.current) {
              console.log('🚀 Chamando callback onNewOrder para pedido:', newOrder.id.slice(-8));
              try {
                onNewOrderRef.current(newOrder);
                console.log('✅ Callback executado com sucesso');
              } catch (error) {
                console.error('❌ Erro ao executar callback:', error);
              }
            } else {
              console.log('⚠️ Callback onNewOrder não foi fornecido');
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔄 Pedido atualizado via realtime (useOrders):', payload);
          const updatedOrder = payload.new as Order;

          setOrders(prev => prev.map(order =>
            order.id === updatedOrder.id ? updatedOrder : order
          ));

          // Se o status mudou de 'pending', parar qualquer alerta sonoro
          const oldOrder = payload.old as Order;
          if (oldOrder.status === 'pending' && updatedOrder.status !== 'pending') {
            console.log('✅ Pedido não está mais pendente, parando alerta sonoro');
            // Parar o som de notificação se estiver tocando
            if (notificationAudioRef.current) {
              notificationAudioRef.current.pause();
              notificationAudioRef.current.currentTime = 0;
              notificationAudioRef.current = null;
            }
            // Parar qualquer outro áudio que possa estar tocando
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
            });
          }
        }
      )
      .subscribe((status) => console.log('🔌 Status da inscrição de pedidos (useOrders):', status));

    return () => {
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
      // Parar som ao desmontar
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current = null;
      }
    };
  }, [fetchOrders, currentRegister]);

  return {
    orders,
    loading,
    error,
    isCashRegisterOpen,
    createOrder,
    updateOrderStatus,
    refetch: fetchOrders
  };
};

export const useOrderChat = (orderId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando mensagens para o pedido:', orderId);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - chat não disponível');
        setMessages([]);
        setLoading(false);
        return;
      }

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Conexão com Supabase demorou mais de 10 segundos')), 10000);
      });
      
      const fetchPromise = supabase
        .from('chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) throw error;
      setMessages(data || []);
      console.log('✅ Mensagens carregadas:', data?.length || 0);
      setLastFetch(new Date());
    } catch (err) {
      console.error('❌ Erro ao carregar mensagens:', err);
      
      // Handle different types of errors gracefully
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('🌐 Erro de conectividade - modo offline para chat');
        setMessages([]);
      } else if (err instanceof Error && err.message.includes('Timeout')) {
        console.warn('⏱️ Timeout na conexão - chat indisponível');
        setMessages([]);
      } else {
        console.error('💥 Erro inesperado no chat:', err);
        setMessages([]);
      }
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }, [orderId]);

  // Função para recarregar mensagens periodicamente
  const refreshMessages = useCallback(async () => {
    try {
      console.log('🔄 Recarregando mensagens para o pedido:', orderId);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - chat não disponível');
        return;
      }

      // Add timeout for refresh as well
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na atualização')), 8000);
      });
      
      const fetchPromise = supabase
        .from('chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.warn('⚠️ Erro ao recarregar mensagens:', error);
        return;
      }
      
      // Só atualizar se houver mudanças
      console.log('✅ Mensagens recarregadas:', data?.length || 0);
      const newMessages = data || [];
      if (newMessages.length !== messages.length || 
          (newMessages.length > 0 && messages.length > 0 && 
           newMessages[newMessages.length - 1].id !== messages[messages.length - 1]?.id)) {
        setMessages(newMessages);
        setLastFetch(new Date());
      }
    } catch (err) {
      console.warn('⚠️ Erro ao recarregar mensagens (não crítico):', err);
      // Don't throw error for refresh failures - just log and continue
    }
  }, [orderId, messages]);

  const sendMessage = useCallback(async (
    message: string, 
    senderType: 'customer' | 'attendant',
    senderName: string,
    options?: { playSound?: boolean }
  ) => {
    try {
      console.log('📤 Enviando mensagem:', message, 'tipo:', senderType);
      
      if (!message.trim()) {
        console.warn('Tentativa de enviar mensagem vazia');
        return null;
      }
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        throw new Error('Chat não disponível - Supabase não configurado');
      }
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          order_id: orderId,
          sender_type: senderType,
          sender_name: senderName,
          message,
          created_at: new Date().toISOString(),
          read_by_customer: senderType === 'customer',
          read_by_attendant: senderType === 'attendant'
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Mensagem enviada com sucesso');

      try {
        // Criar notificação para nova mensagem
        await supabase
          .from('notifications')
          .insert([{
            order_id: orderId,
            type: 'new_message',
            title: 'Nova Mensagem',
            message: `Nova mensagem de ${senderName}`,
            read: false,
            created_at: new Date().toISOString()
          }]);
      } catch (notifError) {
        console.warn('Erro ao criar notificação (não crítico):', notifError);
      }

      // Tocar som se solicitado
      if (options?.playSound) {
        playMessageSound();
      }

      return data;
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    }
  }, [orderId]);

  const markAsRead = useCallback(async (messageId: string, readerType: 'customer' | 'attendant') => {
    try {
      const updateField = readerType === 'customer' ? 'read_by_customer' : 'read_by_attendant';
      
      const { error } = await supabase
        .from('chat_messages')
        .update({ [updateField]: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;

    fetchMessages();

    // Configurar polling para garantir que as mensagens sejam atualizadas
    const pollingInterval = setInterval(() => {
      refreshMessages();
    }, 3000); // Verificar a cada 3 segundos

    // Configurar realtime para mensagens
    const messagesChannel = supabase
      .channel(`chat:${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔔 Nova mensagem recebida via realtime:', payload);
          console.log('📨 Nova mensagem recebida via realtime:', payload.new);
          setMessages(prev => [...prev, payload.new as ChatMessage]);
          setLastFetch(new Date());
          // Tocar som para nova mensagem
          if (payload.new.sender_type !== (isAttendant ? 'attendant' : 'customer')) {
            playMessageSound();
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Mensagem atualizada via realtime:', payload);
          console.log('📝 Mensagem atualizada via realtime:', payload.new);
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? payload.new as ChatMessage : msg
          ));
          setLastFetch(new Date());
        }
      )
      .subscribe((status) => console.log('🔌 Status da inscrição do chat:', status));

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(messagesChannel);
    };
  }, [orderId, fetchMessages, refreshMessages]);

  const playMessageSound = () => {
    try {
      // Obter configuração de som do localStorage
      const soundSettings = localStorage.getItem('chatSoundSettings');
      const settings = soundSettings ? JSON.parse(soundSettings) : { enabled: true, volume: 0.5, soundUrl: "https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3" };
      
      // Verificar se o som está habilitado
      if (!settings.enabled) {
        console.log('🔕 Som de mensagem desabilitado nas configurações');
        return;
      }
      
      // Criar um elemento de áudio e tocar o som configurado
      const audio = new Audio(settings.soundUrl);
      audio.volume = settings.volume; // Ajustar volume conforme configuração
      audio.play().catch(e => {
        console.error('Erro ao tocar som de mensagem:', e);
        // Tentar método alternativo se falhar
        playMessageSoundFallback();
      });
    } catch (error) {
      console.error('Erro ao tocar som de mensagem:', error);
      // Tentar método alternativo se falhar
      playMessageSoundFallback();
    }
  };
  
  // Função de fallback para tocar som usando Web Audio API
  const playMessageSoundFallback = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Erro ao tocar som de fallback:', error);
    }
  };

  // Recarregar mensagens quando a página ganha foco
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Página ganhou foco, recarregando mensagens...');
      refreshMessages();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página ficou visível, recarregando mensagens...');
        refreshMessages();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMessages]);

  return {
    messages,
    loading,
    lastFetch,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
    refreshMessages
  };
};