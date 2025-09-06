import React, { useState, useEffect } from 'react';
import { Zap, Clock, AlertCircle } from 'lucide-react';
import { usePromotions } from '../../hooks/usePromotions';
import { ActivePromotion } from '../../types/promotion';
import { useStoreHours } from '../../hooks/useStoreHours';

interface PromotionBannerProps {
  onPromotionClick?: (promotion: ActivePromotion) => void;
}

const PromotionBanner: React.FC<PromotionBannerProps> = ({ onPromotionClick }) => {
  const { activePromotions } = usePromotions();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { storeHours } = useStoreHours();

  // Update time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (endTime: string) => {
    // Usar horário de Brasília
    const now = currentTime;
    const brasiliaOffset = -3; // UTC-3
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasilia = new Date(utc + (brasiliaOffset * 3600000));
    
    const end = new Date(endTime);
    const diff = end.getTime() - brasilia.getTime();
    
    if (diff <= 0) return 'EXPIRADA';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getTimeRemainingColor = (endTime: string) => {
    // Usar horário de Brasília
    const now = currentTime;
    const brasiliaOffset = -3; // UTC-3
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasilia = new Date(utc + (brasiliaOffset * 3600000));
    
    const end = new Date(endTime);
    const diff = end.getTime() - brasilia.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes <= 0) return 'text-red-600';
    if (minutes <= 30) return 'text-orange-600';
    if (minutes <= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const isPromotionExpiring = (endTime: string) => {
    // Usar horário de Brasília
    const now = currentTime;
    const brasiliaOffset = -3; // UTC-3
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasilia = new Date(utc + (brasiliaOffset * 3600000));
    
    const end = new Date(endTime);
    const diff = end.getTime() - brasilia.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    return minutes <= 30 && minutes > 0;
  };

  const isPromotionStarted = (promotion: ActivePromotion) => {
    // Usar horário de Brasília
    const now = currentTime;
    const brasiliaOffset = -3; // UTC-3
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasilia = new Date(utc + (brasiliaOffset * 3600000));
    
    // Obter horário de abertura da loja para hoje
    const currentDay = brasilia.getDay();
    const todayHours = storeHours.find(h => h.day_of_week === currentDay);
    
    let effectiveStartTime = new Date(promotion.start_time);
    
    // Se há horário de abertura configurado
    if (todayHours && todayHours.is_open && todayHours.open_time) {
      const [openHour, openMinute] = todayHours.open_time.split(':').map(Number);
      
      // Criar data de abertura para hoje
      const storeOpeningToday = new Date(brasilia);
      storeOpeningToday.setHours(openHour, openMinute, 0, 0);
      
      // Se a promoção está programada para começar antes da abertura da loja
      if (effectiveStartTime < storeOpeningToday) {
        effectiveStartTime = storeOpeningToday;
      }
    }
    
    return brasilia >= effectiveStartTime;
  };
  if (activePromotions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {activePromotions.map((promotion) => {
        const timeRemaining = formatTimeRemaining(promotion.end_time);
        const isExpiring = isPromotionExpiring(promotion.end_time);
        const isExpired = timeRemaining === 'EXPIRADA';
        const hasStarted = isPromotionStarted(promotion);
        
        if (isExpired) return null; // Não mostrar promoções expiradas
        if (!hasStarted) return null; // Não mostrar promoções que ainda não começaram
        
        return (
          <div
            key={promotion.id}
            className={`relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 ${
              isExpiring 
                ? 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse' 
                : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500'
            }`}
            onClick={() => onPromotionClick?.(promotion)}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/20 to-transparent rounded-full"></div>
            </div>

            <div className="relative z-10 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Zap size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{promotion.title}</h2>
                    {promotion.description && (
                      <p className="text-white/90">{promotion.description}</p>
                    )}
                  </div>
                </div>
                
                {/* Countdown Timer */}
                <div className="text-center">
                  <div className={`text-3xl font-bold font-mono ${
                    isExpiring ? 'animate-pulse' : ''
                  }`}>
                    {timeRemaining}
                  </div>
                  <p className="text-white/80 text-sm font-medium">
                    {isExpiring ? '⚠️ ÚLTIMOS MINUTOS!' : 'Tempo restante'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <h3 className="text-sm font-medium text-white/80">Produto</h3>
                    <p className="font-bold text-lg">{promotion.product_name}</p>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <h3 className="text-sm font-medium text-white/80">Preço Promocional</h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-2xl">{formatPrice(promotion.promotional_price)}</span>
                      <span className="text-white/70 line-through text-lg">{formatPrice(promotion.original_price)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <h3 className="text-sm font-medium text-white/80">Economia</h3>
                    <p className="font-bold text-xl text-yellow-200">
                      {formatPrice(promotion.original_price - promotion.promotional_price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Urgency Message */}
              {isExpiring && (
                <div className="mt-4 bg-red-600/80 backdrop-blur-sm rounded-lg p-3 border border-red-400">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-white animate-pulse" />
                    <p className="font-bold text-white">
                      🔥 ÚLTIMOS MINUTOS! Aproveite antes que expire!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionBanner;