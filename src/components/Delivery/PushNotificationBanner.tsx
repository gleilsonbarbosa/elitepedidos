import React, { useState, useEffect } from 'react';
import { Bell, X, Smartphone, Check, AlertCircle } from 'lucide-react';
import { useWebPush } from '../../hooks/useWebPush';

interface PushNotificationBannerProps {
  customerPhone?: string;
  customerName?: string;
  onSubscribed?: (subscription: any) => void;
  className?: string;
}

const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  customerPhone,
  customerName,
  onSubscribed,
  className = ''
}) => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    testNotification
  } = useWebPush();

  const [isVisible, setIsVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mostrar banner apenas se:
  // 1. Push é suportado
  // 2. Usuário ainda não se inscreveu
  // 3. Permissão não foi negada permanentemente
  useEffect(() => {
    const shouldShow = isSupported && 
                      !isSubscribed && 
                      permission !== 'denied' &&
                      !localStorage.getItem('push_banner_dismissed');
    
    setIsVisible(shouldShow);
  }, [isSupported, isSubscribed, permission]);

  const handleSubscribe = async () => {
    try {
      console.log('📱 Iniciando processo de inscrição...');
      
      const subscription = await subscribe(customerPhone, customerName);
      
      setShowSuccess(true);
      setIsVisible(false);
      
      if (onSubscribed) {
        onSubscribed(subscription);
      }

      // Testar notificação após inscrição
      setTimeout(async () => {
        try {
          await testNotification(
            '🎉 Notificações Ativadas!',
            'Agora você receberá atualizações dos seus pedidos em tempo real!'
          );
        } catch (testError) {
          console.warn('⚠️ Erro no teste de notificação (não crítico):', testError);
        }
      }, 2000);

      // Mostrar mensagem de sucesso por 5 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

    } catch (err) {
      console.error('❌ Erro ao ativar notificações:', err);
      
      let errorMessage = 'Erro ao ativar notificações';
      if (err instanceof Error) {
        if (err.message.includes('denied')) {
          errorMessage = 'Permissão negada. Ative as notificações nas configurações do navegador.';
        } else if (err.message.includes('não suportadas')) {
          errorMessage = 'Seu navegador não suporta notificações Push.';
        } else {
          errorMessage = err.message;
        }
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('push_banner_dismissed', 'true');
    console.log('🚫 Banner de notificações dispensado pelo usuário');
  };

  const handleUnsubscribe = async () => {
    if (confirm('Tem certeza que deseja desativar as notificações?')) {
      try {
        await unsubscribe();
        setIsVisible(true); // Mostrar banner novamente
        localStorage.removeItem('push_banner_dismissed');
        
        alert('✅ Notificações desativadas com sucesso!');
      } catch (err) {
        console.error('❌ Erro ao desativar notificações:', err);
        alert('❌ Erro ao desativar notificações');
      }
    }
  };

  // Banner de sucesso
  if (showSuccess) {
    return (
      <div className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 shadow-lg ${className}`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Check size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">🎉 Notificações Ativadas!</h3>
            <p className="text-green-100">
              Agora você receberá atualizações dos seus pedidos em tempo real!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Status de inscrito
  if (isSubscribed) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Notificações Ativas</h3>
              <p className="text-blue-600 text-sm">
                Você receberá atualizações dos seus pedidos
              </p>
            </div>
          </div>
          <button
            onClick={handleUnsubscribe}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Desativar
          </button>
        </div>
      </div>
    );
  }

  // Banner principal
  if (!isVisible) return null;

  return (
    <div className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl p-4 shadow-lg ${className}`}>
      <div className="flex items-start gap-3">
        <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
          <Bell size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg mb-1">
                📱 Quer receber atualizações do seu pedido?
              </h3>
              <p className="text-purple-100 text-sm">
                Ative as notificações e saiba em tempo real quando seu açaí estiver pronto!
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <Smartphone size={16} />
              <span>✅ Funciona mesmo com o app fechado</span>
            </div>
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <Bell size={16} />
              <span>✅ Notificações instantâneas sobre seu pedido</span>
            </div>
            <div className="flex items-center gap-2 text-purple-100 text-sm">
              <Check size={16} />
              <span>✅ Sem spam - apenas atualizações importantes</span>
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-500/20 border border-red-300/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-200" />
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubscribe}
              disabled={loading || !isSupported}
              className="flex-1 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Ativando...
                </>
              ) : (
                <>
                  <Bell size={18} />
                  Ativar Notificações
                </>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-white/80 hover:text-white text-sm font-medium"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationBanner;