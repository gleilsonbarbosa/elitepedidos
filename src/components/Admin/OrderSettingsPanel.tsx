import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Settings, 
  Save, 
  RefreshCw,
  Printer,
  Clock,
  Zap,
  Eye,
  AlertCircle,
  Check,
  Play,
  Pause
} from 'lucide-react';

interface OrderSettings {
  // Sound Notifications
  soundEnabled: boolean;
  soundType: 'classic' | 'bell' | 'chime' | 'alert';
  soundVolume: number;
  autoRepeat: boolean;
  channelSounds: {
    delivery: string;
    attendance: string;
    pdv: string;
  };
  
  // Visual Alerts
  popupEnabled: boolean;
  badgeAnimation: 'blink' | 'vibrate' | 'scale' | 'none';
  statusColors: {
    new: string;
    preparing: string;
    ready: string;
    delivered: string;
  };
  
  // Workflow
  autoAccept: boolean;
  defaultPrepTime: number;
  autoPrint: boolean;
  selectedPrinter: string;
}

const OrderSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<OrderSettings>({
    soundEnabled: true,
    soundType: 'classic',
    soundVolume: 70,
    autoRepeat: false,
    channelSounds: {
      delivery: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      attendance: 'https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3',
      pdv: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    },
    popupEnabled: true,
    badgeAnimation: 'blink',
    statusColors: {
      new: '#ef4444',
      preparing: '#f59e0b',
      ready: '#10b981',
      delivered: '#6b7280'
    },
    autoAccept: false,
    defaultPrepTime: 30,
    autoPrint: false,
    selectedPrinter: 'default'
  });

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [testingSound, setTestingSound] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('orderSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        console.log('✅ Configurações de pedidos carregadas:', parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('orderSettings', JSON.stringify(settings));
      
      // Also save individual settings for compatibility with existing code
      localStorage.setItem('orderSoundSettings', JSON.stringify({
        enabled: settings.soundEnabled,
        volume: settings.soundVolume / 100,
        soundUrl: settings.channelSounds.delivery,
        soundType: settings.soundType,
        autoRepeat: settings.autoRepeat
      }));

      localStorage.setItem('chatSoundSettings', JSON.stringify({
        enabled: settings.soundEnabled,
        volume: settings.soundVolume / 100,
        soundUrl: settings.channelSounds.attendance
      }));

      localStorage.setItem('pdv_settings', JSON.stringify({
        printer_layout: {
          auto_print_enabled: settings.autoPrint,
          auto_print_delivery: settings.autoPrint
        }
      }));

      setLastSaved(new Date());
      
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
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const testSound = async () => {
    setTestingSound(true);
    try {
      const audio = new Audio(settings.channelSounds.delivery);
      audio.volume = settings.soundVolume / 100;
      await audio.play();
    } catch (error) {
      console.error('Erro ao testar som:', error);
      alert('Erro ao reproduzir som de teste');
    } finally {
      setTimeout(() => setTestingSound(false), 1000);
    }
  };

  const soundTypes = [
    { value: 'classic', label: 'Clássico', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
    { value: 'bell', label: 'Campainha', url: 'https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3' },
    { value: 'chime', label: 'Sino', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
    { value: 'alert', label: 'Alerta', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
  ];

  const animationTypes = [
    { value: 'none', label: 'Nenhuma' },
    { value: 'blink', label: 'Piscar' },
    { value: 'vibrate', label: 'Vibrar' },
    { value: 'scale', label: 'Aumentar/Diminuir' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings size={24} className="text-orange-600" />
            Configurações de Pedidos
          </h2>
          <p className="text-gray-600">Configure notificações, alertas e fluxo de atendimento</p>
          {lastSaved && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Check size={14} className="text-green-500" />
              Última atualização: {lastSaved.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} />
              Salvar Configurações
            </>
          )}
        </button>
      </div>

      {/* Sound Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Volume2 size={20} className="text-blue-600" />
          🎵 Notificações de Som
        </h3>

        <div className="space-y-6">
          {/* Enable/Disable Sound */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Ativar som de novos pedidos
              </label>
              <p className="text-xs text-gray-500">
                Reproduzir som quando novos pedidos chegarem
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.soundEnabled && (
            <>
              {/* Sound Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de som
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {soundTypes.map(type => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        settings.soundType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="soundType"
                        value={type.value}
                        checked={settings.soundType === type.value}
                        onChange={(e) => {
                          setSettings(prev => ({ 
                            ...prev, 
                            soundType: e.target.value as any,
                            channelSounds: {
                              ...prev.channelSounds,
                              delivery: type.url,
                              attendance: type.url,
                              pdv: type.url
                            }
                          }));
                        }}
                        className="sr-only"
                      />
                      <span className="font-medium text-gray-800">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume do som ({settings.soundVolume}%)
                </label>
                <div className="flex items-center gap-4">
                  <VolumeX size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: parseInt(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <Volume2 size={16} className="text-gray-400" />
                  <button
                    onClick={testSound}
                    disabled={testingSound}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
                  >
                    {testingSound ? <Pause size={14} /> : <Play size={14} />}
                    Testar
                  </button>
                </div>
              </div>

              {/* Auto Repeat */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Repetição automática
                  </label>
                  <p className="text-xs text-gray-500">
                    Tocar som até alguém confirmar o pedido
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, autoRepeat: !prev.autoRepeat }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoRepeat ? 'bg-orange-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoRepeat ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visual Alerts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell size={20} className="text-purple-600" />
          🔔 Alertas Visuais
        </h3>

        <div className="space-y-6">
          {/* Popup Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Popup na tela para novos pedidos
              </label>
              <p className="text-xs text-gray-500">
                Mostrar janela popup quando chegar pedido novo
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, popupEnabled: !prev.popupEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.popupEnabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.popupEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Badge Animation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animação do badge
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {animationTypes.map(type => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    settings.badgeAnimation === type.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="badgeAnimation"
                    value={type.value}
                    checked={settings.badgeAnimation === type.value}
                    onChange={(e) => setSettings(prev => ({ ...prev, badgeAnimation: e.target.value as any }))}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-800">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cores por status
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(settings.statusColors).map(([status, color]) => (
                <div key={status} className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600 capitalize">
                    {status === 'new' ? 'Novo' : 
                     status === 'preparing' ? 'Em Preparo' :
                     status === 'ready' ? 'Pronto' :
                     status === 'delivered' ? 'Entregue' : status}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        statusColors: { ...prev.statusColors, [status]: e.target.value }
                      }))}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                    <span className="text-xs text-gray-500">{color}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap size={20} className="text-green-600" />
          📲 Fluxo de Atendimento
        </h3>

        <div className="space-y-6">
          {/* Auto Accept */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-aceitar pedidos
              </label>
              <p className="text-xs text-gray-500">
                Confirmar pedidos automaticamente ao receber
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoAccept: !prev.autoAccept }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoAccept ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoAccept ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Default Prep Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo de preparo padrão (minutos)
            </label>
            <div className="flex items-center gap-4">
              <Clock size={16} className="text-gray-400" />
              <input
                type="number"
                min="5"
                max="120"
                value={settings.defaultPrepTime}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultPrepTime: parseInt(e.target.value) || 30 }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">minutos</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tempo estimado para preparo de pedidos (pode variar por categoria)
            </p>
          </div>

          {/* Auto Print */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Impressão automática
              </label>
              <p className="text-xs text-gray-500">
                Imprimir pedidos automaticamente ao receber
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoPrint: !prev.autoPrint }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoPrint ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoPrint ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.autoPrint && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impressora selecionada
              </label>
              <select
                value={settings.selectedPrinter}
                onChange={(e) => setSettings(prev => ({ ...prev, selectedPrinter: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Impressora Padrão</option>
                <option value="thermal">Impressora Térmica</option>
                <option value="laser">Impressora Laser</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Eye size={20} className="text-blue-600" />
          Prévia das Configurações
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sound Preview */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Som de Notificação</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={settings.soundEnabled ? 'text-green-600' : 'text-red-600'}>
                  {settings.soundEnabled ? 'Ativado' : 'Desativado'}
                </span>
              </div>
              {settings.soundEnabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="text-gray-800">{soundTypes.find(t => t.value === settings.soundType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="text-gray-800">{settings.soundVolume}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repetição:</span>
                    <span className={settings.autoRepeat ? 'text-orange-600' : 'text-gray-600'}>
                      {settings.autoRepeat ? 'Ativada' : 'Desativada'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Visual Preview */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Alertas Visuais</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Popup:</span>
                <span className={settings.popupEnabled ? 'text-green-600' : 'text-red-600'}>
                  {settings.popupEnabled ? 'Ativado' : 'Desativado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Animação:</span>
                <span className="text-gray-800">
                  {animationTypes.find(t => t.value === settings.badgeAnimation)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impressão:</span>
                <span className={settings.autoPrint ? 'text-blue-600' : 'text-gray-600'}>
                  {settings.autoPrint ? 'Automática' : 'Manual'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Colors Preview */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Cores por Status</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(settings.statusColors).map(([status, color]) => (
              <div
                key={status}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200"
                style={{ backgroundColor: color + '20', borderColor: color + '40' }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm font-medium" style={{ color: color }}>
                  {status === 'new' ? 'Novo' : 
                   status === 'preparing' ? 'Em Preparo' :
                   status === 'ready' ? 'Pronto' :
                   status === 'delivered' ? 'Entregue' : status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Informações Importantes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• As configurações são aplicadas em tempo real</li>
              <li>• Sons funcionam apenas se o navegador permitir reprodução automática</li>
              <li>• Configurações são salvas localmente no navegador</li>
              <li>• Impressão automática requer impressora configurada</li>
              <li>• Alertas visuais aparecem em todas as abas do sistema</li>
              <li>• Use o botão "Testar" para verificar o volume do som</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSettingsPanel;