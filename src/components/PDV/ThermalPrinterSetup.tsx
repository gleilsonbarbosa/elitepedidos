import React, { useState } from 'react';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';
import { 
  Printer, 
  Settings, 
  Wifi, 
  WifiOff, 
  TestTube, 
  Save,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface ThermalPrinterSetupProps {
  onClose?: () => void;
  className?: string;
}

const ThermalPrinterSetup: React.FC<ThermalPrinterSetupProps> = ({ onClose, className = '' }) => {
  const {
    connection,
    config,
    lastError,
    printing,
    isWebSerialSupported,
    connect,
    disconnect,
    printTest,
    updateConfig
  } = useThermalPrinter();

  const [connecting, setConnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const success = await connect();
      if (success) {
        // Save connection status
        localStorage.setItem('thermal_printer_connected', 'true');
        localStorage.setItem('thermal_printer_config', JSON.stringify(config));
      }
    } catch (error) {
      console.error('Erro ao conectar impressora:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem('thermal_printer_connected');
    } catch (error) {
      console.error('Erro ao desconectar impressora:', error);
    }
  };

  const handleTest = async () => {
    try {
      await printTest();
    } catch (error) {
      console.error('Erro no teste de impressão:', error);
      alert('Erro no teste de impressão. Verifique a conexão.');
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('thermal_printer_config', JSON.stringify(config));
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successMessage.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Configurações salvas!
    `;
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage);
      }
    }, 3000);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <Printer size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Impressora Térmica</h2>
            <p className="text-gray-600">Configure impressão automática de pedidos</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            ×
          </button>
        )}
      </div>

      {/* Web Serial Support Check */}
      {!isWebSerialSupported && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Navegador não suportado</h3>
              <p className="text-red-700 text-sm">
                Web Serial API não é suportado. Use Chrome, Edge ou Opera para impressão automática.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connection.isConnected ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <WifiOff size={20} className="text-red-600" />
            )}
            <div>
              <p className="font-medium text-gray-800">
                Status: {connection.isConnected ? 'Conectada' : 'Desconectada'}
              </p>
              {connection.isConnected && connection.model && (
                <p className="text-sm text-gray-600">{connection.model}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {connection.isConnected ? (
              <>
                <button
                  onClick={handleTest}
                  disabled={printing}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {printing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <TestTube size={16} />
                      Teste
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting || !isWebSerialSupported}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wifi size={16} />
                    Conectar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <p className="text-red-600 text-sm">{lastError}</p>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800">Configurações</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Settings size={14} />
            {showAdvanced ? 'Ocultar' : 'Avançado'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Largura do Papel (mm)
            </label>
            <select
              value={config.paperWidth}
              onChange={(e) => {
                const width = parseInt(e.target.value);
                updateConfig({ 
                  paperWidth: width,
                  characterWidth: width === 80 ? 48 : width === 58 ? 32 : 24
                });
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={80}>80mm (48 caracteres)</option>
              <option value={58}>58mm (32 caracteres)</option>
              <option value={40}>40mm (24 caracteres)</option>
            </select>
          </div>

          {showAdvanced && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Baud Rate
                </label>
                <select
                  value={config.baudRate}
                  onChange={(e) => updateConfig({ baudRate: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Bits
                </label>
                <select
                  value={config.dataBits}
                  onChange={(e) => updateConfig({ dataBits: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stop Bits
                </label>
                <select
                  value={config.stopBits}
                  onChange={(e) => updateConfig({ stopBits: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paridade
                </label>
                <select
                  value={config.parity}
                  onChange={(e) => updateConfig({ parity: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Nenhuma</option>
                  <option value="even">Par</option>
                  <option value="odd">Ímpar</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveConfig}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <Zap size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Como usar a Impressão Automática</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>1.</strong> Conecte sua impressora térmica via USB</li>
              <li>• <strong>2.</strong> Clique em "Conectar" e selecione a porta da impressora</li>
              <li>• <strong>3.</strong> Faça um teste de impressão para verificar</li>
              <li>• <strong>4.</strong> Ative a impressão automática nas configurações de pedidos</li>
              <li>• <strong>5.</strong> Novos pedidos serão impressos automaticamente!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrinterSetup;