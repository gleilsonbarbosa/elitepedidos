import React, { useState, useEffect } from 'react';
import { X, Printer, Settings, TestTube, AlertCircle, CheckCircle, Wifi, WifiOff, Scale } from 'lucide-react';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';
import { useScale } from '../../hooks/useScale';

interface ThermalPrinterSetupProps {
  onClose: () => void;
}

const ThermalPrinterSetup: React.FC<ThermalPrinterSetupProps> = ({ onClose }) => {
  const thermalPrinter = useThermalPrinter();
  const scale = useScale();
  const [activeTab, setActiveTab] = useState<'printer' | 'scale'>('printer');
  const [portInfo, setPortInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Load port information on mount
  useEffect(() => {
    const loadPortInfo = async () => {
      try {
        const info = await scale.getPortInfo();
        setPortInfo(info);
      } catch (error) {
        console.error('Erro ao carregar informações das portas:', error);
      }
    };

    loadPortInfo();
  }, []);

  const handlePrinterTest = async () => {
    setTesting(true);
    try {
      await thermalPrinter.printTest();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Teste de impressão enviado!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro no teste de impressão:', error);
      alert(`Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleScaleTest = async () => {
    setTesting(true);
    try {
      const success = await scale.testConnection();
      
      if (success) {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Teste de conexão da balança bem-sucedido!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert('Teste de conexão falhou. Verifique as configurações.');
      }
    } catch (error) {
      console.error('Erro no teste da balança:', error);
      alert(`Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings size={24} className="text-blue-600" />
              Configuração de Dispositivos
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('printer')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'printer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Printer size={18} />
              Impressora Térmica
            </button>
            <button
              onClick={() => setActiveTab('scale')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'scale'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Scale size={18} />
              Balança
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'printer' ? (
            /* Printer Configuration */
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Status da Conexão</h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    thermalPrinter.connection.isConnected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {thermalPrinter.connection.isConnected ? (
                      <>
                        <CheckCircle size={16} />
                        Conectada
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        Desconectada
                      </>
                    )}
                  </div>
                </div>

                {thermalPrinter.connection.isConnected && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Porta:</strong> {thermalPrinter.connection.port}</p>
                    <p><strong>Modelo:</strong> {thermalPrinter.connection.model}</p>
                  </div>
                )}

                {thermalPrinter.lastError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-600 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">Erro de Conexão</p>
                        <p className="text-red-700 text-sm whitespace-pre-line">{thermalPrinter.lastError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Configuration */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Baud Rate
                    </label>
                    <select
                      value={thermalPrinter.config.baudRate}
                      onChange={(e) => thermalPrinter.updateConfig({ baudRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={9600}>9600</option>
                      <option value={19200}>19200</option>
                      <option value={38400}>38400</option>
                      <option value={115200}>115200</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largura do Papel (mm)
                    </label>
                    <select
                      value={thermalPrinter.config.paperWidth}
                      onChange={(e) => thermalPrinter.updateConfig({ 
                        paperWidth: parseInt(e.target.value),
                        characterWidth: parseInt(e.target.value) === 80 ? 48 : 32
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={58}>58mm (32 caracteres)</option>
                      <option value={80}>80mm (48 caracteres)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={thermalPrinter.connect}
                  disabled={thermalPrinter.connection.isConnected}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  {thermalPrinter.connection.isConnected ? 'Conectada' : 'Conectar Impressora'}
                </button>

                <button
                  onClick={handlePrinterTest}
                  disabled={!thermalPrinter.connection.isConnected || testing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube size={18} />
                      Teste de Impressão
                    </>
                  )}
                </button>

                {thermalPrinter.connection.isConnected && (
                  <button
                    onClick={thermalPrinter.disconnect}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Scale Configuration */
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Status da Balança</h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    scale.connection.isConnected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {scale.connection.isConnected ? (
                      <>
                        <Wifi size={16} />
                        Conectada
                      </>
                    ) : (
                      <>
                        <WifiOff size={16} />
                        Desconectada
                      </>
                    )}
                  </div>
                </div>

                {scale.connection.isConnected && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Porta:</strong> {scale.connection.port}</p>
                    <p><strong>Modelo:</strong> {scale.connection.model}</p>
                    <p><strong>Lendo dados:</strong> {scale.isReading ? 'Sim' : 'Não'}</p>
                    {scale.currentWeight && (
                      <p><strong>Último peso:</strong> {scale.currentWeight.value} {scale.currentWeight.unit}</p>
                    )}
                  </div>
                )}

                {scale.lastError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-600 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">Erro de Conexão da Balança</p>
                        <p className="text-red-700 text-sm whitespace-pre-line">{scale.lastError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Port Information */}
              {portInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 mb-3">Informações das Portas Seriais</h4>
                  
                  {!portInfo.supported ? (
                    <p className="text-blue-700 text-sm">Web Serial API não suportado neste navegador.</p>
                  ) : portInfo.ports.length === 0 ? (
                    <p className="text-blue-700 text-sm">Nenhuma porta serial detectada. Conecte a balança via USB.</p>
                  ) : (
                    <div className="space-y-2">
                      {portInfo.ports.map((port: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-blue-800">Porta {index + 1}</p>
                              {port.vendorId && (
                                <p className="text-sm text-blue-600">
                                  Vendor ID: {port.vendorId} | Product ID: {port.productId}
                                </p>
                              )}
                              {port.error && (
                                <p className="text-sm text-red-600">Erro: {port.error}</p>
                              )}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              port.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {port.connected ? 'Conectada' : 'Disponível'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scale Configuration */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações da Balança</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Baud Rate
                    </label>
                    <select
                      value={scale.scaleConfig.baudRate}
                      onChange={(e) => scale.updateConfig({ baudRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value={4800}>4800 (Toledo padrão)</option>
                      <option value={9600}>9600</option>
                      <option value={19200}>19200</option>
                      <option value={38400}>38400</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Bits
                    </label>
                    <select
                      value={scale.scaleConfig.dataBits}
                      onChange={(e) => scale.updateConfig({ dataBits: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      value={scale.scaleConfig.stopBits}
                      onChange={(e) => scale.updateConfig({ stopBits: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      value={scale.scaleConfig.parity}
                      onChange={(e) => scale.updateConfig({ parity: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="none">Nenhuma</option>
                      <option value="even">Par</option>
                      <option value="odd">Ímpar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scale Actions */}
              <div className="flex gap-3">
                <button
                  onClick={scale.connect}
                  disabled={scale.connection.isConnected}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Scale size={18} />
                  {scale.connection.isConnected ? 'Balança Conectada' : 'Conectar Balança'}
                </button>

                <button
                  onClick={handleScaleTest}
                  disabled={testing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube size={18} />
                      Teste de Conexão
                    </>
                  )}
                </button>

                {scale.connection.isConnected && (
                  <button
                    onClick={scale.disconnect}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              {/* Weight Display */}
              {scale.connection.isConnected && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-medium text-green-800 mb-3">Leitura Atual da Balança</h4>
                  
                  {scale.currentWeight ? (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {scale.currentWeight.value.toFixed(3)} {scale.currentWeight.unit}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {scale.currentWeight.stable ? '✅ Peso estável' : '⏳ Estabilizando...'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Última leitura: {scale.currentWeight.timestamp.toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Aguardando leitura da balança...</p>
                      <p className="text-sm mt-1">Coloque um item na balança para testar</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="p-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">ℹ️ Informações Importantes</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Navegadores suportados:</strong> Chrome, Edge, Opera (Web Serial API)</li>
                  <li>• <strong>Impressora:</strong> Compatível com impressoras ESC/POS</li>
                  <li>• <strong>Balança:</strong> Testado com balanças Toledo (protocolo PRT2)</li>
                  <li>• <strong>Conexão:</strong> Dispositivos devem estar conectados via USB</li>
                  <li>• <strong>Permissões:</strong> Permita acesso às portas seriais quando solicitado</li>
                  <li>• <strong>Drivers:</strong> Instale os drivers dos dispositivos antes de conectar</li>
                  <li>• <strong>Conflitos:</strong> Feche outros programas que usem os dispositivos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrinterSetup;