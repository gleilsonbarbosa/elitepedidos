import React, { useState } from 'react';
import { usePromotions } from '../../hooks/usePromotions';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { Promotion, PromotionFormData } from '../../types/promotion';
import { 
  Zap, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Clock,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const PromotionsPanel: React.FC = () => {
  const { 
    promotions, 
    activePromotions, 
    loading, 
    createPromotion, 
    updatePromotion, 
    deletePromotion 
  } = usePromotions();
  
  const { products } = useDeliveryProducts();

  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PromotionFormData>({
    product_id: '',
    promotional_price: 0,
    start_time: '',
    end_time: '',
    title: '',
    description: ''
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirada';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min restantes`;
    }
    return `${minutes}min restantes`;
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      promotional_price: 0,
      start_time: '',
      end_time: '',
      title: '',
      description: ''
    });
    setEditingPromotion(null);
  };

  const handleCreate = () => {
    resetForm();
    
    // Set default times (now to 22:00 today)
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(22, 0, 0, 0);
    
    setFormData(prev => ({
      ...prev,
      start_time: now.toISOString().slice(0, 16),
      end_time: endOfDay.toISOString().slice(0, 16)
    }));
    
    setShowModal(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setFormData({
      product_id: promotion.product_id,
      promotional_price: promotion.promotional_price,
      start_time: new Date(promotion.start_time).toISOString().slice(0, 16),
      end_time: new Date(promotion.end_time).toISOString().slice(0, 16),
      title: promotion.title,
      description: promotion.description || ''
    });
    setEditingPromotion(promotion);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.title || formData.promotional_price <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    
    if (endTime <= startTime) {
      alert('O horário de término deve ser posterior ao horário de início');
      return;
    }

    setSaving(true);
    try {
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, {
          ...formData,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        });
      } else {
        await createPromotion({
          ...formData,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        });
      }

      setShowModal(false);
      resetForm();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Promoção ${editingPromotion ? 'atualizada' : 'criada'} com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
      alert('Erro ao salvar promoção. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Tem certeza que deseja excluir a promoção "${promotion.title}"?`)) {
      return;
    }

    try {
      await deletePromotion(promotion.id);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Promoção excluída com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao excluir promoção:', error);
      alert('Erro ao excluir promoção. Tente novamente.');
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      await updatePromotion(promotion.id, {
        is_active: !promotion.is_active
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da promoção.');
    }
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_time);
    const end = new Date(promotion.end_time);
    
    return promotion.is_active && now >= start && now <= end;
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_time);
    const end = new Date(promotion.end_time);
    
    if (!promotion.is_active) return { label: 'Inativa', color: 'bg-gray-100 text-gray-800' };
    if (now < start) return { label: 'Agendada', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { label: 'Expirada', color: 'bg-red-100 text-red-800' };
    return { label: 'Ativa', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Carregando promoções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={24} className="text-orange-600" />
            Gerenciar Promoções
          </h2>
          <p className="text-gray-600">Configure promoções temporárias com contador em tempo real</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Promoção
        </button>
      </div>

      {/* Active Promotions Summary */}
      {activePromotions.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <Zap size={20} />
            Promoções Ativas ({activePromotions.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePromotions.map(promo => (
              <div key={promo.id} className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-gray-800 mb-2">{promo.title}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produto:</span>
                    <span className="font-medium">{promo.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preço:</span>
                    <div className="text-right">
                      <span className="font-bold text-orange-600">{formatPrice(promo.promotional_price)}</span>
                      <span className="text-gray-500 line-through text-xs ml-1">{formatPrice(promo.original_price)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Termina:</span>
                    <span className="font-medium text-red-600">{getTimeRemaining(promo.end_time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promotions List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Todas as Promoções ({promotions.length})
          </h3>
        </div>

        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Zap size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma promoção cadastrada
            </h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira promoção temporária
            </p>
            <button
              onClick={handleCreate}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Criar Primeira Promoção
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Promoção</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Produto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Preços</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Período</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.map((promotion) => {
                  const status = getPromotionStatus(promotion);
                  const isActive = isPromotionActive(promotion);
                  
                  return (
                    <tr key={promotion.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <h4 className="font-medium text-gray-800">{promotion.title}</h4>
                          {promotion.description && (
                            <p className="text-sm text-gray-600">{promotion.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-800">{promotion.product_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-600">{formatPrice(promotion.promotional_price)}</span>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">PROMO</span>
                          </div>
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(promotion.original_price)}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Economia: {formatPrice(promotion.original_price - promotion.promotional_price)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-gray-600">Início:</span>
                          </div>
                          <div className="text-gray-800">{formatDateTime(promotion.start_time)}</div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-gray-600">Fim:</span>
                          </div>
                          <div className="text-gray-800">{formatDateTime(promotion.end_time)}</div>
                          {isActive && (
                            <div className="text-red-600 font-medium text-xs">
                              {getTimeRemaining(promotion.end_time)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label === 'Ativa' && <CheckCircle size={12} />}
                            {status.label === 'Expirada' && <AlertCircle size={12} />}
                            {status.label === 'Agendada' && <Clock size={12} />}
                            {status.label === 'Inativa' && <EyeOff size={12} />}
                            {status.label}
                          </span>
                          <button
                            onClick={() => handleToggleActive(promotion)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              promotion.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {promotion.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                            {promotion.is_active ? 'Ativa' : 'Inativa'}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(promotion)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Editar promoção"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(promotion)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Excluir promoção"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Promoção *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Promoção Especial - Açaí 500g"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                    placeholder="Ex: Até 22h de hoje, Copo 500ml por R$15,99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => {
                      const selectedProduct = products.find(p => p.id === e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        product_id: e.target.value,
                        promotional_price: selectedProduct ? selectedProduct.price * 0.8 : 0 // 20% discount as default
                      }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.filter(p => p.is_active).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Promocional (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.promotional_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, promotional_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="15.99"
                      required
                    />
                  </div>
                  {formData.product_id && formData.promotional_price > 0 && (
                    <div className="mt-1 text-xs">
                      {(() => {
                        const selectedProduct = products.find(p => p.id === formData.product_id);
                        if (selectedProduct) {
                          const discount = selectedProduct.price - formData.promotional_price;
                          const discountPercent = (discount / selectedProduct.price) * 100;
                          return (
                            <span className="text-green-600 font-medium">
                              Economia: {formatPrice(discount)} ({discountPercent.toFixed(1)}% off)
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início da Promoção *
                  </label>
                  <div className="relative">
                    <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim da Promoção *
                  </label>
                  <div className="relative">
                    <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {formData.product_id && formData.promotional_price > 0 && formData.title && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <Eye size={16} />
                    Prévia da Promoção
                  </h4>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 rounded-full p-2">
                        <Zap size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-orange-800">{formData.title}</h5>
                        {formData.description && (
                          <p className="text-sm text-orange-700">{formData.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-orange-600 text-lg">{formatPrice(formData.promotional_price)}</span>
                          {(() => {
                            const selectedProduct = products.find(p => p.id === formData.product_id);
                            return selectedProduct && (
                              <span className="text-gray-500 line-through">{formatPrice(selectedProduct.price)}</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingPromotion ? 'Salvar Alterações' : 'Criar Promoção'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como funcionam as Promoções</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Contador em tempo real:</strong> Clientes veem o tempo restante da promoção</li>
              <li>• <strong>Aplicação automática:</strong> Preço promocional é aplicado automaticamente no período</li>
              <li>• <strong>Expiração automática:</strong> Ao expirar, volta ao preço original automaticamente</li>
              <li>• <strong>Agendamento:</strong> Promoções podem ser agendadas para começar no futuro</li>
              <li>• <strong>Controle total:</strong> Ative/desative promoções a qualquer momento</li>
              <li>• <strong>Visibilidade:</strong> Promoções ativas aparecem destacadas no delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionsPanel;