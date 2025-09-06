import React, { useState, useEffect } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { ActivePromotion } from '../../types/promotion';
import { useStoreHours } from '../../hooks/useStoreHours';

interface PromotionCountdownProps {
  promotion: ActivePromotion;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const PromotionCountdown: React.FC<PromotionCountdownProps> = ({ 
  promotion, 
  className = '',
  size = 'medium'
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const { storeHours } = useStoreHours();

  useEffect(() => {
    const updateCountdown = () => {
      // Usar horário de Brasília
      const now = new Date();
      const brasiliaOffset = -3; // UTC-3
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brasilia = new Date(utc + (brasiliaOffset * 3600000));
      
      // Obter horário de abertura da loja para hoje
      const currentDay = brasilia.getDay();
      const todayHours = storeHours.find(h => h.day_of_week === currentDay);
      
      let startTime = new Date(promotion.start_time);
      
      // Se há horário de abertura configurado e a promoção começa antes da abertura
      if (todayHours && todayHours.is_open && todayHours.open_time) {
        const [openHour, openMinute] = todayHours.open_time.split(':').map(Number);
        
        // Criar data de abertura para hoje
        const storeOpeningToday = new Date(brasilia);
        storeOpeningToday.setHours(openHour, openMinute, 0, 0);
        
        // Se a promoção está programada para começar antes da abertura da loja
        // ou se ainda não chegou o horário de abertura, usar o horário de abertura
        if (startTime < storeOpeningToday || brasilia < storeOpeningToday) {
          startTime = storeOpeningToday;
        }
      }
      
      const end = new Date(promotion.end_time);
      
      // Se ainda não chegou o horário de início (abertura da loja)
      if (brasilia < startTime) {
        // Mostrar tempo até o início da promoção
        const diffToStart = startTime.getTime() - brasilia.getTime();
        setTimeRemaining(diffToStart);
        setIsExpired(false);
        return;
      }
      
      // Calcular tempo restante da promoção
      const diff = end.getTime() - brasilia.getTime();
      
      setTimeRemaining(Math.max(0, diff));
      setIsExpired(diff <= 0);
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [promotion.start_time, promotion.end_time, storeHours]);

  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getUrgencyLevel = () => {
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    
    if (minutes <= 0) return 'expired';
    if (minutes <= 10) return 'critical';
    if (minutes <= 30) return 'warning';
    return 'normal';
  };

  const getUrgencyStyles = () => {
    const urgency = getUrgencyLevel();
    
    switch (urgency) {
      case 'expired':
        return {
          container: 'bg-gray-100 border-gray-300',
          text: 'text-gray-600',
          timer: 'text-gray-500',
          message: 'Promoção encerrada'
        };
      case 'critical':
        return {
          container: 'bg-red-100 border-red-300 animate-pulse',
          text: 'text-red-800',
          timer: 'text-red-600 font-bold',
          message: 'ÚLTIMOS MINUTOS!'
        };
      case 'warning':
        return {
          container: 'bg-orange-100 border-orange-300',
          text: 'text-orange-800',
          timer: 'text-orange-600 font-bold',
          message: 'Aproveite logo!'
        };
      default:
        return {
          container: 'bg-green-100 border-green-300',
          text: 'text-green-800',
          timer: 'text-green-600',
          message: 'Promoção ativa'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-2',
          timer: 'text-sm',
          message: 'text-xs',
          icon: 14
        };
      case 'large':
        return {
          container: 'p-4',
          timer: 'text-2xl',
          message: 'text-base',
          icon: 24
        };
      default:
        return {
          container: 'p-3',
          timer: 'text-lg',
          message: 'text-sm',
          icon: 18
        };
    }
  };

  const urgencyStyles = getUrgencyStyles();
  const sizeStyles = getSizeStyles();

  if (isExpired) {
    return (
      <div className={`border-2 rounded-lg ${urgencyStyles.container} ${sizeStyles.container} ${className}`}>
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle size={sizeStyles.icon} className={urgencyStyles.text} />
          <span className={`font-medium ${urgencyStyles.text} ${sizeStyles.message}`}>
            {urgencyStyles.message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-lg ${urgencyStyles.container} ${sizeStyles.container} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock size={sizeStyles.icon} className={urgencyStyles.text} />
          <span className={`font-medium ${urgencyStyles.text} ${sizeStyles.message}`}>
            {urgencyStyles.message}
          </span>
        </div>
        
        <div className={`font-mono ${urgencyStyles.timer} ${sizeStyles.timer}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      {getUrgencyLevel() === 'critical' && (
        <div className="mt-2 text-center">
          <span className="text-red-600 font-bold text-xs animate-bounce">
            🔥 ÚLTIMOS MINUTOS! 🔥
          </span>
        </div>
      )}
    </div>
  );
};

export default PromotionCountdown;