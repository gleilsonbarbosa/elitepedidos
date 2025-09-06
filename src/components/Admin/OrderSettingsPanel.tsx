import React, { useState, useEffect } from 'react';
import { useOrderSettings } from '../../hooks/useOrderSettings';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Settings, 
  Save, 
  RefreshCw,
  Printer,
  Zap,
  Clock,
  Eye,
  AlertCircle,
  Check,
  Play,
  Pause
} from 'lucide-react';

const OrderSettingsPanel: React.FC = () => {
  const { 
    settings, 
    loading: settingsLoading, 
    error: settingsError, 
    saveSettings, 
    updateSetting 
  } = useOrderSettings();
  
  const [testingSound, setTestingSound] = useState(false);

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      
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
    }
  };

  const testSound = async () => {
    setTestingSound(true);
    try {
      const audio = new Audio(settings.channel_sounds.delivery);
      audio.volume = settings.sound_volume / 100;
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
          {settings && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Check size={14} className="text-green-500" />
              Configurações carregadas do banco de dados
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={settingsLoading}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {settingsLoading ? (
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
              onClick={() => updateSetting('sound_enabled', !settings.sound_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.sound_enabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.sound_enabled && (
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
                        settings.badge_animation === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="soundType"
                        value={type.value}
                        checked={settings.badge_animation === type.value}
                        onChange={(e) => {
                          updateSetting('sound_type', e.target.value);
                          updateSetting('channel_sounds', {
                            delivery: type.url,
                            attendance: type.url,
                            pdv: type.url
                          });
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
                  Volume do som ({settings.sound_volume}%)
                </label>
                <div className="flex items-center gap-4">
                  <VolumeX size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sound_volume}
                    onChange={(e) => updateSetting('sound_volume', parseInt(e.target.value))}
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
                    Repetir som a cada {settings.repeat_interval}s para pedidos pendentes
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('auto_repeat', !settings.auto_repeat)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.auto_repeat ? 'bg-orange-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.auto_repeat ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Repeat Interval */}
              {settings.auto_repeat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo de repetição ({settings.repeat_interval} segundos)
                  </label>
                  <div className="flex items-center gap-4">
                    <Clock size={16} className="text-gray-400" />
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="5"
                      value={settings.repeat_interval}
                      onChange={(e) => updateSetting('repeat_interval', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 w-16 text-center">
                      {settings.repeat_interval}s
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10s (Muito rápido)</span>
                    <span>60s (Padrão)</span>
                    <span>120s (Mais lento)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Som será repetido a cada {settings.repeat_interval} segundos enquanto houver pedidos pendentes
                  </p>
                </div>
              )}
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
              onClick={() => updateSetting('popup_enabled', !settings.popup_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.popup_enabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.popup_enabled ? 'translate-x-6' : 'translate-x-1'
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
                    onChange={(e) => updateSetting('badge_animation', e.target.value)}
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
              {settings.status_colors && Object.entries(settings.status_colors).map(([status, color]) => (
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
                      onChange={(e) => updateSetting('status_colors', { 
                        ...settings.status_colors, 
                        [status]: e.target.value 
                      })}
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
              onClick={() => updateSetting('auto_accept', !settings.auto_accept)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.auto_accept ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.auto_accept ? 'translate-x-6' : 'translate-x-1'
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
                value={settings.default_prep_time}
                onChange={(e) => updateSetting('default_prep_time', parseInt(e.target.value) || 30)}
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
              onClick={() => updateSetting('auto_print', !settings.auto_print)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.auto_print ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.auto_print ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.auto_print && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impressora selecionada
              </label>
              <select
                value={settings.selected_printer}
                onChange={(e) => updateSetting('selected_printer', e.target.value)}
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

      {/* Thermal Printer Integration */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Printer size={20} className="text-green-600" />
          🖨️ Impressão Térmica Automática
        </h3>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap size={20} className="text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-2">Nova Funcionalidade: Impressão Direta</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>Impressão 100% automática</strong> via Web Serial API</li>
                  <li>• <strong>Sem cliques manuais</strong> - vai direto para a impressora</li>
                  <li>• <strong>Suporte a impressoras ESC/POS</strong> (térmicas)</li>
                  <li>• <strong>Configuração uma vez só</strong> - funciona para todos os pedidos</li>
                  <li>• <strong>Fallback inteligente</strong> - se falhar, usa método tradicional</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Printer size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Como Configurar</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li><strong>1.</strong> Conecte sua impressora térmica via USB</li>
                  <li><strong>2.</strong> Clique no ícone da impressora no cabeçalho</li>
                  <li><strong>3.</strong> Selecione a porta da impressora</li>
                  <li><strong>4.</strong> Faça um teste de impressão</li>
                  <li><strong>5.</strong> Ative a impressão automática acima</li>
                </ol>
              </div>
            </div>
          </div>
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
                    <span className="text-gray-800">{soundTypes.find(t => t.value === settings.sound_type)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="text-gray-800">{settings.sound_volume}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repetição:</span>
                    <span className={settings.auto_repeat ? 'text-orange-600' : 'text-gray-600'}>
                      {settings.auto_repeat ? 'Ativada' : 'Desativada'}
                    </span>
                  </div>
                  {settings.auto_repeat && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Intervalo:</span>
                      <span className="text-orange-600">{settings.repeat_interval}s</span>
                    </div>
                  )}
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
                  {animationTypes.find(t => t.value === settings.badge_animation)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impressão:</span>
                <span className={settings.auto_print ? 'text-blue-600' : 'text-gray-600'}>
                  {settings.auto_print ? 'Automática' : 'Manual'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Colors Preview */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Cores por Status</h4>
          <div className="flex flex-wrap gap-3">
            {settings.status_colors && Object.entries(settings.status_colors).map(([status, color]) => (
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