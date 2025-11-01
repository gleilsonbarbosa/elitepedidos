import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageCircle, 
  User, 
  Calendar, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Award,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Clock
} from 'lucide-react';
import { useCustomerReviews, CustomerReview } from '../../hooks/useCustomerReviews';

const CustomerReviewsPanel: React.FC = () => {
  const [pendingReviews, setPendingReviews] = useState<CustomerReview[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const { 
    getPendingReviews, 
    getApprovedReviews, 
    approveReview, 
    toggleFeatured, 
    deleteReview,
    loading: actionLoading 
  } = useCustomerReviews();

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [pending, approved] = await Promise.all([
        getPendingReviews(),
        getApprovedReviews()
      ]);
      
      setPendingReviews(pending);
      setApprovedReviews(approved);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      await loadReviews();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Avaliação aprovada com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao aprovar avaliação:', error);
      alert('Erro ao aprovar avaliação. Tente novamente.');
    }
  };

  const handleToggleFeatured = async (reviewId: string) => {
    try {
      await toggleFeatured(reviewId);
      await loadReviews();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Status de destaque alterado!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao alterar destaque:', error);
      alert('Erro ao alterar destaque. Tente novamente.');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      await loadReviews();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Avaliação excluída com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      alert('Erro ao excluir avaliação. Tente novamente.');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredReviews = (reviews: CustomerReview[]) => {
    return reviews.filter(review => {
      const matchesSearch = !searchTerm || 
        review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = filterRating === 'all' || review.rating === filterRating;
      
      return matchesSearch && matchesRating;
    });
  };

  const currentReviews = activeTab === 'pending' ? pendingReviews : approvedReviews;
  const filteredReviews = getFilteredReviews(currentReviews);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Star size={24} className="text-yellow-600" />
            Avaliações dos Clientes
          </h2>
          <p className="text-gray-600">Gerencie depoimentos e avaliações do delivery</p>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <Star size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avaliação Média</p>
              <p className="text-2xl font-bold text-gray-800">
                {approvedReviews.length > 0 
                  ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
                  : '5.0'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold text-gray-800">{approvedReviews.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-800">{pendingReviews.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Award size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Em Destaque</p>
              <p className="text-2xl font-bold text-gray-800">
                {approvedReviews.filter(r => r.is_featured).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock size={16} />
            Pendentes ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Check size={16} />
            Aprovadas ({approvedReviews.length})
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou comentário..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas as Avaliações</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 estrelas)</option>
            <option value="4">⭐⭐⭐⭐ (4 estrelas)</option>
            <option value="3">⭐⭐⭐ (3 estrelas)</option>
            <option value="2">⭐⭐ (2 estrelas)</option>
            <option value="1">⭐ (1 estrela)</option>
          </select>
          
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Filter size={16} />
            <span>{filteredReviews.length} de {currentReviews.length}</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {activeTab === 'pending' ? 'Avaliações Pendentes' : 'Avaliações Aprovadas'} ({filteredReviews.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando avaliações...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'Nenhuma avaliação encontrada' : 
               activeTab === 'pending' ? 'Nenhuma avaliação pendente' : 'Nenhuma avaliação aprovada'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Tente buscar por outro termo' : 
               activeTab === 'pending' ? 'Novas avaliações aparecerão aqui' : 'Aprove avaliações para que apareçam aqui'}
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                  review.is_featured ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{review.customer_name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.order_id && (
                        <p className="text-xs text-gray-500">
                          Pedido #{review.order_id.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {review.is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Award size={12} />
                        Destaque
                      </span>
                    )}
                    {activeTab === 'approved' && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                        Aprovada
                      </span>
                    )}
                  </div>
                </div>

                <blockquote className="text-gray-700 italic mb-4 pl-4 border-l-4 border-purple-200">
                  "{review.comment}"
                </blockquote>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {review.customer_phone && (
                      <span>Tel: {review.customer_phone}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activeTab === 'pending' && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={actionLoading}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        <Check size={14} />
                        Aprovar
                      </button>
                    )}
                    
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleToggleFeatured(review.id)}
                        disabled={actionLoading}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                          review.is_featured
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {review.is_featured ? <Award size={14} /> : <Eye size={14} />}
                        {review.is_featured ? 'Remover Destaque' : 'Destacar'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MessageCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como funcionam as Avaliações</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Automáticas:</strong> Clientes podem avaliar após finalizar pedidos</li>
              <li>• <strong>Moderação:</strong> Todas as avaliações precisam ser aprovadas</li>
              <li>• <strong>Destaque:</strong> Avaliações em destaque aparecem no carrossel principal</li>
              <li>• <strong>Visibilidade:</strong> Avaliações aprovadas aparecem na seção "Clientes Felizes"</li>
              <li>• <strong>Qualidade:</strong> Apenas avaliações genuínas de pedidos reais</li>
              <li>• <strong>Transparência:</strong> Todas as avaliações mostram o número do pedido</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReviewsPanel;