import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Edit3, 
  Plus, 
  Trash2, 
  X,
  AlertCircle,
  Check,
  Settings,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Search,
  Filter,
  DollarSign,
  Package,
  Target
} from 'lucide-react';

interface DeliverySuggestionConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'nuts' | 'fruits' | 'chocolate' | 'cream' | 'topping' | 'cereal' | 'candy';
  is_active: boolean;
  trigger_type: 'social_proof' | 'urgency' | 'affinity' | 'value';
  message_template: string;
  priority: number;
  min_cart_value?: number;
  max_cart_value?: number;
  compatible_categories: string[];
}

interface SuggestionSettings {
  ai_suggestions_enabled: boolean;
  smart_upsell_enabled: boolean;
  checkout_suggestions_enabled: boolean;
  cart_suggestions_enabled: boolean;
  max_suggestions_per_view: number;
  suggestion_rotation_interval: number;
  show_confidence_score: boolean;
  auto_hide_after_add: boolean;
}

const DeliverySuggestionsPanel: React.FC = () => {
  const [suggestions, setSuggestions] = useState<DeliverySuggestionConfig[]>([]);
  const [settings, setSettings] = useState<SuggestionSettings>({
    ai_suggestions_enabled: true,
    smart_upsell_enabled: true,
    checkout_suggestions_enabled: true,
    cart_suggestions_enabled: true,
    max_suggestions_per_view: 2,
    suggestion_rotation_interval: 8,
    show_confidence_score: true,
    auto_hide_after_add: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<DeliverySuggestionConfig | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');

  const categories = [
    { id: 'nuts', label: 'Castanhas/Amendoim', icon: '🥜' },
    { id: 'fruits', label: 'Frutas', icon: '🍓' },
    { id: 'chocolate', label: 'Chocolates', icon: '🍫' },
    { id: 'cream', label: 'Cremes', icon: '🥛' },
    { id: 'topping', label: 'Coberturas', icon: '🍯' },
    { id: 'cereal', label: 'Cereais', icon: '🌾' },
    { id: 'candy', label: 'Doces', icon: '🍬' }
  ];

  const triggerTypes = [
    { id: 'social_proof', label: 'Prova Social', icon: <Users size={16} />, color: 'text-blue-600' },
    { id: 'urgency', label: 'Urgência', icon: <Clock size={16} />, color: 'text-orange-600' },
    { id: 'affinity', label: 'Afinidade', icon: <TrendingUp size={16} />, color: 'text-green-600' },
    { id: 'value', label: 'Valor', icon: <Zap size={16} />, color: 'text-purple-600' }
  ];

  const defaultSuggestions: Omit<DeliverySuggestionConfig, 'id'>[] = [
    {
      name: 'AMENDOIN',
      price: 2.00,
      description: 'Amendoim torrado crocante',
      category: 'nuts',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🥜 **Amendoim torrado** - crocância que faz a diferença (+{price})!',
      priority: 8,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'CASTANHA EM BANDA',
      price: 3.00,
      description: 'Castanha em fatias',
      category: 'nuts',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🌰 **Castanha em banda** - textura perfeita para açaí (+{price})!',
      priority: 7,
      compatible_categories: ['acai']
    },
    {
      name: 'CEREJA',
      price: 2.00,
      description: 'Cereja doce',
      category: 'fruits',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍒 **Cereja doce** - toque especial no seu açaí (+{price})!',
      priority: 6,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'CHOCOBALL MINE',
      price: 2.00,
      description: 'Chocoball pequeno',
      category: 'chocolate',
      is_active: true,
      trigger_type: 'urgency',
      message_template: '🍫 **Chocoball Mine** - um dos preferidos da galera agora (+{price})!',
      priority: 5,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'CHOCOBALL POWER',
      price: 2.00,
      description: 'Chocoball grande',
      category: 'chocolate',
      is_active: true,
      trigger_type: 'urgency',
      message_template: '⚡ **Chocoball Power** - um dos preferidos da galera agora (+{price})!',
      priority: 4,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'CREME DE COOKIES',
      price: 3.00,
      description: 'Creme de cookies',
      category: 'cream',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍪 **Creme de cookies** - sabor irresistível (+{price})!',
      priority: 6,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'CHOCOLATE COM AVELÃ (NUTELA)',
      price: 3.00,
      description: 'Chocolate com avelã',
      category: 'chocolate',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🍫 **Nutella premium** - o complemento mais pedido (+{price})!',
      priority: 10,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'COBERTURA DE CHOCOLATE',
      price: 2.00,
      description: 'Cobertura de chocolate',
      category: 'topping',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍫 **Cobertura de chocolate** - finalização perfeita (+{price})!',
      priority: 7,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'COBERTURA DE MORANGO',
      price: 2.00,
      description: 'Cobertura de morango',
      category: 'topping',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍓 **Cobertura de morango** - doçura natural (+{price})!',
      priority: 6,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'GANACHE MEIO AMARGO',
      price: 2.00,
      description: 'Ganache meio amargo',
      category: 'chocolate',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍫 **Ganache meio amargo** - sofisticação no seu açaí (+{price})!',
      priority: 5,
      compatible_categories: ['acai']
    },
    {
      name: 'GRANOLA',
      price: 2.00,
      description: 'Granola crocante',
      category: 'cereal',
      is_active: true,
      trigger_type: 'urgency',
      message_template: '🌾 **Granola crocante** - um dos preferidos da galera agora (+{price})!',
      priority: 9,
      compatible_categories: ['acai', 'milkshake', 'vitamina']
    },
    {
      name: 'GOTAS DE CHOCOLATE',
      price: 3.00,
      description: 'Gotas de chocolate',
      category: 'chocolate',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🍫 **Gotas de chocolate** - cada colherada uma surpresa (+{price})!',
      priority: 6,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'GRANULADO DE CHOCOLATE',
      price: 2.00,
      description: 'Granulado de chocolate',
      category: 'topping',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍫 **Granulado de chocolate** - textura crocante (+{price})!',
      priority: 5,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'JUJUBA',
      price: 2.00,
      description: 'Jujuba colorida',
      category: 'candy',
      is_active: true,
      trigger_type: 'urgency',
      message_template: '🍬 **Jujuba colorida** - um dos preferidos da galera agora (+{price})!',
      priority: 4,
      compatible_categories: ['acai']
    },
    {
      name: 'KIWI',
      price: 3.00,
      description: 'Kiwi fatiado fresco',
      category: 'fruits',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🥝 Refresque ainda mais com **kiwi fatiado** (+{price})!',
      priority: 7,
      compatible_categories: ['acai', 'vitamina']
    },
    {
      name: 'LEITE CONDENSADO',
      price: 2.00,
      description: 'Leite condensado',
      category: 'cream',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🥛 **Leite condensado** - cremosidade que 87% dos clientes escolhem (+{price})!',
      priority: 9,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'LEITE EM PÓ',
      price: 3.00,
      description: 'Leite em pó',
      category: 'cream',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🥛 **Leite em pó** - cremosidade extra no seu açaí (+{price})!',
      priority: 5,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'MARSHMALLOWS',
      price: 2.00,
      description: 'Marshmallows macios',
      category: 'candy',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🍭 **Marshmallows** - maciez que derrete na boca (+{price})!',
      priority: 6,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'MMS',
      price: 2.00,
      description: 'Confetes coloridos',
      category: 'candy',
      is_active: true,
      trigger_type: 'urgency',
      message_template: '🌈 **M&Ms** - um dos preferidos da galera agora (+{price})!',
      priority: 5,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'MORANGO',
      price: 3.00,
      description: 'Morango fresco',
      category: 'fruits',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🍓 **Morango fresco** - frescor natural que 92% dos clientes amam (+{price})!',
      priority: 10,
      compatible_categories: ['acai', 'milkshake', 'vitamina']
    },
    {
      name: 'PAÇOCA',
      price: 2.00,
      description: 'Paçoca triturada',
      category: 'nuts',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🥜 **Paçoca crocante** - o complemento mais pedido (+{price})!',
      priority: 10,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'RECHEIO DE NINHO',
      price: 2.00,
      description: 'Recheio de ninho',
      category: 'cream',
      is_active: true,
      trigger_type: 'social_proof',
      message_template: '🥛 **Recheio de ninho** - cremosidade incomparável (+{price})!',
      priority: 8,
      compatible_categories: ['acai', 'milkshake']
    },
    {
      name: 'UVA',
      price: 2.00,
      description: 'Uva fresca',
      category: 'fruits',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍇 **Uva fresca** - frescor natural (+{price})!',
      priority: 5,
      compatible_categories: ['acai', 'vitamina']
    },
    {
      name: 'UVA PASSAS',
      price: 2.00,
      description: 'Uva passas',
      category: 'fruits',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍇 **Uva passas** - doçura concentrada (+{price})!',
      priority: 4,
      compatible_categories: ['acai', 'vitamina']
    },
    {
      name: 'COBERTURA FINE DENTADURA',
      price: 2.00,
      description: 'Cobertura Fine Dentadura',
      category: 'candy',
      is_active: true,
      trigger_type: 'urgency',
      message_template: '🍬 **Cobertura Fine Dentadura** - um dos preferidos da galera agora (+{price})!',
      priority: 4,
      compatible_categories: ['acai']
    },
    {
      name: 'COBERTURA FINE BEIJINHO',
      price: 2.00,
      description: 'Cobertura Fine Beijinho',
      category: 'candy',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '💋 **Cobertura Fine Beijinho** - doçura especial (+{price})!',
      priority: 4,
      compatible_categories: ['acai']
    },
    {
      name: 'COBERTURA FINE BANANINHA',
      price: 2.00,
      description: 'Cobertura Fine Bananinha',
      category: 'candy',
      is_active: true,
      trigger_type: 'affinity',
      message_template: '🍌 **Cobertura Fine Bananinha** - sabor tropical (+{price})!',
      priority: 4,
      compatible_categories: ['acai']
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage (always available)
      loadFromLocalStorage();
      
      console.log('✅ Configurações de sugestões carregadas');
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      // Load suggestions
      const savedSuggestions = localStorage.getItem('delivery_suggestions_config');
      if (savedSuggestions) {
        setSuggestions(JSON.parse(savedSuggestions));
      } else {
        // Create default suggestions
        const suggestionsWithIds = defaultSuggestions.map((suggestion, index) => ({
          ...suggestion,
          id: `suggestion-${index + 1}`
        }));
        setSuggestions(suggestionsWithIds);
        localStorage.setItem('delivery_suggestions_config', JSON.stringify(suggestionsWithIds));
      }

      // Load settings
      const savedSettings = localStorage.getItem('delivery_suggestion_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        localStorage.setItem('delivery_suggestion_settings', JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
    }
  };

  const saveToLocalStorage = (newSuggestions?: DeliverySuggestionConfig[], newSettings?: SuggestionSettings) => {
    try {
      if (newSuggestions) {
        localStorage.setItem('delivery_suggestions_config', JSON.stringify(newSuggestions));
      }
      if (newSettings) {
        localStorage.setItem('delivery_suggestion_settings', JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  const handleSaveSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSuggestion) return;

    try {
      setSaving(true);

      let updatedSuggestions;
      
      if (editingSuggestion.id && suggestions.find(s => s.id === editingSuggestion.id)) {
        // Update existing
        updatedSuggestions = suggestions.map(s => 
          s.id === editingSuggestion.id ? editingSuggestion : s
        );
      } else {
        // Create new
        const newSuggestion = {
          ...editingSuggestion,
          id: `suggestion-${Date.now()}`
        };
        updatedSuggestions = [...suggestions, newSuggestion];
      }

      setSuggestions(updatedSuggestions);
      saveToLocalStorage(updatedSuggestions);
      
      setShowModal(false);
      setEditingSuggestion(null);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Sugestão salva com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('❌ Erro ao salvar sugestão:', err);
      alert('Erro ao salvar sugestão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sugestão?')) {
      return;
    }

    try {
      const updatedSuggestions = suggestions.filter(s => s.id !== id);
      setSuggestions(updatedSuggestions);
      saveToLocalStorage(updatedSuggestions);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Sugestão excluída com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('❌ Erro ao excluir sugestão:', err);
      alert('Erro ao excluir sugestão. Tente novamente.');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const updatedSuggestions = suggestions.map(s => 
        s.id === id ? { ...s, is_active: !s.is_active } : s
      );
      setSuggestions(updatedSuggestions);
      saveToLocalStorage(updatedSuggestions);
    } catch (err) {
      console.error('❌ Erro ao alterar status:', err);
      alert('Erro ao alterar status da sugestão.');
    }
  };

  const handleSaveSettings = async (newSettings: SuggestionSettings) => {
    try {
      setSaving(true);
      setSettings(newSettings);
      saveToLocalStorage(undefined, newSettings);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Configurações salvas com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (err) {
      console.error('❌ Erro ao salvar configurações:', err);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesSearch = !searchTerm || 
      suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || suggestion.category === filterCategory;
    const matchesTrigger = filterTrigger === 'all' || suggestion.trigger_type === filterTrigger;
    
    return matchesSearch && matchesCategory && matchesTrigger;
  });

  const activeSuggestions = suggestions.filter(s => s.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={24} className="text-purple-600" />
            Sugestões do Delivery
          </h2>
          <p className="text-gray-600">Configure sugestões inteligentes de complementos pagos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingSuggestion({
                id: '',
                name: '',
                price: 2.00,
                description: '',
                category: 'chocolate',
                is_active: true,
                trigger_type: 'social_proof',
                message_template: '🍫 **{name}** - um dos preferidos da galera agora (+{price})!',
                priority: 5,
                compatible_categories: ['acai']
              });
              setShowModal(true);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Sugestão
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Sugestões</p>
              <p className="text-2xl font-bold text-gray-800">{suggestions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ativas</p>
              <p className="text-2xl font-bold text-gray-800">{activeSuggestions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Preço Médio</p>
              <p className="text-2xl font-bold text-gray-800">
                {activeSuggestions.length > 0 
                  ? formatPrice(activeSuggestions.reduce((sum, s) => sum + s.price, 0) / activeSuggestions.length)
                  : formatPrice(0)
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Target size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sistema IA</p>
              <p className="text-lg font-bold text-gray-800">
                {settings.ai_suggestions_enabled ? '🟢 Ativo' : '🔴 Inativo'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-blue-600" />
          Configurações do Sistema de Sugestões
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sugestões IA Ativadas
                </label>
                <p className="text-xs text-gray-500">
                  Sistema principal de sugestões
                </p>
              </div>
              <button
                onClick={() => handleSaveSettings({ ...settings, ai_suggestions_enabled: !settings.ai_suggestions_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.ai_suggestions_enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.ai_suggestions_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Banner Inteligente
                </label>
                <p className="text-xs text-gray-500">
                  Banner de upsell no topo
                </p>
              </div>
              <button
                onClick={() => handleSaveSettings({ ...settings, smart_upsell_enabled: !settings.smart_upsell_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.smart_upsell_enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.smart_upsell_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sugestões no Checkout
                </label>
                <p className="text-xs text-gray-500">
                  Mostrar na finalização
                </p>
              </div>
              <button
                onClick={() => handleSaveSettings({ ...settings, checkout_suggestions_enabled: !settings.checkout_suggestions_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.checkout_suggestions_enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.checkout_suggestions_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sugestões no Carrinho
                </label>
                <p className="text-xs text-gray-500">
                  Mostrar dentro do carrinho
                </p>
              </div>
              <button
                onClick={() => handleSaveSettings({ ...settings, cart_suggestions_enabled: !settings.cart_suggestions_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.cart_suggestions_enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.cart_suggestions_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máx. Sugestões por Tela
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={settings.max_suggestions_per_view}
                onChange={(e) => handleSaveSettings({ ...settings, max_suggestions_per_view: parseInt(e.target.value) || 2 })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rotação (segundos)
              </label>
              <input
                type="number"
                min="3"
                max="30"
                value={settings.suggestion_rotation_interval}
                onChange={(e) => handleSaveSettings({ ...settings, suggestion_rotation_interval: parseInt(e.target.value) || 8 })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mostrar Confiança
                </label>
                <p className="text-xs text-gray-500">
                  Exibir % de match
                </p>
              </div>
              <button
                onClick={() => handleSaveSettings({ ...settings, show_confidence_score: !settings.show_confidence_score })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.show_confidence_score ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.show_confidence_score ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-ocultar
                </label>
                <p className="text-xs text-gray-500">
                  Ocultar após adicionar
                </p>
              </div>
              <button
                onClick={() => handleSaveSettings({ ...settings, auto_hide_after_add: !settings.auto_hide_after_add })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.auto_hide_after_add ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.auto_hide_after_add ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar sugestões..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          
          <select
            value={filterTrigger}
            onChange={(e) => setFilterTrigger(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os Gatilhos</option>
            {triggerTypes.map(trigger => (
              <option key={trigger.id} value={trigger.id}>
                {trigger.label}
              </option>
            ))}
          </select>
          
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Filter size={16} />
            <span>{filteredSuggestions.length} de {suggestions.length}</span>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Complementos Configurados ({filteredSuggestions.length})
          </h3>
        </div>

        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'Nenhuma sugestão encontrada' : 'Nenhuma sugestão cadastrada'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Tente buscar por outro termo' : 'Clique em "Nova Sugestão" para começar'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setEditingSuggestion({
                    id: '',
                    name: '',
                    price: 2.00,
                    description: '',
                    category: 'chocolate',
                    is_active: true,
                    trigger_type: 'social_proof',
                    message_template: '🍫 **{name}** - um dos preferidos da galera agora (+{price})!',
                    priority: 5,
                    compatible_categories: ['acai']
                  });
                  setShowModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Criar Primeira Sugestão
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Complemento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Preço</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Gatilho</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prioridade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuggestions
                  .sort((a, b) => b.priority - a.priority)
                  .map((suggestion) => {
                    const category = categories.find(c => c.id === suggestion.category);
                    const trigger = triggerTypes.find(t => t.id === suggestion.trigger_type);
                    
                    return (
                      <tr key={suggestion.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <h4 className="font-medium text-gray-800">{suggestion.name}</h4>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                            <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <strong>Mensagem:</strong> {suggestion.message_template.replace('{name}', suggestion.name).replace('{price}', formatPrice(suggestion.price))}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category?.icon}</span>
                            <span className="text-sm text-gray-700">{category?.label}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-green-600">
                            {formatPrice(suggestion.price)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {trigger?.icon}
                            <span className={`text-sm ${trigger?.color}`}>
                              {trigger?.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              suggestion.priority >= 8 ? 'bg-red-500' :
                              suggestion.priority >= 6 ? 'bg-orange-500' :
                              suggestion.priority >= 4 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            <span className="font-medium">{suggestion.priority}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActive(suggestion.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              suggestion.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {suggestion.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                            {suggestion.is_active ? 'Ativa' : 'Inativa'}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingSuggestion(suggestion);
                                setShowModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar sugestão"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSuggestion(suggestion.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Excluir sugestão"
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

      {/* Edit/Create Modal */}
      {showModal && editingSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingSuggestion.id ? 'Editar Sugestão' : 'Nova Sugestão'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingSuggestion(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSuggestion} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Complemento *
                  </label>
                  <input
                    type="text"
                    value={editingSuggestion.name}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: PAÇOCA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingSuggestion.price}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="2.00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={editingSuggestion.description}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Paçoca triturada crocante"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editingSuggestion.category}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, category: e.target.value as any } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Gatilho *
                  </label>
                  <select
                    value={editingSuggestion.trigger_type}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, trigger_type: e.target.value as any } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    {triggerTypes.map(trigger => (
                      <option key={trigger.id} value={trigger.id}>
                        {trigger.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade (1-10) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingSuggestion.priority}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, priority: parseInt(e.target.value) || 5 } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    10 = Prioridade máxima, 1 = Prioridade mínima
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingSuggestion.is_active}
                      onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Sugestão ativa
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem da Sugestão *
                  </label>
                  <textarea
                    value={editingSuggestion.message_template}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { ...prev, message_template: e.target.value } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    placeholder="Ex: 🥜 **{name}** - um dos preferidos da galera agora (+{price})!"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use <code>{'{name}'}</code> para o nome e <code>{'{price}'}</code> para o preço
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Mín. Carrinho (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingSuggestion.min_cart_value || ''}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { 
                      ...prev, 
                      min_cart_value: e.target.value ? parseFloat(e.target.value) : undefined 
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Máx. Carrinho (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingSuggestion.max_cart_value || ''}
                    onChange={(e) => setEditingSuggestion(prev => prev ? { 
                      ...prev, 
                      max_cart_value: e.target.value ? parseFloat(e.target.value) : undefined 
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorias Compatíveis *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['acai', 'milkshake', 'vitamina', 'combo', 'bebidas', 'sobremesas'].map(cat => (
                      <label key={cat} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingSuggestion.compatible_categories.includes(cat)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...editingSuggestion.compatible_categories, cat]
                              : editingSuggestion.compatible_categories.filter(c => c !== cat);
                            setEditingSuggestion(prev => prev ? { ...prev, compatible_categories: newCategories } : null);
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <Eye size={16} />
                  Prévia da Sugestão
                </h4>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Package size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div 
                        className="text-sm text-gray-700 mb-2"
                        dangerouslySetInnerHTML={{ 
                          __html: editingSuggestion.message_template
                            .replace('{name}', `<strong>${editingSuggestion.name}</strong>`)
                            .replace('{price}', `<strong>${formatPrice(editingSuggestion.price)}</strong>`)
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-700">$1</strong>')
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {categories.find(c => c.id === editingSuggestion.category)?.icon} {editingSuggestion.category}
                        </span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                          Prioridade: {editingSuggestion.priority}
                        </span>
                      </div>
                    </div>
                    <button className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm">
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSuggestion(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingSuggestion.id ? 'Salvar Alterações' : 'Criar Sugestão'}
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
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como funcionam as Sugestões</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Prova Social:</strong> "87% dos clientes escolhem...", "O mais pedido..."</li>
              <li>• <strong>Urgência:</strong> "Um dos preferidos da galera agora", "Oferta especial..."</li>
              <li>• <strong>Afinidade:</strong> "Combina perfeitamente...", "Textura ideal..."</li>
              <li>• <strong>Valor:</strong> "Melhor custo-benefício...", "Economia garantida..."</li>
              <li>• <strong>Prioridade:</strong> Maior número = aparece primeiro nas sugestões</li>
              <li>• <strong>Categorias Compatíveis:</strong> Define com quais produtos a sugestão aparece</li>
              <li>• <strong>Valor do Carrinho:</strong> Filtra sugestões por faixa de preço do carrinho</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySuggestionsPanel;