import React from 'react';
import { ShoppingBag, Star, ArrowRight, Gift } from 'lucide-react';

interface Recommendation {
  productId: string;
  productName: string;
  reason: string;
  confidence: number;
  imageUrl?: string;
}

interface RecommendationProps {
  recommendations: Recommendation[];
  onSelectRecommendation?: (productId: string) => void;
  title?: string;
  subtitle?: string;
}

const RecommendationDisplay: React.FC<RecommendationProps> = ({
  recommendations,
  onSelectRecommendation,
  title = "Recomendado para você",
  subtitle = "Com base nos seus pedidos anteriores"
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-green-50 p-4 rounded-xl shadow-sm border border-purple-100 text-sm text-gray-800 leading-relaxed space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="text-purple-600" size={18} />
        <h3 className="font-bold text-purple-800">{title}</h3>
      </div>
      
      <p className="text-gray-600 text-sm">{subtitle}</p>
      
      <div className="grid grid-cols-1 gap-3 mt-2">
        {recommendations.map((rec) => (
          <div 
            key={rec.productId}
            className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onSelectRecommendation?.(rec.productId)}
          >
            <div className="flex items-center gap-3">
              {rec.imageUrl ? (
                <img 
                  src={rec.imageUrl} 
                  alt={rec.productName} 
                  className="w-12 h-12 object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback image if loading fails
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400";
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={24} className="text-purple-600" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{rec.productName}</h4>
                <p className="text-xs text-gray-500">{rec.reason}</p>
              </div>
              
              <ArrowRight size={16} className="text-purple-500" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-2">
        Recomendações personalizadas com base no seu perfil e preferências
      </div>
    </div>
  );
};

export default RecommendationDisplay;