import React, { useState, useEffect } from 'react';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';
import { 
  Printer, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  Zap, 
  RefreshCw,
  Play,
  Bug,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

interface ThermalPrinterDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThermalPrinterDiagnostics: React.FC<ThermalPrinterDiagnosticsProps> = ({
  isOpen,
  onClose
}) => {
  const thermalPrinter = useThermalPrinter();
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🔍 [THERMAL-DIAG] ${message}`);
  };

  const runFullDiagnostic = async () => {
    setTesting(true);
    setLogs([]);
    setDiagnosticResults({});

    try {
      addLog('🚀 Iniciando diagnóstico completo da impressora térmica...');

      // 1. Verificar suporte do navegador
      addLog('1️⃣ Verificando suporte do navegador...');
      const webSerialSupported = !!navigator.serial;
      addLog(`Web Serial API: ${webSerialSupported ? '✅ Suportado' : '❌ Não suportado'}`);

      if (!webSerialSupported) {
        addLog('❌ ERRO: Navegador não suporta Web Serial API');
        addLog('💡 SOLUÇÃO: Use Chrome, Edge ou Opera');
        setDiagnosticResults(prev => ({ ...prev, webSerial: false }));
        return;
      }

      setDiagnosticResults(prev => ({ ...prev, webSerial: true }));

      // 2. Verificar conexão atual
      addLog('2️⃣ Verificando conexão atual...');
      addLog(`Status da conexão: ${thermalPrinter.connection.isConnected ? '✅ Conectada' : '❌ Desconectada'}`);
      
      if (thermalPrinter.connection.isConnected) {
        addLog(`Porta: ${thermalPrinter.connection.port}`);
        addLog(`Modelo: ${thermalPrinter.connection.model}`);
      }

      setDiagnosticResults(prev => ({ 
        ...prev, 
        connected: thermalPrinter.connection.isConnected 
      }));

      // 3. Verificar configurações
      addLog('3️⃣ Verificando configurações...');
      addLog(`Baud Rate: ${thermalPrinter.config.baudRate}`);
      addLog(`Data Bits: ${thermalPrinter.config.dataBits}`);
      addLog(`Stop Bits: ${thermalPrinter.config.stopBits}`);
      addLog(`Parity: ${thermalPrinter.config.parity}`);
      addLog(`Largura do papel: ${thermalPrinter.config.paperWidth}mm`);
      addLog(`Caracteres por linha: ${thermalPrinter.config.characterWidth}`);

      // 4. Verificar configurações de impressão automática
      addLog('4️⃣ Verificando configurações de impressão automática...');
      const orderSettings = localStorage.getItem('orderSettings');
      const pdvSettings = localStorage.getItem('pdv_settings');
      
      if (orderSettings) {
        const settings = JSON.parse(orderSettings);
        addLog(`Impressão automática (Order Settings): ${settings.auto_print ? '✅ Ativada' : '❌ Desativada'}`);
        setDiagnosticResults(prev => ({ ...prev, autoPrintOrder: settings.auto_print }));
      }

      if (pdvSettings) {
        const settings = JSON.parse(pdvSettings);
        addLog(`Impressão automática (PDV Settings): ${settings.printer_layout?.auto_print_enabled ? '✅ Ativada' : '❌ Desativada'}`);
        addLog(`Impressão delivery (PDV Settings): ${settings.printer_layout?.auto_print_delivery ? '✅ Ativada' : '❌ Desativada'}`);
        setDiagnosticResults(prev => ({ 
          ...prev, 
          autoPrintPDV: settings.printer_layout?.auto_print_enabled,
          autoPrintDelivery: settings.printer_layout?.auto_print_delivery
        }));
      }

      // 5. Teste de conexão se não estiver conectada
      if (!thermalPrinter.connection.isConnected) {
        addLog('5️⃣ Tentando conectar à impressora...');
        try {
          const connected = await thermalPrinter.connect();
          addLog(`Resultado da conexão: ${connected ? '✅ Sucesso' : '❌ Falhou'}`);
          setDiagnosticResults(prev => ({ ...prev, connectionTest: connected }));
        } catch (connectError) {
          addLog(`❌ Erro na conexão: ${connectError instanceof Error ? connectError.message : 'Erro desconhecido'}`);
          setDiagnosticResults(prev => ({ ...prev, connectionTest: false, connectionError: connectError }));
        }
      }

      // 6. Teste de impressão se conectada
      if (thermalPrinter.connection.isConnected) {
        addLog('6️⃣ Executando teste de impressão...');
        try {
          await thermalPrinter.printTest();
          addLog('✅ Teste de impressão executado com sucesso');
          addLog('📄 Verifique se a página de teste saiu da impressora');
          setDiagnosticResults(prev => ({ ...prev, printTest: true }));
        } catch (printError) {
          addLog(`❌ Erro no teste de impressão: ${printError instanceof Error ? printError.message : 'Erro desconhecido'}`);
          setDiagnosticResults(prev => ({ ...prev, printTest: false, printError }));
        }
      }

      // 7. Verificar portas disponíveis
      addLog('7️⃣ Verificando portas seriais disponíveis...');
      try {
        const ports = await navigator.serial.getPorts();
        addLog(`Portas já autorizadas: ${ports.length}`);
        
        for (let i = 0; i < ports.length; i++) {
          const port = ports[i];
          const info = await port.getInfo();
          addLog(`Porta ${i + 1}: VendorID=${info.usbVendorId}, ProductID=${info.usbProductId}`);
        }
        
        setDiagnosticResults(prev => ({ ...prev, availablePorts: ports.length }));
      } catch (portsError) {
        addLog(`❌ Erro ao listar portas: ${portsError instanceof Error ? portsError.message : 'Erro desconhecido'}`);
      }

      addLog('🏁 Diagnóstico completo finalizado!');

    } catch (error) {
      addLog(`❌ Erro durante diagnóstico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTesting(false);
    }
  };

  const testPrintCommand = async () => {
    if (!thermalPrinter.connection.isConnected) {
      addLog('❌ Impressora não conectada');
      return;
    }

    try {
      addLog('🧪 Testando comando de impressão direto...');
      
      // Teste com comando ESC/POS básico
      const testData = '\x1B@Hello World\x0A\x0A\x0A\x1DV\x42\x00'; // Init + texto + corte
      
      // Usar a função sendData do hook
      await thermalPrinter.sendData(testData);
      addLog('✅ Comando de teste enviado - verifique a impressora');
      
    } catch (error) {
      addLog(`❌ Erro no comando de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const fixCommonIssues = async () => {
    addLog('🔧 Aplicando correções automáticas...');

    try {
      // 1. Ativar impressão automática nas configurações
      const orderSettings = {
        auto_print: true,
        sound_enabled: true,
        popup_enabled: true
      };
      localStorage.setItem('orderSettings', JSON.stringify(orderSettings));
      addLog('✅ Configurações de pedidos atualizadas');

      // 2. Ativar impressão automática no PDV
      const pdvSettings = {
        printer_layout: {
          auto_print_enabled: true,
          auto_print_delivery: true
        }
      };
      localStorage.setItem('pdv_settings', JSON.stringify(pdvSettings));
      addLog('✅ Configurações do PDV atualizadas');

      // 3. Tentar reconectar se não estiver conectada
      if (!thermalPrinter.connection.isConnected) {
        addLog('🔌 Tentando reconectar à impressora...');
        const connected = await thermalPrinter.connect();
        addLog(`Reconexão: ${connected ? '✅ Sucesso' : '❌ Falhou'}`);
      }

      addLog('🎉 Correções aplicadas! Teste com um novo pedido.');

    } catch (error) {
      addLog(`❌ Erro ao aplicar correções: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Bug size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Diagnóstico da Impressora Térmica
                </h2>
                <p className="text-gray-600">
                  Verificação completa e solução de problemas
                </p>
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

        <div className="flex h-[calc(90vh-120px)]">
          {/* Controls Panel */}
          <div className="w-1/3 p-6 border-r border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Controles</h3>
            
            <div className="space-y-4">
              {/* Status Atual */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  {thermalPrinter.connection.isConnected ? (
                    <Wifi size={16} className="text-green-600" />
                  ) : (
                    <WifiOff size={16} className="text-red-600" />
                  )}
                  Status da Impressora
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Conectada:</span>
                    <span className={thermalPrinter.connection.isConnected ? 'text-green-600' : 'text-red-600'}>
                      {thermalPrinter.connection.isConnected ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  {thermalPrinter.connection.isConnected && (
                    <>
                      <div className="flex justify-between">
                        <span>Porta:</span>
                        <span className="text-gray-800">{thermalPrinter.connection.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modelo:</span>
                        <span className="text-gray-800">{thermalPrinter.connection.model}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span>Imprimindo:</span>
                    <span className={thermalPrinter.printing ? 'text-orange-600' : 'text-gray-600'}>
                      {thermalPrinter.printing ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="space-y-2">
                <button
                  onClick={runFullDiagnostic}
                  disabled={testing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Diagnosticando...
                    </>
                  ) : (
                    <>
                      <Bug size={16} />
                      Diagnóstico Completo
                    </>
                  )}
                </button>

                <button
                  onClick={testPrintCommand}
                  disabled={!thermalPrinter.connection.isConnected || thermalPrinter.printing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Teste Direto
                </button>

                <button
                  onClick={fixCommonIssues}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  Corrigir Problemas
                </button>

                <button
                  onClick={clearLogs}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Limpar Logs
                </button>
              </div>

              {/* Configurações Rápidas */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-2">Configurações Rápidas</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Baud Rate</label>
                    <select
                      value={thermalPrinter.config.baudRate}
                      onChange={(e) => thermalPrinter.updateConfig({ baudRate: parseInt(e.target.value) })}
                      className="w-full text-sm px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value={9600}>9600</option>
                      <option value={19200}>19200</option>
                      <option value={38400}>38400</option>
                      <option value={57600}>57600</option>
                      <option value={115200}>115200</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Largura (mm)</label>
                    <select
                      value={thermalPrinter.config.paperWidth}
                      onChange={(e) => {
                        const width = parseInt(e.target.value);
                        const charWidth = width === 58 ? 32 : width === 80 ? 48 : 42;
                        thermalPrinter.updateConfig({ 
                          paperWidth: width,
                          characterWidth: charWidth
                        });
                      }}
                      className="w-full text-sm px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value={58}>58mm (32 chars)</option>
                      <option value={80}>80mm (48 chars)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Logs de Diagnóstico</h3>
              <span className="text-sm text-gray-500">{logs.length} entradas</span>
            </div>

            <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-full overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Bug size={32} className="mx-auto mb-2" />
                  <p>Clique em "Diagnóstico Completo" para começar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="break-words">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {Object.keys(diagnosticResults).length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Diagnóstico</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg border ${
                diagnosticResults.webSerial ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {diagnosticResults.webSerial ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span className="text-sm font-medium">Web Serial</span>
                </div>
                <p className="text-xs text-gray-600">
                  {diagnosticResults.webSerial ? 'Suportado' : 'Não suportado'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                diagnosticResults.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {diagnosticResults.connected ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span className="text-sm font-medium">Conexão</span>
                </div>
                <p className="text-xs text-gray-600">
                  {diagnosticResults.connected ? 'Conectada' : 'Desconectada'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                diagnosticResults.autoPrintOrder || diagnosticResults.autoPrintPDV ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {diagnosticResults.autoPrintOrder || diagnosticResults.autoPrintPDV ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span className="text-sm font-medium">Auto Print</span>
                </div>
                <p className="text-xs text-gray-600">
                  {diagnosticResults.autoPrintOrder || diagnosticResults.autoPrintPDV ? 'Ativada' : 'Desativada'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                diagnosticResults.printTest ? 'bg-green-50 border-green-200' : 
                diagnosticResults.printTest === false ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {diagnosticResults.printTest ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : diagnosticResults.printTest === false ? (
                    <AlertCircle size={16} className="text-red-600" />
                  ) : (
                    <Settings size={16} className="text-gray-600" />
                  )}
                  <span className="text-sm font-medium">Teste Print</span>
                </div>
                <p className="text-xs text-gray-600">
                  {diagnosticResults.printTest ? 'Sucesso' : 
                   diagnosticResults.printTest === false ? 'Falhou' : 'Não testado'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Solutions */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Soluções Rápidas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">1. Problema de Conexão</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Verifique cabo USB</li>
                <li>• Impressora ligada</li>
                <li>• Tente outra porta USB</li>
                <li>• Reinicie a impressora</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">2. Conecta mas não Imprime</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Verifique se há papel</li>
                <li>• Teste Baud Rate diferente</li>
                <li>• Impressora ESC/POS?</li>
                <li>• Drivers instalados?</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">3. Impressão Manual OK</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Ative auto-print</li>
                <li>• Permita pop-ups</li>
                <li>• Recarregue a página</li>
                <li>• Teste com novo pedido</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrinterDiagnostics;