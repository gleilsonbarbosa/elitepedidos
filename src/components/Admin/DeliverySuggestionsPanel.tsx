import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Eye, 
  Settings,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Brain,
  Target,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SuggestionSettings {
  enabled: boolean;
  maxSuggestions: number;
  socialProofEnabled: boolean;
  urgencyEnabled: boolean;
  affinityEnabled: boolean;
  valueBasedEnabled: boolean;
  complementSuggestionsEnabled: boolean;
  upsellThreshold: number;
  showInCart: boolean;
  showInCheckout: boolean;
  autoRotateInterval: number;
  confidenceThreshold: number;
}

const DeliverySuggestionsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SuggestionSettings>({
    enabled: true,
    maxSuggestions: 2,
    socialProofEnabled: true,
    urgencyEnabled: true,
    affinityEnabled: true,
    valueBasedEnabled: true,
    complementSuggestionsEnabled: true,
    upsellThreshold: 25.00,
    showInCart: true,
    showInCheckout: true,
    autoRotateInterval: 8,
    confidenceThreshold: 0.6
  });

  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const loadSettings = async () => {
        console.log('🤖 [ADMIN-PANEL] Carregando configurações do banco...');
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl.includes('placeholder') || 
            supabaseKey.includes('placeholder')) {
          console.warn('⚠️ [ADMIN-PANEL] Supabase não configurado - carregando do localStorage');
          loadFromLocalStorage();
          return;
        }

        try {
          const { data, error } = await supabase
            .from('order_settings')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();

          if (error) {
            console.error('❌ [ADMIN-PANEL] Erro ao carregar do banco:', error);
            loadFromLocalStorage();
            return;
          }

          if (data) {
            console.log('✅ [ADMIN-PANEL] Configurações carregadas do banco:', data);
            
            const loadedSettings: SuggestionSettings = {
              enabled: data.ai_suggestions_enabled ?? true,
              maxSuggestions: data.ai_max_suggestions ?? 2,
              socialProofEnabled: data.ai_social_proof_enabled ?? true,
              urgencyEnabled: data.ai_urgency_enabled ?? true,
              affinityEnabled: data.ai_affinity_enabled ?? true,
              valueBasedEnabled: data.ai_value_based_enabled ?? true,
              complementSuggestionsEnabled: data.ai_complement_suggestions_enabled ?? true,
              upsellThreshold: data.ai_upsell_threshold ?? 25.00,
              showInCart: data.ai_show_in_cart ?? true,
              showInCheckout: data.ai_show_in_checkout ?? true,
              autoRotateInterval: data.ai_auto_rotate_interval ?? 8,
              confidenceThreshold: data.ai_confidence_threshold ?? 0.6
            };
            
            setSettings(loadedSettings);
            
            // Backup no localStorage
            localStorage.setItem('delivery_suggestions_settings', JSON.stringify(loadedSettings));
            localStorage.setItem('ai_sales_assistant_enabled', JSON.stringify(loadedSettings.enabled));
            
            console.log('💾 [ADMIN-PANEL] Backup salvo no localStorage');
          } else {
            console.log('ℹ️ [ADMIN-PANEL] Nenhuma configuração encontrada no banco, usando padrões');
            loadFromLocalStorage();
          }
        } catch (dbError) {
          console.error('❌ [ADMIN-PANEL] Erro de conexão com banco:', dbError);
          loadFromLocalStorage();
        }
      };
      
      const loadFromLocalStorage = () => {
        try {
          const savedSettings = localStorage.getItem('delivery_suggestions_settings');
          console.log('🤖 [ADMIN-PANEL] Carregando do localStorage:', savedSettings);
          
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({ ...prev, ...parsed }));
            console.log('✅ [ADMIN-PANEL] Configurações do localStorage aplicadas:', parsed);
          } else {
            console.log('ℹ️ [ADMIN-PANEL] Nenhuma configuração no localStorage, usando padrões');
          }
        } catch (error) {
          console.error('❌ [ADMIN-PANEL] Erro ao carregar do localStorage:', error);
        }
      };
      
      loadSettings();
    } catch (error) {
      console.error('❌ [ADMIN-PANEL] Erro geral ao carregar configurações:', error);
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('💾 [ADMIN] Salvando configurações no banco de dados:', settings);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - salvando apenas no localStorage');
        
        // Fallback para localStorage se Supabase não estiver configurado
        localStorage.setItem('delivery_suggestions_settings', JSON.stringify(settings));
        localStorage.setItem('ai_sales_assistant_enabled', JSON.stringify(settings.enabled));
        
        setLastSaved(new Date());
        
        // Disparar evento para atualizar componentes
        const configEvent = new CustomEvent('aiSuggestionsConfigChanged', {
          detail: { enabled: settings.enabled, settings }
        });
        window.dispatchEvent(configEvent);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Configurações salvas localmente (Supabase não configurado)
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
        
        return;
      }

      // Salvar no banco de dados Supabase
      const { data, error } = await supabase
        .from('order_settings')
        .upsert({
          id: 'default',
          // Configurações de IA
          ai_suggestions_enabled: settings.enabled,
          ai_max_suggestions: settings.maxSuggestions,
          ai_social_proof_enabled: settings.socialProofEnabled,
          ai_urgency_enabled: settings.urgencyEnabled,
          ai_affinity_enabled: settings.affinityEnabled,
          ai_value_based_enabled: settings.valueBasedEnabled,
          ai_complement_suggestions_enabled: settings.complementSuggestionsEnabled,
          ai_upsell_threshold: settings.upsellThreshold,
          ai_show_in_cart: settings.showInCart,
          ai_show_in_checkout: settings.showInCheckout,
          ai_auto_rotate_interval: settings.autoRotateInterval,
          ai_confidence_threshold: settings.confidenceThreshold,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [ADMIN] Erro ao salvar no banco:', error);
        throw error;
      }

      console.log('✅ [ADMIN] Configurações salvas no banco:', data);
      
      // Backup no localStorage para compatibilidade
      localStorage.setItem('delivery_suggestions_settings', JSON.stringify(settings));
      localStorage.setItem('ai_sales_assistant_enabled', JSON.stringify(settings.enabled));
      
      // Disparar evento customizado para notificar outros componentes
      const configEvent = new CustomEvent('aiSuggestionsConfigChanged', {
        detail: { enabled: settings.enabled, settings }
      });
      
      window.dispatchEvent(configEvent);
      
      console.log('📡 [ADMIN] Evento disparado após salvamento no banco:', {
        enabled: settings.enabled,
        eventDetail: { enabled: settings.enabled, settings }
      });
      
      setLastSaved(new Date());
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Configurações salvas no banco de dados!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao salvar configurações:', error);
      
      // Fallback para localStorage se banco falhar
      console.warn('⚠️ [ADMIN] Salvando no localStorage como fallback');
      localStorage.setItem('delivery_suggestions_settings', JSON.stringify(settings));
      localStorage.setItem('ai_sales_assistant_enabled', JSON.stringify(settings.enabled));
      
      // Disparar evento mesmo com fallback
      const configEvent = new CustomEvent('aiSuggestionsConfigChanged', {
        detail: { enabled: settings.enabled, settings }
      });
      window.dispatchEvent(configEvent);
      
      setLastSaved(new Date());
      
      alert('Erro ao salvar no banco. Configurações salvas localmente como backup.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSuggestions = () => {
    // Simular teste das sugestões
    const mockTestResults = {
      cartScenario: 'Açaí 300g no carrinho',
      suggestions: [
        {
          type: 'social_proof',
          product: 'Açaí 500g',
          message: '87% dos clientes preferem o tamanho 500g!',
          confidence: 0.9
        },
        {
          type: 'affinity',
          product: 'Granola',
          message: 'Complete com granola crocante por apenas +R$2,00',
          confidence: 0.8
        }
      ],
      performance: {
        generationTime: '45ms',
        relevanceScore: 0.85
      }
    };

    setTestResults(mockTestResults);
    
    setTimeout(() => {
      setTestResults(null);
    }, 10000);
  };

  const updateSetting = <K extends keyof SuggestionSettings>(
    key: K, 
    value: SuggestionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={24} className="text-pink-600" />
            Configurações de Sugestões IA
          </h2>
          <p className="text-gray-600">Configure o assistente de vendas inteligente do delivery</p>
          {lastSaved && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Check size={14} className="text-green-500" />
              Última atualização: {lastSaved.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTestSuggestions}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Eye size={16} />
            Testar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <Brain size={18} />
            Resultado do Teste de Sugestões
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Cenário:</strong> {testResults.cartScenario}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Tempo de geração:</strong> {testResults.performance.generationTime}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Score de relevância:</strong> {(testResults.performance.relevanceScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-800">Sugestões geradas:</p>
              {testResults.suggestions.map((suggestion: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      suggestion.type === 'social_proof' ? 'bg-blue-100 text-blue-800' :
                      suggestion.type === 'urgency' ? 'bg-orange-100 text-orange-800' :
                      suggestion.type === 'affinity' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {suggestion.type}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{suggestion.product}</span>
                    <span className="text-xs text-gray-500">({(suggestion.confidence * 100).toFixed(0)}%)</span>
                  </div>
                  <p className="text-sm text-gray-700">{suggestion.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-pink-600" />
          🤖 Configurações Gerais da IA
        </h3>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Ativar sugestões inteligentes
              </label>
              <p className="text-xs text-gray-500">
                Mostrar sugestões personalizadas baseadas no carrinho do cliente
              </p>
            </div>
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Max Suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número máximo de sugestões ({settings.maxSuggestions})
                </label>
                <div className="flex items-center gap-4">
                  <Target size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={settings.maxSuggestions}
                    onChange={(e) => updateSetting('maxSuggestions', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 w-8 text-center">
                    {settings.maxSuggestions}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (Mínimo)</span>
                  <span>3 (Recomendado)</span>
                  <span>5 (Máximo)</span>
                </div>
              </div>

              {/* Confidence Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de confiança ({(settings.confidenceThreshold * 100).toFixed(0)}%)
                </label>
                <div className="flex items-center gap-4">
                  <BarChart3 size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.1"
                    value={settings.confidenceThreshold}
                    onChange={(e) => updateSetting('confidenceThreshold', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 w-12 text-center">
                    {(settings.confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Apenas sugestões com confiança acima deste valor serão exibidas
                </p>
              </div>

              {/* Upsell Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor mínimo para upsell (R$ {settings.upsellThreshold.toFixed(2)})
                </label>
                <div className="flex items-center gap-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={settings.upsellThreshold}
                    onChange={(e) => updateSetting('upsellThreshold', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 w-16 text-center">
                    R$ {settings.upsellThreshold.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Carrinhos abaixo deste valor recebem sugestões de upgrade
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trigger Types */}
      {settings.enabled && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Brain size={20} className="text-blue-600" />
            🧠 Tipos de Gatilhos de Sugestão
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Social Proof */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  <h4 className="font-medium text-gray-800">Prova Social</h4>
                </div>
                <button
                  onClick={() => updateSetting('socialProofEnabled', !settings.socialProofEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.socialProofEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.socialProofEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                "87% dos clientes preferem o tamanho 500g"
              </p>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-blue-700">
                  <strong>Quando usar:</strong> Produtos populares, upgrades de tamanho, complementos favoritos
                </p>
              </div>
            </div>

            {/* Urgency */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-orange-600" />
                  <h4 className="font-medium text-gray-800">Urgência</h4>
                </div>
                <button
                  onClick={() => updateSetting('urgencyEnabled', !settings.urgencyEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.urgencyEnabled ? 'bg-orange-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.urgencyEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                "Últimas unidades - aproveite agora!"
              </p>
              <div className="bg-orange-50 rounded p-2">
                <p className="text-xs text-orange-700">
                  <strong>Quando usar:</strong> Promoções limitadas, produtos em baixo estoque, ofertas especiais
                </p>
              </div>
            </div>

            {/* Affinity */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-600" />
                  <h4 className="font-medium text-gray-800">Afinidade</h4>
                </div>
                <button
                  onClick={() => updateSetting('affinityEnabled', !settings.affinityEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.affinityEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.affinityEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                "Combina perfeitamente com açaí"
              </p>
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs text-green-700">
                  <strong>Quando usar:</strong> Complementos que combinam, bebidas para acompanhar, produtos relacionados
                </p>
              </div>
            </div>

            {/* Value Based */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-purple-600" />
                  <h4 className="font-medium text-gray-800">Valor</h4>
                </div>
                <button
                  onClick={() => updateSetting('valueBasedEnabled', !settings.valueBasedEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.valueBasedEnabled ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.valueBasedEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                "Combo Casal - melhor custo-benefício!"
              </p>
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-purple-700">
                  <strong>Quando usar:</strong> Combos econômicos, ofertas especiais, produtos premium
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Settings */}
      {settings.enabled && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Eye size={20} className="text-indigo-600" />
            👁️ Configurações de Exibição
          </h3>

          <div className="space-y-6">
            {/* Show in Cart */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mostrar sugestões no carrinho
                </label>
                <p className="text-xs text-gray-500">
                  Exibir assistente IA quando o cliente abrir o carrinho
                </p>
              </div>
              <button
                onClick={() => updateSetting('showInCart', !settings.showInCart)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showInCart ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showInCart ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Show in Checkout */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mostrar sugestões no checkout
                </label>
                <p className="text-xs text-gray-500">
                  Exibir sugestões finais antes do pagamento
                </p>
              </div>
              <button
                onClick={() => updateSetting('showInCheckout', !settings.showInCheckout)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showInCheckout ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showInCheckout ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Rotate Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalo de rotação ({settings.autoRotateInterval}s)
              </label>
              <div className="flex items-center gap-4">
                <RefreshCw size={16} className="text-gray-400" />
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={settings.autoRotateInterval}
                  onChange={(e) => updateSetting('autoRotateInterval', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-600 w-8 text-center">
                  {settings.autoRotateInterval}s
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tempo para alternar entre diferentes sugestões automaticamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {settings.enabled && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            ⚙️ Configurações Avançadas
          </h3>

          <div className="space-y-4">
            {/* Complement Suggestions */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sugestões de complementos
                </label>
                <p className="text-xs text-gray-500">
                  Sugerir produtos que complementam o carrinho atual
                </p>
              </div>
              <button
                onClick={() => updateSetting('complementSuggestionsEnabled', !settings.complementSuggestionsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.complementSuggestionsEnabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.complementSuggestionsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Performance Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">📊 Informações de Performance</h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Tempo médio de resposta:</span>
                  <br />~50ms
                </div>
                <div>
                  <span className="font-medium">Taxa de conversão:</span>
                  <br />+23% com IA ativa
                </div>
                <div>
                  <span className="font-medium">Ticket médio:</span>
                  <br />+R$8,50 por pedido
                </div>
                <div>
                  <span className="font-medium">Satisfação:</span>
                  <br />4.8/5 estrelas
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverySuggestionsPanel;