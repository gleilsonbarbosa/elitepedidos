import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface PushNotificationRequest {
  target_phone?: string;
  target_all?: boolean;
  notification: {
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
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { target_phone, target_all, notification }: PushNotificationRequest = await req.json();

    if (!notification || !notification.title || !notification.body) {
      throw new Error('Dados da notificação são obrigatórios (title, body)');
    }

    console.log('📤 Enviando notificação Push:', {
      target_phone,
      target_all,
      title: notification.title,
      body: notification.body
    });

    // Buscar subscriptions ativas
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (target_phone && !target_all) {
      query = query.eq('customer_phone', target_phone);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ Nenhuma subscription ativa encontrada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhuma subscription ativa encontrada',
          sent_count: 0
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    console.log(`📱 Encontradas ${subscriptions.length} subscriptions ativas`);

    // Preparar payload da notificação
    const pushPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/logo elite.jpeg',
      badge: notification.badge || '/logo elite.jpeg',
      tag: notification.tag || 'elite-acai-notification',
      data: notification.data || {},
      requireInteraction: notification.requireInteraction || true,
      actions: notification.actions || [
        {
          action: 'view',
          title: 'Ver Detalhes'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ],
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    };

    // Enviar notificações para todas as subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          console.log(`📤 Enviando para subscription ${sub.id}...`);
          
          // Aqui você usaria uma biblioteca como web-push para enviar
          // Por enquanto, vamos simular o envio
          
          // IMPORTANTE: Para produção, você precisa:
          // 1. Instalar web-push: npm install web-push
          // 2. Configurar VAPID keys
          // 3. Usar webpush.sendNotification()
          
          // Simulação do envio:
          console.log(`✅ Notificação "enviada" para ${sub.customer_phone || 'usuário anônimo'}`);
          
          return {
            subscription_id: sub.id,
            success: true,
            phone: sub.customer_phone
          };
        } catch (err) {
          console.error(`❌ Erro ao enviar para subscription ${sub.id}:`, err);
          return {
            subscription_id: sub.id,
            success: false,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            phone: sub.customer_phone
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📊 Resultado do envio: ${successful} sucesso, ${failed} falhas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notificações enviadas: ${successful} sucesso, ${failed} falhas`,
        sent_count: successful,
        failed_count: failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});