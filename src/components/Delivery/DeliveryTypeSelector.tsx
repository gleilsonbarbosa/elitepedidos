import React from 'react';
import { Truck, Store, Clock, MapPin } from 'lucide-react';

interface DeliveryTypeSelectorProps {
  selectedType: 'delivery' | 'pickup';
  onTypeChange: (type: 'delivery' | 'pickup') => void;
  className?: string;
}

const DeliveryTypeSelector: React.FC<DeliveryTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Como você quer receber?</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
          selectedType === 'delivery'
            ? 'border-purple-500 bg-purple-50 shadow-md'
            : 'border-gray-200 hover:border-purple-200'
        }`}>
          <input
            type="radio"
            name="deliveryType"
            value="delivery"
            checked={selectedType === 'delivery'}
            onChange={(e) => onTypeChange(e.target.value as 'delivery' | 'pickup')}
            className="sr-only"
          />
          <div className={`rounded-full p-3 ${
            selectedType === 'delivery' ? 'bg-purple-100' : 'bg-gray-100'
          }`}>
            <Truck size={24} className={selectedType === 'delivery' ? 'text-purple-600' : 'text-gray-600'} />
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold text-lg ${
              selectedType === 'delivery' ? 'text-purple-800' : 'text-gray-800'
            }`}>
              Delivery
            </h4>
            <p className="text-sm text-gray-600">
              Receba em casa com taxa de entrega
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">35-50 minutos</span>
            </div>
          </div>
        </label>

        <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
          selectedType === 'pickup'
            ? 'border-green-500 bg-green-50 shadow-md'
            : 'border-gray-200 hover:border-green-200'
        }`}>
          <input
            type="radio"
            name="deliveryType"
            value="pickup"
            checked={selectedType === 'pickup'}
            onChange={(e) => onTypeChange(e.target.value as 'delivery' | 'pickup')}
            className="sr-only"
          />
          <div className={`rounded-full p-3 ${
            selectedType === 'pickup' ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Store size={24} className={selectedType === 'pickup' ? 'text-green-600' : 'text-gray-600'} />
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold text-lg ${
              selectedType === 'pickup' ? 'text-green-800' : 'text-gray-800'
            }`}>
              Retirada na Loja
            </h4>
            <p className="text-sm text-gray-600">
              Busque na loja sem taxa de entrega
            </p>
            <div className="flex items-center gap-2 mt-2">
              <MapPin size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">Agende seu horário</span>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default DeliveryTypeSelector;