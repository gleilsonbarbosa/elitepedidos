import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PushSubscription {
  id?: string;
  customer_phone?: string;
  customer_name?: string;
  subscription_data: any;
  user_agent?: string;
  created_at?: string;
  is_active?: boolean;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}

export const useWebPush = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VAPID public key - você precisa gerar um par de chaves VAPID
  const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa6iG7VFSVVtXCoMiDXKMot5Hjh95cLlDmhnqFC1gwYQ_-AahNCGNM1EEABEAI';

  // Verificar suporte a notificações Push
  useEffect(() => {
    const checkSupport = () => {
      // Verificar se estamos no StackBlitz (WebContainer)
      const isStackBlitz = window.location.hostname === 'localhost' && 
                          window.location.port === '3000' &&
                          navigator.userAgent.includes('WebContainer');
      
      const supported = !isStackBlitz &&
                       'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        console.log('✅ Web Push suportado');
        console.log('🔔 Permissão atual:', Notification.permission);
      } else if (isStackBlitz) {
        console.warn('⚠️ Web Push não disponível no StackBlitz (ambiente de desenvolvimento)');
        setError('Notificações Push não estão disponíveis no ambiente de desenvolvimento StackBlitz');
      } else {
        console.warn('⚠️ Web Push não suportado neste navegador');
        setError('Notificações Push não são suportadas neste navegador');
      }
    };

    checkSupport();
  }, []);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported) {
      const isStackBlitz = window.location.hostname === 'localhost' && 
                          window.location.port === '3000';
      
      if (isStackBlitz) {
        throw new Error('Service Workers não são suportados no StackBlitz. Esta funcionalidade estará disponível quando o app for implantado em produção.');
      } else {
        throw new Error('Service Worker não suportado neste navegador');
      }
    }

    try {
      console.log('🔧 Registrando Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Aguardar o SW estar ativo
      if (registration.installing) {
        console.log('⏳ Service Worker instalando...');
        await new Promise((resolve) => {
          registration.installing!.addEventListener('statechange', () => {
            if (registration.installing!.state === 'installed') {
              resolve(undefined);
            }
          });
        });
      }
      
      return registration;
    } catch (err) {
      console.error('❌ Erro ao registrar Service Worker:', err);
      
      // Verificar se é erro específico do StackBlitz
      if (err instanceof Error && err.message.includes('not yet supported on StackBlitz')) {
        throw new Error('Service Workers não são suportados no StackBlitz. Esta funcionalidade estará disponível quando o app for implantado em produção.');
      }
      
      throw new Error(`Falha ao registrar Service Worker: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [isSupported]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('Notificações não suportadas');
    }

    try {
      console.log('🔔 Solicitando permissão para notificações...');
      
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      console.log('📋 Permissão concedida:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permissão concedida para notificações');
        return true;
      } else if (permission === 'denied') {
        throw new Error('Permissão negada pelo usuário');
      } else {
        throw new Error('Permissão não concedida');
      }
    } catch (err) {
      console.error('❌ Erro ao solicitar permissão:', err);
      throw err;
    }
  }, [isSupported]);

  // Converter VAPID key para Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Criar subscription
  const subscribe = useCallback(async (customerPhone?: string, customerName?: string): Promise<PushSubscription> => {
    if (!isSupported) {
      throw new Error('Push notifications não suportadas');
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Registrar Service Worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Falha ao registrar Service Worker');
      }

      // 2. Solicitar permissão
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error('Permissão para notificações não concedida');
      }

      // 3. Criar subscription
      console.log('📱 Criando subscription Push...');
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('✅ Subscription criada:', pushSubscription);

      // 4. Salvar no banco de dados
      const subscriptionData: PushSubscription = {
        customer_phone: customerPhone,
        customer_name: customerName,
        subscription_data: pushSubscription.toJSON(),
        user_agent: navigator.userAgent,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey && 
          !supabaseUrl.includes('placeholder') && 
          !supabaseKey.includes('placeholder')) {
        
        // First, try to update existing subscription for this phone
        const { data: existingData, error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            subscription_data: subscriptionData.subscription_data,
            customer_name: subscriptionData.customer_name,
            user_agent: subscriptionData.user_agent,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('customer_phone', customerPhone)
          .select()
          .maybeSingle();

        if (updateError && updateError.code !== 'PGRST116') {
          console.error('❌ Erro ao atualizar subscription:', updateError);
          throw new Error(`Falha ao atualizar subscription: ${updateError.message}`);
        }

        if (existingData) {
          console.log('💾 Subscription atualizada no banco:', existingData);
          setSubscription(existingData);
        } else {
          // If no existing subscription, create new one
          const { data: newData, error: insertError } = await supabase
            .from('push_subscriptions')
            .insert([subscriptionData])
            .select()
            .single();

          if (insertError) {
            console.error('❌ Erro ao criar subscription:', insertError);
            throw new Error(`Falha ao criar subscription: ${insertError.message}`);
          }

          console.log('💾 Nova subscription criada no banco:', newData);
          setSubscription(newData);
        }
      } else {
        console.warn('⚠️ Supabase não configurado - subscription salva apenas localmente');
        setSubscription(subscriptionData);
      }

      setIsSubscribed(true);
      
      // Salvar localmente também
      localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
      
      return subscriptionData;
    } catch (err) {
      console.error('❌ Erro ao criar subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao ativar notificações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isSupported, registerServiceWorker, requestPermission]);

  // Cancelar subscription
  const unsubscribe = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚫 Cancelando subscription...');
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service Worker não encontrado');
      }

      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        console.log('✅ Subscription cancelada no navegador');
      }

      // Remover do banco de dados
      if (subscription?.id) {
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey && 
            !supabaseUrl.includes('placeholder') && 
            !supabaseKey.includes('placeholder')) {
          
          const { error } = await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);

          if (error) {
            console.warn('⚠️ Erro ao desativar no banco (não crítico):', error);
          }
        }
      } else if (subscription?.customer_phone) {
        // Try to deactivate by phone if no ID
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey && 
            !supabaseUrl.includes('placeholder') && 
            !supabaseKey.includes('placeholder')) {
          
          const { error } = await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('customer_phone', subscription.customer_phone);

          if (error) {
            console.warn('⚠️ Erro ao desativar no banco (não crítico):', error);
          }
        }
      }

      // Also try to deactivate by phone if we have it
      if (subscription?.customer_phone) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey && 
            !supabaseUrl.includes('placeholder') && 
            !supabaseKey.includes('placeholder')) {
          
          const { error } = await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('customer_phone', subscription.customer_phone);

          if (error) {
            console.warn('⚠️ Erro ao desativar no banco (não crítico):', error);
          }
        }
      }

      // Remover do localStorage
      localStorage.removeItem('push_subscription');
      
      setIsSubscribed(false);
      setSubscription(null);
      
      console.log('✅ Subscription removida completamente');
    } catch (err) {
      console.error('❌ Erro ao cancelar subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao desativar notificações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Verificar subscription existente
  const checkExistingSubscription = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    try {
      console.log('🔍 Verificando subscription existente...');
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('ℹ️ Service Worker não registrado');
        return;
      }

      const pushSubscription = await registration.pushManager.getSubscription();
      if (!pushSubscription) {
        console.log('ℹ️ Nenhuma subscription ativa');
        return;
      }

      console.log('✅ Subscription ativa encontrada');
      setIsSubscribed(true);

      // Tentar carregar dados do localStorage
      const savedSubscription = localStorage.getItem('push_subscription');
      if (savedSubscription) {
        try {
          const parsed = JSON.parse(savedSubscription);
          setSubscription(parsed);
          console.log('📱 Dados da subscription carregados do localStorage');
        } catch (parseError) {
          console.warn('⚠️ Erro ao carregar subscription do localStorage:', parseError);
        }
      }
    } catch (err) {
      console.error('❌ Erro ao verificar subscription:', err);
    }
  }, [isSupported]);

  // Testar notificação local
  const testNotification = useCallback(async (title: string = 'Teste - Elite Açaí', body: string = 'Esta é uma notificação de teste!'): Promise<void> => {
    if (!isSupported) {
      throw new Error('Notificações não suportadas');
    }

    if (permission !== 'granted') {
      throw new Error('Permissão para notificações não concedida');
    }

    try {
      console.log('🧪 Enviando notificação de teste...');
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service Worker não registrado');
      }

      await registration.showNotification(title, {
        body,
        icon: '/logo elite.jpeg',
        badge: '/logo elite.jpeg',
        tag: 'test-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'Ver Detalhes'
          },
          {
            action: 'close',
            title: 'Fechar'
          }
        ],
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      });

      console.log('✅ Notificação de teste enviada');
    } catch (err) {
      console.error('❌ Erro ao enviar notificação de teste:', err);
      throw err;
    }
  }, [isSupported, permission]);

  // Enviar notificação via servidor (Edge Function)
  const sendServerNotification = useCallback(async (
    targetPhone: string,
    payload: NotificationPayload
  ): Promise<void> => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl.includes('placeholder') || 
        supabaseKey.includes('placeholder')) {
      console.warn('⚠️ Supabase não configurado - pulando notificação Push');
      return;
    }

    try {
      console.log('📤 Enviando notificação via servidor para:', targetPhone);
      
      // Check if we're in development environment (StackBlitz/WebContainer)
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('webcontainer') ||
                           window.location.hostname.includes('stackblitz');
      
      if (isDevelopment) {
        console.warn('⚠️ Edge Functions não disponíveis no ambiente de desenvolvimento - simulando notificação');
        console.log('📱 Notificação simulada:', { targetPhone, payload });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          target_phone: targetPhone,
          notification: payload
        }
      });

      if (error) {
        // Check for network-related errors
        if (error.message?.includes('Failed to fetch') || error.message?.includes('TypeError')) {
          console.warn('⚠️ Erro de rede ao chamar Edge Function (não crítico) - continuando sem notificação');
        } else {
          console.error('❌ Erro na Edge Function:', error);
          console.warn('⚠️ Falha ao enviar notificação Push (não crítico):', error.message);
        }
        return; // Don't throw error, just log and continue
      }

      console.log('✅ Notificação enviada via servidor:', data);
    } catch (err) {
      // Enhanced error handling for different types of failures
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('⚠️ Erro de conectividade com Edge Function (não crítico) - continuando sem notificação');
      } else {
        console.error('❌ Erro ao enviar notificação via servidor:', err);
        console.warn('⚠️ Notificação Push falhou (não crítico) - continuando sem notificação');
      }
      // Don't throw error to prevent breaking the checkout process
    }
  }, []);

  // Inicializar na montagem do componente
  useEffect(() => {
    checkExistingSubscription();
  }, [checkExistingSubscription]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    testNotification,
    sendServerNotification,
    checkExistingSubscription
  };
};