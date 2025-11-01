import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Store, AlertCircle, Info } from 'lucide-react';
import { useStoreHours } from '../../hooks/useStoreHours';

interface PickupSchedulerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  className?: string;
}

const PickupScheduler: React.FC<PickupSchedulerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  className = ''
}) => {
  const { storeHours, getStoreStatus } = useStoreHours();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedDateHours, setSelectedDateHours] = useState<{ open_time: string; close_time: string } | null>(null);

  // Get minimum date (today - allowing same day if there are available times)
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Get maximum date (7 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  // Generate available time slots for selected date
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
      setSelectedDateHours(null);
      return;
    }

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = selectedDateObj.getDay();
    
    // Find store hours for selected day
    const dayHours = storeHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!dayHours || !dayHours.is_open) {
      setAvailableTimes([]);
      setSelectedDateHours(null);
      return;
    }

    setSelectedDateHours({
      open_time: dayHours.open_time,
      close_time: dayHours.close_time
    });

    // Generate time slots (every 15 minutes)
    const times: string[] = [];
    const [openHour, openMinute] = dayHours.open_time.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close_time.split(':').map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    // Handle midnight crossing
    const crossesMidnight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
    
    while (true) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check if we've reached the closing time
      if (crossesMidnight) {
        // For midnight crossing, stop when we reach the close time on the next day
        if (currentHour === closeHour && currentMinute >= closeMinute) {
          break;
        }
        // Also stop at midnight if we haven't reached close time yet
        if (currentHour === 24) {
          currentHour = 0;
        }
      } else {
        // For normal hours, stop when we reach the close time
        if (currentHour > closeHour || (currentHour === closeHour && currentMinute >= closeMinute)) {
          break;
        }
      }

      // Add time slot if it's valid
      const now = new Date();
      const selectedDateIsToday = selectedDate === now.toISOString().split('T')[0];
      
      if (selectedDateIsToday) {
        // For today, only show times that are at least 30 minutes from now
        const slotTime = new Date();
        slotTime.setHours(currentHour, currentMinute, 0, 0);
        const minTime = new Date();
        minTime.setMinutes(minTime.getMinutes() + 30);
        
        if (slotTime >= minTime) {
          times.push(timeString);
        }
      } else {
        // For future dates, show all available times
        times.push(timeString);
      }

      // Increment by 15 minutes
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }

      // Safety check to prevent infinite loop
      if (times.length > 100) break;
    }

    setAvailableTimes(times);
  }, [selectedDate, storeHours]);

  // Auto-select first available time when date changes
  useEffect(() => {
    if (availableTimes.length > 0 && !selectedTime) {
      onTimeChange(availableTimes[0]);
    }
  }, [availableTimes, selectedTime, onTimeChange]);

  const getDayName = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const isDateDisabled = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const dayHours = storeHours.find(h => h.day_of_week === dayOfWeek);
    
    return !dayHours || !dayHours.is_open;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Store size={20} className="text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800 mb-2">Retirada na Loja Selecionada</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>📍 Endereço:</strong> Rua Um, 1614-C – Residencial 1 – Cágado</p>
              <p><strong>📞 Telefone:</strong> (85) 98904-1010</p>
              <p><strong>💰 Taxa de entrega:</strong> Grátis (retirada na loja)</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data para Retirada *
        </label>
        <div className="relative">
          <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Escolha uma data entre hoje e {new Date(getMaxDate()).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horário para Retirada *
          </label>
          
          {isDateDisabled(selectedDate) ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Loja fechada neste dia</p>
                  <p className="text-red-700 text-sm">
                    A loja não funciona em {getDayName(selectedDate)}. Escolha outro dia.
                  </p>
                </div>
              </div>
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Nenhum horário disponível</p>
                  <p className="text-yellow-700 text-sm">
                    Não há horários disponíveis para {getDayName(selectedDate)}. Tente outro dia.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedTime}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione um horário</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedDateHours && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-blue-600" />
                    <div className="text-sm text-blue-700">
                      <p><strong>Horário de funcionamento em {getDayName(selectedDate)}:</strong></p>
                      <p>{selectedDateHours.open_time} às {selectedDateHours.close_time}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Informações Importantes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Seu pedido ficará pronto no horário agendado</li>
              <li>• Chegue até 15 minutos após o horário marcado</li>
              <li>• Traga um documento com foto para retirada</li>
              <li>• Em caso de atraso, entre em contato conosco</li>
              <li>• Pagamento pode ser feito na retirada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupScheduler;