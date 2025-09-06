import { useState, useEffect, useCallback, useRef } from 'react';
import { WeightReading, ScaleConnection } from '../types/pdv'; 

// Mock available ports for development/testing
const MOCK_AVAILABLE_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', '/dev/ttyUSB0', '/dev/ttyS0', '/dev/ttyACM0'];

export const useScale = () => {
  const [connection, setConnection] = useState<ScaleConnection>({
    isConnected: false
  });
  const [currentWeight, setCurrentWeight] = useState<WeightReading | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null); 
  const reconnectTimerRef = useRef<number | null>(null);
  const stableWeightTimerRef = useRef<number | null>(null);
  const lastWeightRef = useRef<WeightReading | null>(null);
  const selectedPortRef = useRef<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  
  // Create refs to break circular dependency
  const startReadingRef = useRef<(() => Promise<void>) | null>(null);
  const reconnectRef = useRef<(() => Promise<void>) | null>(null);
  
  // Check if Web Serial API is supported
  const isWebSerialSupported = !!navigator.serial;

  const [scaleConfig, setScaleConfig] = useState({
    baudRate: 4800, // Changed from 9600 to 4800
    dataBits: 8,
    protocol: 'PRT2',
    stopBits: 1,
    parity: 'none' as const,
    flowControl: 'none' as const,
    reconnectInterval: 3000, // Intervalo de reconexão em ms
    stableWeightTimeout: 5000, // Timeout para peso estável em ms
    weightPattern: /([ST|US]),([GS|NT]),([+-])(\d+\.?\d*)(kg|g)/i, // Padrão para reconhecer o peso
  });

  // Check if Web Serial API is available
  const listAvailablePorts = useCallback(async (): Promise<string[]> => {
    if (!isWebSerialSupported) {
      console.warn('⚠️ Web Serial API not supported');
      setAvailablePorts(MOCK_AVAILABLE_PORTS);
      return MOCK_AVAILABLE_PORTS;
    }

    try {
      const ports = await navigator.serial.getPorts();
      const portNames = ports.map((_, index) => `Serial Port ${index + 1}`);
      setAvailablePorts(portNames.length > 0 ? portNames : MOCK_AVAILABLE_PORTS);
      return portNames.length > 0 ? portNames : MOCK_AVAILABLE_PORTS;
    } catch (error) {
      console.error('❌ Error listing ports:', error);
      setAvailablePorts(MOCK_AVAILABLE_PORTS);
      return MOCK_AVAILABLE_PORTS;
    }
  }, [isWebSerialSupported]);

  // Connect to scale
  const connect = useCallback(async (portName?: string): Promise<boolean> => {
    if (!isWebSerialSupported) {
      console.log('⚠️ Web Serial API não é suportado neste navegador');
      setLastError('Web Serial API não é suportado neste navegador. Use Chrome, Edge ou Opera.');
      
      // For testing purposes, simulate a successful connection
      setConnection({
        isConnected: true,
        port: portName || 'Simulado',
        model: 'Balança Simulada'
      });
      console.log('✅ Conexão simulada estabelecida para ambiente de teste');
      return true;
    }

    try {
      setLastError(null);
      setReconnecting(false);
      
      console.log('🔌 Iniciando conexão com a balança...');
      
      // Close any existing connection first
      if (portRef.current) {
        try {
          console.log('🔌 Fechando conexão anterior...');
          if (readerRef.current) {
            await readerRef.current.cancel();
            readerRef.current = null;
          }
          await portRef.current.close();
          portRef.current = null;
          console.log('✅ Conexão anterior fechada');
        } catch (closeError) {
          console.warn('⚠️ Erro ao fechar conexão anterior (não crítico):', closeError);
        }
      }
      
      // Always request a new port to ensure user interaction
      try {
        const port = await navigator.serial.requestPort();
        portRef.current = port;
        console.log('✅ Porta serial selecionada pelo usuário');
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === 'NotFoundError') {
          setLastError('Nenhuma porta foi selecionada. Selecione uma porta para conectar à balança.');
        } else {
          setLastError('Erro ao solicitar porta serial. Verifique se o navegador suporta Web Serial API.');
        }
        return false;
      }

      // Try to open the port with improved error handling
      try {
        console.log('🔓 Tentando abrir porta serial com configurações:', {
          baudRate: scaleConfig.baudRate,
          dataBits: scaleConfig.dataBits,
          stopBits: scaleConfig.stopBits,
          parity: scaleConfig.parity,
          flowControl: scaleConfig.flowControl
        });
        
        await portRef.current.open({
          baudRate: scaleConfig.baudRate,
          dataBits: scaleConfig.dataBits,
          stopBits: scaleConfig.stopBits,
          parity: scaleConfig.parity,
          flowControl: scaleConfig.flowControl
        });
        
        console.log('✅ Porta serial aberta com sucesso');
      } catch (openError) {
        console.error('❌ Erro detalhado ao abrir porta:', openError);
        
        if (openError instanceof Error) {
          if (openError.message.includes('already open')) {
            console.log('✅ Porta já estava aberta, continuando...');
          } else if (openError.message.includes('Failed to open')) {
            setLastError(
              'Falha ao abrir a porta serial. Possíveis soluções:\n\n' +
              '1. Verifique se a balança está conectada via USB\n' +
              '2. Feche outros programas que possam estar usando a porta\n' +
              '3. Desconecte e reconecte o cabo USB\n' +
              '4. Verifique se os drivers da balança estão instalados\n' +
              '5. Tente uma porta diferente\n' +
              '6. Reinicie o navegador\n\n' +
              `Erro técnico: ${openError.message}`
            );
            return false;
          } else if (openError.message.includes('Access denied')) {
            setLastError(
              'Acesso negado à porta serial. Soluções:\n\n' +
              '1. Execute o navegador como administrador\n' +
              '2. Verifique as permissões do dispositivo\n' +
              '3. Desconecte outros programas da balança\n' +
              '4. Reinicie o computador\n\n' +
              `Erro técnico: ${openError.message}`
            );
            return false;
          } else if (openError.message.includes('Device not found')) {
            setLastError(
              'Dispositivo não encontrado. Soluções:\n\n' +
              '1. Verifique se a balança está ligada\n' +
              '2. Verifique se o cabo USB está conectado\n' +
              '3. Teste o cabo USB em outra porta\n' +
              '4. Verifique se os drivers estão instalados\n' +
              '5. Tente reiniciar a balança\n\n' +
              `Erro técnico: ${openError.message}`
            );
            return false;
          } else {
            setLastError(
              'Erro desconhecido ao abrir porta serial:\n\n' +
              `${openError.message}\n\n` +
              'Soluções gerais:\n' +
              '1. Reinicie o navegador\n' +
              '2. Desconecte e reconecte a balança\n' +
              '3. Verifique se não há conflitos de software\n' +
              '4. Tente usar uma porta USB diferente'
            );
            return false;
          }
        } else {
          setLastError('Erro desconhecido ao abrir porta serial. Tente novamente.');
          return false;
        }
      }
      
      // Verify the connection is working
      try {
        if (!portRef.current.readable || !portRef.current.writable) {
          throw new Error('Porta aberta mas não está legível/gravável');
        }
        console.log('✅ Porta serial verificada - legível e gravável');
      } catch (verifyError) {
        console.error('❌ Erro na verificação da porta:', verifyError);
        setLastError(
          'Porta aberta mas não funcional. Soluções:\n\n' +
          '1. Desconecte e reconecte a balança\n' +
          '2. Verifique se os drivers estão corretos\n' +
          '3. Tente uma configuração diferente (baud rate)\n' +
          '4. Reinicie a balança\n\n' +
          `Erro técnico: ${verifyError instanceof Error ? verifyError.message : 'Erro desconhecido'}`
        );
        return false;
      }

      setConnection({
        isConnected: true,
        port: portName || 'Selected Port',
        model: 'Balança Serial Conectada'
      });

      selectedPortRef.current = portName || 'Selected Port';
      console.log('✅ Balança conectada com sucesso');
      
      // Start reading automatically after successful connection
      if (startReadingRef.current) {
        setTimeout(() => {
          if (startReadingRef.current) {
            startReadingRef.current();
          }
        }, 1000);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error connecting to scale:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          setLastError(
            'Dispositivo não encontrado. Soluções:\n\n' +
            '1. Verifique se a balança está ligada\n' +
            '2. Verifique se o cabo USB está conectado firmemente\n' +
            '3. Teste o cabo em outra porta USB\n' +
            '4. Verifique se os drivers da balança estão instalados\n' +
            '5. Reinicie a balança e tente novamente'
          );
        } else if (error.name === 'SecurityError') {
          setLastError(
            'Acesso negado à porta serial. Soluções:\n\n' +
            '1. Clique em "Permitir" quando o navegador solicitar acesso\n' +
            '2. Execute o navegador como administrador\n' +
            '3. Verifique as configurações de segurança do navegador\n' +
            '4. Desative temporariamente o antivírus\n' +
            '5. Tente usar outro navegador (Chrome, Edge, Opera)'
          );
        } else if (error.name === 'NetworkError') {
          setLastError(
            'Erro de rede/comunicação. Soluções:\n\n' +
            '1. Verifique se a balança está respondendo\n' +
            '2. Teste com configurações diferentes (baud rate)\n' +
            '3. Verifique se o cabo não está danificado\n' +
            '4. Reinicie a balança\n' +
            '5. Tente uma porta USB diferente'
          );
        } else {
          setLastError(
            `Erro ao conectar à balança:\n\n${error.message}\n\n` +
            'Soluções gerais:\n' +
            '1. Reinicie o navegador\n' +
            '2. Desconecte e reconecte a balança\n' +
            '3. Verifique se não há conflitos de software\n' +
            '4. Tente configurações diferentes\n' +
            '5. Consulte o manual da balança'
          );
        }
      } else {
        setLastError(
          'Erro desconhecido ao conectar à balança.\n\n' +
          'Tente as seguintes soluções:\n' +
          '1. Reinicie o navegador\n' +
          '2. Reinicie a balança\n' +
          '3. Verifique todas as conexões\n' +
          '4. Entre em contato com o suporte técnico'
        );
      }
      return false;
    }
  }, [scaleConfig, isWebSerialSupported]);

  // Disconnect from scale
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      console.log('🔌 Desconectando da balança...');
      setIsReading(false);
      
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (stableWeightTimerRef.current) {
        clearTimeout(stableWeightTimerRef.current);
        stableWeightTimerRef.current = null;
      }

      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (cancelError) {
          console.warn('⚠️ Erro ao cancelar leitor (não crítico):', cancelError);
        }
        readerRef.current = null;
      }

      if (portRef.current) {
        try {
          await portRef.current.close();
        } catch (closeError) {
          console.warn('⚠️ Erro ao fechar porta (não crítico):', closeError);
        }
        portRef.current = null;
      }

      setConnection({ isConnected: false });
      console.log('✅ Balança desconectada com sucesso');
      setCurrentWeight(null);
      setReconnecting(false);
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      // Even if there's an error, reset the connection state
      setConnection({ isConnected: false });
      setCurrentWeight(null);
      setReconnecting(false);
    }
  }, []);

  // Start reading weight data
  const startReading = useCallback(async (): Promise<void> => {
    if (!connection.isConnected || !portRef.current) {
      setLastError('Balança não conectada');
      return;
    }

    try {
      setIsReading(true);
      setLastError(null);
      console.log('📖 Iniciando leitura de dados da balança...');

      const reader = portRef.current.readable?.getReader();
      if (!reader) {
        throw new Error('Não foi possível obter o leitor da porta');
      }

      readerRef.current = reader;
      console.log('✅ Leitor da porta obtido com sucesso');

      while (isReading && connection.isConnected) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            console.log('📖 Leitura finalizada (done=true)');
            break;
          }

          const text = new TextDecoder().decode(value);
          if (text.trim()) {
            console.log('📊 Dados brutos da balança:', text.trim());
          }

          const weightData = parseToledoWeight(text);
          if (weightData) {
            const reading: WeightReading = {
              value: weightData.value,
              unit: weightData.unit,
              stable: weightData.stable,
              timestamp: new Date()
            };

            setCurrentWeight(reading);
            lastWeightRef.current = reading;
            console.log('⚖️ Leitura de peso:', reading);
          }
        } catch (readError) {
          console.error('❌ Error reading from scale:', readError);
          
          // Handle specific read errors
          if (readError instanceof Error) {
            if (readError.message.includes('device lost')) {
              setLastError('Dispositivo desconectado. Reconecte a balança e tente novamente.');
              setConnection({ isConnected: false });
              break;
            } else if (readError.message.includes('network error')) {
              setLastError('Erro de comunicação com a balança. Verifique a conexão.');
              break;
            }
          }
          
          // Try to reconnect if we have the function
          if (reconnectRef.current && connection.isConnected) {
            console.log('🔄 Tentando reconectar após erro de leitura...');
            try {
              await reconnectRef.current();
            } catch (reconnectError) {
              console.error('❌ Erro na reconexão:', reconnectError);
              setConnection({ isConnected: false });
            }
          }
          break;
        }
      }
      
      console.log('📖 Loop de leitura finalizado');
    } catch (error) {
      console.error('❌ Error starting reading:', error);
      
      let errorMessage = 'Erro na leitura da balança';
      if (error instanceof Error) {
        errorMessage = `Erro na leitura: ${error.message}\n\n`;
        
        if (error.message.includes('device not found')) {
          errorMessage += 'A balança foi desconectada. Reconecte e tente novamente.';
        } else if (error.message.includes('permission')) {
          errorMessage += 'Permissão negada. Execute o navegador como administrador.';
        } else {
          errorMessage += 'Verifique a conexão e tente novamente.';
        }
      }
      
      setLastError(errorMessage);
      setIsReading(false);
    }
  }, [connection.isConnected, isReading]);

  // Request stable weight
  const requestStableWeight = useCallback(async (): Promise<WeightReading | null> => {
    return new Promise((resolve) => {
      if (!connection.isConnected) {
        resolve(null);
        return;
      }

      if (stableWeightTimerRef.current) {
        clearTimeout(stableWeightTimerRef.current);
      }

      stableWeightTimerRef.current = window.setTimeout(() => {
        resolve(lastWeightRef.current);
      }, scaleConfig.stableWeightTimeout);
    });
  }, [connection.isConnected, scaleConfig.stableWeightTimeout]);

  // Simulate weight for testing
  const simulateWeight = useCallback((weight: number, unit: string = 'kg'): void => {
    const reading: WeightReading = {
      value: weight,
      unit,
      stable: true,
      timestamp: new Date()
    };
    setCurrentWeight(reading);
    lastWeightRef.current = reading;
  }, []);

  // Update scale configuration
  const updateConfig = useCallback((newConfig: Partial<typeof scaleConfig>): void => {
    setScaleConfig(prev => ({ ...prev, ...newConfig }));
    console.log('⚙️ Configuração da balança atualizada:', newConfig);
  }, []);

  // Test connection without full setup
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isWebSerialSupported) {
      setLastError('Web Serial API não suportado neste navegador');
      return false;
    }

    try {
      console.log('🧪 Testando conexão com a balança...');
      
      // Request port
      const port = await navigator.serial.requestPort();
      
      // Try to open with minimal configuration
      await port.open({
        baudRate: 9600, // Try standard baud rate first
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });
      
      console.log('✅ Teste de conexão bem-sucedido');
      
      // Close the test connection
      await port.close();
      
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão falhou:', error);
      
      if (error instanceof Error) {
        setLastError(`Teste falhou: ${error.message}`);
      }
      
      return false;
    }
  }, [isWebSerialSupported]);

  // Get detailed port information
  const getPortInfo = useCallback(async () => {
    if (!isWebSerialSupported) {
      return { supported: false, ports: [] };
    }

    try {
      const ports = await navigator.serial.getPorts();
      const portInfo = await Promise.all(
        ports.map(async (port, index) => {
          try {
            const info = await port.getInfo();
            return {
              index,
              vendorId: info.usbVendorId,
              productId: info.usbProductId,
              connected: port.readable !== null
            };
          } catch (err) {
            return {
              index,
              error: err instanceof Error ? err.message : 'Erro desconhecido'
            };
          }
        })
      );
      
      return {
        supported: true,
        ports: portInfo,
        totalPorts: ports.length
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações das portas:', error);
      return { supported: true, ports: [], error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }, [isWebSerialSupported]);

  // Set up refs for circular dependency resolution
  startReadingRef.current = startReading;
  reconnectRef.current = connect;
  return {
    connection,
    currentWeight,
    isReading,
    availablePorts,
    lastError,
    reconnecting,
    scaleConfig,
    isWebSerialSupported,
    connect,
    disconnect,
    startReading,
    listAvailablePorts,
    requestStableWeight,
    simulateWeight,
    updateConfig,
    testConnection,
    getPortInfo
  };
};

// Function to parse Toledo scale data
const parseToledoWeight = (data: string): { value: number; stable: boolean; unit: string } | null => {
  try {
    const lines = data.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) continue;
      
      console.log('📊 Analyzing scale line:', trimmed);
      
      let match = trimmed.match(/([ST|US]),([GS|NT]),([+-])(\d+\.?\d*)(kg|g|KG|G)/i) || 
                  trimmed.match(/([ST|US]),([GS|NT]),([+-])(\d+)(kg|g|KG|G)/i) ||
                  trimmed.match(/P,([+-])(\d+\.?\d*)(kg|g|KG|G)/i);
      
      if (!match) {
        match = trimmed.match(/([+-])?(\d+\.?\d*)(kg|g|KG|G)/i) || 
                trimmed.match(/([+-])?(\d+)(kg|g|KG|G)/i);
        if (match) {
          const [_, sign = '+', value, unit] = match;
          return {
            value: parseFloat(value) * (sign === '-' ? -1 : 1),
            stable: true,
            unit: unit.toLowerCase()
          };
        }
      }
      
      if (match) {
        let weight, stable, unit;
        
        if (match[0].startsWith('P,')) {
          const [, sign, value, unitValue] = match;
          weight = parseFloat(value) * (sign === '-' ? -1 : 1);
          stable = true;
          unit = unitValue.toLowerCase();
        } else {
          const [, status, type, sign, value, unitValue] = match;
          weight = parseFloat(value) * (sign === '-' ? -1 : 1);
          stable = status.toUpperCase() === 'ST';
          unit = unitValue.toLowerCase();
        }
        
        return {
          value: weight,
          stable: stable,
          unit: unit
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error parsing scale data:', error);
    return null;
  }
};