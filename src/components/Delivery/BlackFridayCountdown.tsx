import React, { useState, useEffect } from 'react';
import { Clock, Zap, Tag } from 'lucide-react';

interface BlackFridayCountdownProps {
  className?: string;
}

const BlackFridayCountdown: React.FC<BlackFridayCountdownProps> = ({ className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const brasiliaOffset = -3;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brasilia = new Date(utc + (brasiliaOffset * 3600000));

      const currentDay = brasilia.getDay();

      if (currentDay === 6) {
        const endOfDay = new Date(brasilia);
        endOfDay.setHours(23, 59, 59, 999);
        const diff = endOfDay.getTime() - brasilia.getTime();
        setTimeRemaining(Math.max(0, diff));
      } else {
        let daysUntilSaturday = (6 - currentDay + 7) % 7;
        if (daysUntilSaturday === 0) daysUntilSaturday = 7;

        const nextSaturday = new Date(brasilia);
        nextSaturday.setDate(brasilia.getDate() + daysUntilSaturday);
        nextSaturday.setHours(0, 0, 0, 0);

        const diff = nextSaturday.getTime() - brasilia.getTime();
        setTimeRemaining(Math.max(0, diff));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (milliseconds: number) => {
    if (milliseconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
  };

  const time = formatTime(timeRemaining);
  const now = new Date();
  const brasiliaOffset = -3;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasilia = new Date(utc + (brasiliaOffset * 3600000));
  const isToday = brasilia.getDay() === 6;

  return (
    <div className={`bg-black text-white rounded-2xl p-6 shadow-2xl ${className}`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <Tag size={32} className="text-yellow-400" />
        <h2 className="text-3xl font-bold text-center">
          {isToday ? '🔥 BLACK FRIDAY HOJE!' : '⚡ Próxima Black Friday'}
        </h2>
        <Tag size={32} className="text-yellow-400" />
      </div>

      <p className="text-center text-yellow-300 text-lg mb-6 font-semibold">
        {isToday
          ? 'Aproveite as ofertas imperdíveis!'
          : 'Prepare-se para descontos exclusivos!'}
      </p>

      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 mb-2 shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-black">
              {time.days.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-sm md:text-base text-gray-300 font-medium uppercase">Dias</div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 mb-2 shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-black">
              {time.hours.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-sm md:text-base text-gray-300 font-medium uppercase">Horas</div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 mb-2 shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-black">
              {time.minutes.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-sm md:text-base text-gray-300 font-medium uppercase">Min</div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 mb-2 shadow-lg transform hover:scale-105 transition-transform">
            <div className="text-4xl md:text-5xl font-bold text-black">
              {time.seconds.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-sm md:text-base text-gray-300 font-medium uppercase">Seg</div>
        </div>
      </div>

      {isToday && time.hours < 3 && (
        <div className="mt-6 text-center animate-pulse">
          <span className="text-red-500 font-bold text-xl">
            ⚠️ ÚLTIMAS HORAS! ⚠️
          </span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-yellow-400">
        <Zap size={20} className="animate-pulse" />
        <span className="text-sm font-medium">
          {isToday ? 'Ofertas válidas até às 23h' : 'Todo sábado é Black Friday!'}
        </span>
        <Zap size={20} className="animate-pulse" />
      </div>
    </div>
  );
};

export default BlackFridayCountdown;
