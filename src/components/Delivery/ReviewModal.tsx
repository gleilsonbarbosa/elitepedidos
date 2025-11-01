import React, { useState } from 'react';
import { X, Star, Send, Heart, MessageCircle } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  customerPhone: string;
  onSubmitReview: (review: {
    rating: number;
    comment: string;
    customer_name: string;
    customer_phone: string;
    order_id: string;
  }) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName,
  customerPhone,
  onSubmitReview
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Por favor, selecione uma avaliação de 1 a 5 estrelas');
      return;
    }

    if (!comment.trim()) {
      alert('Por favor, escreva um comentário sobre sua experiência');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitReview({
        rating,
        comment: comment.trim(),
        customer_name: customerName,
        customer_phone: customerPhone,
        order_id: orderId
      });
      
      // Show success message
      alert('🎉 Obrigado pela sua avaliação!\n\nSua opinião é muito importante para nós e pode aparecer na nossa página de delivery para ajudar outros clientes!');
      
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className={`transition-all duration-200 transform hover:scale-110 ${
            isActive ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          <Star
            size={32}
            className={isActive ? 'fill-current' : ''}
          />
        </button>
      );
    });
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return '😞 Muito Insatisfeito';
      case 2: return '😐 Insatisfeito';
      case 3: return '😊 Satisfeito';
      case 4: return '😍 Muito Satisfeito';
      case 5: return '🤩 Excelente!';
      default: return 'Selecione uma avaliação';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                <Heart size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Avalie sua Experiência</h2>
                <p className="text-gray-600 text-sm">Pedido #{orderId.slice(-8)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Como foi sua experiência?
            </h3>
            
            <div className="flex justify-center gap-2 mb-4">
              {renderStars()}
            </div>
            
            <p className={`text-sm font-medium transition-colors ${
              rating > 0 ? 'text-purple-600' : 'text-gray-500'
            }`}>
              {getRatingLabel(rating)}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conte-nos sobre sua experiência:
            </label>
            <div className="relative">
              <MessageCircle size={20} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={4}
                placeholder="Ex: Açaí delicioso, entrega rápida, atendimento excelente..."
                maxLength={300}
                required
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Sua opinião pode aparecer na nossa página de delivery ⭐</span>
              <span>{comment.length}/300</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
              <Heart size={16} />
              Por que sua avaliação é importante?
            </h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Ajuda outros clientes a conhecer nossa qualidade</li>
              <li>• Nos motiva a manter sempre o melhor atendimento</li>
              <li>• Sua opinião pode aparecer destacada no site</li>
              <li>• Contribui para melhorarmos cada vez mais</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send size={20} />
                Enviar Avaliação
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;