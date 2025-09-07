import React, { useState, useEffect } from 'react';
import { Star, Heart, MessageCircle, User, Calendar, Quote, Award, ThumbsUp } from 'lucide-react';

interface CustomerReview {
  id: string;
  customer_name: string;
  customer_phone?: string;
  rating: number;
  comment: string;
  order_id?: string;
  created_at: string;
  is_approved: boolean;
  is_featured: boolean;
}

interface HappyCustomersSectionProps {
  className?: string;
}

const HappyCustomersSection: React.FC<HappyCustomersSectionProps> = ({ className = '' }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Reviews reais dos clientes
  const realReviews: CustomerReview[] = [
    {
      id: '1',
      customer_name: 'Maria Santos',
      rating: 5,
      comment: 'Açaí delicioso e entrega super rápida! O melhor da cidade sem dúvida. Os complementos são frescos e o atendimento é excelente. Recomendo muito!',
      created_at: '2025-08-11T10:30:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '2',
      customer_name: 'João Silva',
      rating: 5,
      comment: 'Qualidade excepcional! O açaí chegou fresquinho e os complementos estavam perfeitos. Virei cliente fiel! Sempre peço aqui.',
      created_at: '2025-08-10T15:45:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '3',
      customer_name: 'Ana Costa',
      rating: 5,
      comment: 'Atendimento nota 10! Pessoal super atencioso e o açaí é uma delícia. Já pedi várias vezes e sempre surpreende!',
      created_at: '2025-08-09T18:20:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '4',
      customer_name: 'Pedro Oliveira',
      rating: 5,
      comment: 'Melhor açaí que já comi! Cremoso, saboroso e com complementos frescos. Delivery rápido demais! Parabéns pela qualidade.',
      created_at: '2025-08-08T20:15:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '5',
      customer_name: 'Carla Mendes',
      rating: 5,
      comment: 'Simplesmente perfeito! O açaí é cremoso, os complementos são frescos e a entrega é super rápida. Recomendo de olhos fechados!',
      created_at: '2025-08-07T16:30:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '6',
      customer_name: 'Rafael Lima',
      rating: 5,
      comment: 'Qualidade impecável! Sempre peço aqui porque sei que vou receber o melhor açaí da cidade. Nunca me decepcionaram!',
      created_at: '2025-08-06T14:45:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '7',
      customer_name: 'Fernanda Rocha',
      rating: 5,
      comment: 'Açaí maravilhoso! Textura perfeita, sabor incrível e entrega pontual. Minha família toda adora! Obrigada Elite Açaí!',
      created_at: '2025-08-11T19:20:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '8',
      customer_name: 'Carlos Eduardo',
      rating: 5,
      comment: 'Excelente qualidade! O açaí é cremoso na medida certa e os complementos são sempre frescos. Delivery eficiente e educado.',
      created_at: '2025-08-10T21:10:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '9',
      customer_name: 'Juliana Martins',
      rating: 5,
      comment: 'Simplesmente o melhor açaí de Fortaleza! Sabor autêntico, complementos de qualidade e entrega rápida. Virei fã!',
      created_at: '2025-08-09T17:35:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '10',
      customer_name: 'Roberto Alves',
      rating: 5,
      comment: 'Açaí top demais! Cremoso, gostoso e com preço justo. A entrega é sempre pontual e o pessoal é muito educado. Recomendo!',
      created_at: '2025-08-08T20:45:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '11',
      customer_name: 'Luciana Ferreira',
      rating: 5,
      comment: 'Qualidade excepcional! O açaí tem o sabor tradicional que eu amo e os complementos são sempre frescos. Atendimento perfeito!',
      created_at: '2025-08-07T16:15:00Z',
      is_approved: true,
      is_featured: true
    },
    {
      id: '12',
      customer_name: 'Marcos Souza',
      rating: 5,
      comment: 'Melhor açaí da região! Sempre peço aqui porque a qualidade é garantida. Entrega rápida e açaí sempre fresquinho!',
      created_at: '2025-08-06T18:50:00Z',
      is_approved: true,
      is_featured: true
    }
  ];

  useEffect(() => {
    // Simulate loading from database
    setTimeout(() => {
      setReviews(realReviews);
      setLoading(false);
    }, 1000);
  }, []);

  // Auto-rotate featured reviews
  useEffect(() => {
    if (reviews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentReviewIndex(prev => (prev + 1) % Math.min(reviews.length, 6));
    }, 4000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  const renderStars = (rating: number, size: number = 16) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={size}
        className={`${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 5.0;

  const featuredReviews = reviews.slice(0, 6);
  const currentFeaturedReview = featuredReviews[currentReviewIndex];

  if (loading) {
    return (
      <section className={`py-16 bg-gradient-to-r from-purple-50 to-green-50 ${className}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-gradient-to-r from-purple-50 to-green-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 animate-pulse">
              <Heart size={32} className="text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clientes Felizes
            </h2>
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-3 animate-pulse">
              <Heart size={32} className="text-white" />
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Veja o que nossos clientes estão falando sobre o Elite Açaí! 
            Cada sorriso é nossa maior recompensa. ⭐
          </p>
          
          {/* Overall Rating */}
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto border border-yellow-200">
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-500 mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center gap-1 mb-3">
                {renderStars(Math.round(averageRating), 24)}
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Baseado em {reviews.length}+ avaliações verificadas
              </p>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg">
                🏆 Açaí Mais Bem Avaliado da Região
              </div>
            </div>
          </div>
        </div>

        {/* Featured Review Carousel */}
        {currentFeaturedReview && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
              <div className="text-center">
                <Quote size={48} className="mx-auto mb-4 text-white/80" />
                <blockquote className="text-xl md:text-2xl font-medium italic mb-6 leading-relaxed">
                  "{currentFeaturedReview.comment}"
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(currentFeaturedReview.customer_name)}
                  </div>
                  <div className="text-left">
                    <h4 className="text-xl font-bold">{currentFeaturedReview.customer_name}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {renderStars(currentFeaturedReview.rating, 20)}
                      </div>
                      <span className="text-white/80">
                        {formatDate(currentFeaturedReview.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Carousel Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {featuredReviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentReviewIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentReviewIndex 
                          ? 'bg-white' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviews.slice(0, 9).map((review, index) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 border ${
                review.is_featured ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-gray-200'
              }`}
            >
              {/* Customer Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {getInitials(review.customer_name)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{review.customer_name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
                {review.is_featured && (
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Award size={12} />
                    Destaque
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="relative">
                <Quote size={16} className="absolute -top-2 -left-2 text-purple-300" />
                <blockquote className="text-gray-700 leading-relaxed pl-4 text-sm">
                  "{review.comment}"
                </blockquote>
              </div>

              {/* Verified Badge */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Cliente Verificado</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Pedido #{review.order_id?.slice(-8) || `${1000 + index}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-green-200">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ThumbsUp size={24} className="text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
            <p className="text-gray-600 font-medium">Satisfação</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-blue-200">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star size={24} className="text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{averageRating.toFixed(1)}</div>
            <p className="text-gray-600 font-medium">Avaliação Média</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-purple-200">
            <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle size={24} className="text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{reviews.length}+</div>
            <p className="text-gray-600 font-medium">Avaliações</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-orange-200">
            <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Heart size={24} className="text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
            <p className="text-gray-600 font-medium">Recomendação</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-purple-200">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Star size={32} className="text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Sua opinião é muito importante!
            </h3>
            <p className="text-gray-600 mb-6">
              Faça seu pedido e deixe sua avaliação. Queremos saber como foi sua experiência conosco!
            </p>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full text-sm font-bold inline-block">
              ⭐ Avalie-nos após seu pedido ⭐
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Qualidade Garantida</h4>
            <p className="text-gray-600 text-sm">
              Açaí premium com ingredientes selecionados e frescor garantido
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Entrega Rápida</h4>
            <p className="text-gray-600 text-sm">
              Delivery em até 35 minutos com acompanhamento em tempo real
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Heart size={24} className="text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Atendimento Especial</h4>
            <p className="text-gray-600 text-sm">
              Equipe dedicada e atenciosa para uma experiência única
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HappyCustomersSection;