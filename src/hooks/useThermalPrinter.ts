import { useState, useCallback, useRef } from 'react';

export interface ThermalPrinterConfig {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd';
  flowControl: 'none' | 'hardware';
  paperWidth: number; // mm
  characterWidth: number; // characters per line
  lineHeight: number; // dots
}

export interface PrinterConnection {
  isConnected: boolean;
  port?: string;
  model?: string;
}

export const useThermalPrinter = () => {
  const [connection, setConnection] = useState<PrinterConnection>({
    isConnected: false
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const portRef = useRef<SerialPort | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);

  const [config, setConfig] = useState<ThermalPrinterConfig>({
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    paperWidth: 80, // 80mm
    characterWidth: 48, // characters per line for 80mm
    lineHeight: 24 // dots per line
  });

  // Check if Web Serial API is supported
  const isWebSerialSupported = !!navigator.serial;

  // Connect to thermal printer
  const connect = useCallback(async (): Promise<boolean> => {
    if (!isWebSerialSupported) {
      setLastError('Web Serial API não é suportado neste navegador. Use Chrome, Edge ou Opera.');
      return false;
    }

    try {
      setLastError(null);
      console.log('🖨️ Conectando à impressora térmica...');

      // Request port from user
      const port = await navigator.serial.requestPort();
      
      // Close existing port if any
      if (portRef.current && portRef.current !== port) {
        try {
          await portRef.current.close();
        } catch (closeError) {
          console.warn('⚠️ Erro ao fechar porta anterior:', closeError);
        }
      }

      portRef.current = port;

      // Open the port
      await port.open({
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity,
        flowControl: config.flowControl
      });

      // Get writer for sending data
      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error('Não foi possível obter o escritor da porta');
      }

      writerRef.current = writer;

      setConnection({
        isConnected: true,
        port: 'Impressora Térmica',
        model: 'Impressora ESC/POS'
      });

      console.log('✅ Impressora térmica conectada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar impressora:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          setLastError('Nenhuma impressora foi selecionada.');
        } else if (error.name === 'SecurityError') {
          setLastError('Acesso negado. Permita o acesso à porta serial.');
        } else {
          setLastError(`Erro ao conectar: ${error.message}`);
        }
      } else {
        setLastError('Erro desconhecido ao conectar à impressora.');
      }
      return false;
    }
  }, [config, isWebSerialSupported]);

  // Disconnect from printer
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      console.log('🔌 Desconectando da impressora...');

      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current = null;
      }

      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setConnection({ isConnected: false });
      console.log('✅ Impressora desconectada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }, []);

  // ESC/POS Commands
  const ESC = '\x1B';
  const GS = '\x1D';
  
  const commands = {
    // Initialize printer
    init: ESC + '@',
    // Text formatting
    bold: ESC + 'E' + '\x01',
    boldOff: ESC + 'E' + '\x00',
    center: ESC + 'a' + '\x01',
    left: ESC + 'a' + '\x00',
    right: ESC + 'a' + '\x02',
    // Font sizes
    normal: GS + '!' + '\x00',
    doubleHeight: GS + '!' + '\x01',
    doubleWidth: GS + '!' + '\x10',
    doubleSize: GS + '!' + '\x11',
    // Line feed
    lf: '\x0A',
    // Cut paper
    cut: GS + 'V' + '\x42' + '\x00',
    // Drawer kick
    drawer: ESC + 'p' + '\x00' + '\x19' + '\xFA'
  };

  // Send raw data to printer
  const sendData = useCallback(async (data: string): Promise<void> => {
    if (!connection.isConnected || !writerRef.current) {
      throw new Error('Impressora não conectada');
    }

    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      await writerRef.current.write(encodedData);
    } catch (error) {
      console.error('❌ Erro ao enviar dados para impressora:', error);
      throw error;
    }
  }, [connection.isConnected]);

  // Format text for thermal printer
  const formatText = (text: string, maxWidth: number = config.characterWidth): string => {
    const lines = text.split('\n');
    const formattedLines: string[] = [];

    lines.forEach(line => {
      if (line.length <= maxWidth) {
        formattedLines.push(line);
      } else {
        // Break long lines
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          if ((currentLine + word).length <= maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) {
              formattedLines.push(currentLine);
            }
            currentLine = word;
          }
        });
        
        if (currentLine) {
          formattedLines.push(currentLine);
        }
      }
    });

    return formattedLines.join('\n');
  };

  // Center text
  const centerText = (text: string, width: number = config.characterWidth): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  // Create separator line
  const separator = (char: string = '=', width: number = config.characterWidth): string => {
    return char.repeat(width);
  };

  // Print order receipt
  const printOrder = useCallback(async (orderData: any): Promise<void> => {
    if (!connection.isConnected) {
      throw new Error('Impressora não conectada');
    }

    setPrinting(true);
    setLastError(null);

    try {
      console.log('🖨️ Iniciando impressão automática do pedido:', orderData.sale?.sale_number || orderData.id);

      const formatPrice = (price: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

      const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
          'money': 'Dinheiro',
          'pix': 'PIX',
          'pix_entregador': 'PIX Entregador',
          'pix_online': 'PIX Online',
          'card': 'Cartao',
          'cartao_credito': 'Cartao Credito',
          'cartao_debito': 'Cartao Debito',
          'voucher': 'Voucher',
          'misto': 'Misto'
        };
        return methods[method] || method;
      };

      // Build receipt content
      let receipt = '';

      // Initialize printer
      receipt += commands.init;

      // Header
      receipt += commands.center + commands.bold;
      receipt += centerText('ELITE ACAI') + commands.lf;
      receipt += commands.boldOff;
      receipt += centerText('Pedido para Entrega') + commands.lf;
      receipt += centerText('Tel: (85) 98904-1010') + commands.lf;
      receipt += centerText('CNPJ: 38.130.139/0001-22') + commands.lf;
      receipt += commands.left;
      receipt += separator('=') + commands.lf;

      // Order info
      receipt += commands.bold + commands.center;
      receipt += centerText(`=== PEDIDO #${orderData.sale?.sale_number || orderData.id?.slice(-8).toUpperCase()} ===`) + commands.lf;
      receipt += commands.boldOff + commands.left;
      receipt += `Data: ${new Date(orderData.sale?.created_at || orderData.created_at).toLocaleDateString('pt-BR')}` + commands.lf;
      receipt += `Hora: ${new Date(orderData.sale?.created_at || orderData.created_at).toLocaleTimeString('pt-BR')}` + commands.lf;
      receipt += separator('=') + commands.lf;

      // Customer info
      receipt += commands.bold + 'CLIENTE:' + commands.boldOff + commands.lf;
      receipt += `Nome: ${orderData.sale?.customer_name || orderData.customer_name}` + commands.lf;
      receipt += `Telefone: ${orderData.sale?.customer_phone || orderData.customer_phone}` + commands.lf;
      
      if (orderData.sale?.delivery_type === 'pickup' || orderData.delivery_type === 'pickup') {
        receipt += commands.bold + '*** RETIRADA NA LOJA ***' + commands.boldOff + commands.lf;
        receipt += 'RUA UM, 1614-C - RESIDENCIAL 1 - CAGADO' + commands.lf;
        if (orderData.sale?.scheduled_pickup_date || orderData.scheduled_pickup_date) {
          receipt += `Data: ${new Date(orderData.sale?.scheduled_pickup_date || orderData.scheduled_pickup_date).toLocaleDateString('pt-BR')}` + commands.lf;
        }
        if (orderData.sale?.scheduled_pickup_time || orderData.scheduled_pickup_time) {
          receipt += `Horario: ${orderData.sale?.scheduled_pickup_time || orderData.scheduled_pickup_time}` + commands.lf;
        }
      } else {
        receipt += `Endereco: ${orderData.sale?.customer_address || orderData.customer_address}` + commands.lf;
        receipt += `Bairro: ${orderData.sale?.customer_neighborhood || orderData.customer_neighborhood}` + commands.lf;
        if (orderData.sale?.customer_complement || orderData.customer_complement) {
          receipt += `Complemento: ${orderData.sale?.customer_complement || orderData.customer_complement}` + commands.lf;
        }
      }
      receipt += separator('=') + commands.lf;

      // Items
      receipt += commands.bold + 'ITENS:' + commands.boldOff + commands.lf;
      const items = orderData.items || [];
      items.forEach((item: any, index: number) => {
        receipt += commands.bold + formatText(item.product_name, config.characterWidth - 4) + commands.boldOff + commands.lf;
        
        if (item.selected_size) {
          receipt += `Tamanho: ${item.selected_size}` + commands.lf;
        }
        
        const itemLine = `${item.quantity}x ${formatPrice(item.unit_price || item.total_price / item.quantity)}`;
        const priceLine = formatPrice(item.total_price);
        const padding = config.characterWidth - itemLine.length - priceLine.length;
        receipt += itemLine + ' '.repeat(Math.max(1, padding)) + priceLine + commands.lf;
        
        // Complementos
        if (item.complements && item.complements.length > 0) {
          receipt += 'Complementos:' + commands.lf;
          item.complements.forEach((comp: any) => {
            const compText = `  • ${comp.name}${comp.price > 0 ? ` (+${formatPrice(comp.price)})` : ''}`;
            receipt += formatText(compText, config.characterWidth) + commands.lf;
          });
        }
        
        // Observações
        if (item.observations) {
          receipt += `Obs: ${formatText(item.observations, config.characterWidth - 5)}` + commands.lf;
        }
        
        receipt += commands.lf;
      });
      receipt += separator('=') + commands.lf;

      // Total
      receipt += commands.bold + 'TOTAL:' + commands.boldOff + commands.lf;
      const totalLine = 'VALOR:';
      const totalPrice = formatPrice(orderData.sale?.total_amount || orderData.total_price);
      const totalPadding = config.characterWidth - totalLine.length - totalPrice.length;
      receipt += commands.bold + totalLine + ' '.repeat(Math.max(1, totalPadding)) + totalPrice + commands.boldOff + commands.lf;
      receipt += separator('=') + commands.lf;

      // Payment
      receipt += commands.bold + 'PAGAMENTO:' + commands.boldOff + commands.lf;
      receipt += `Forma: ${getPaymentMethodLabel(orderData.sale?.payment_type || orderData.payment_method)}` + commands.lf;
      if (orderData.sale?.change_amount > 0 || orderData.change_for) {
        const changeAmount = orderData.sale?.change_amount || (orderData.change_for - (orderData.sale?.total_amount || orderData.total_price));
        if (changeAmount > 0) {
          receipt += `Troco: ${formatPrice(changeAmount)}` + commands.lf;
        }
      }
      receipt += separator('=') + commands.lf;

      // Footer
      receipt += commands.center + commands.bold;
      receipt += centerText('Obrigado pela preferencia!') + commands.lf;
      receipt += commands.boldOff;
      receipt += centerText('Elite Acai - O melhor acai da cidade!') + commands.lf;
      receipt += centerText('@eliteacai') + commands.lf;
      receipt += centerText('Avalie-nos no Google') + commands.lf;
      receipt += commands.left;
      receipt += separator('-') + commands.lf;
      receipt += centerText(`Elite Acai - CNPJ: 38.130.139/0001-22`) + commands.lf;
      receipt += centerText(`Impresso: ${new Date().toLocaleString('pt-BR')}`) + commands.lf;
      receipt += centerText('Este nao e um documento fiscal') + commands.lf;

      // Cut paper and open drawer
      receipt += commands.lf + commands.lf + commands.lf;
      receipt += commands.cut;

      // Send to printer
      await sendData(receipt);
      
      console.log('✅ Pedido impresso com sucesso na impressora térmica');
      
      // Show success notification
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Pedido #${orderData.sale?.sale_number || orderData.id?.slice(-8)} impresso automaticamente!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 4000);

    } catch (error) {
      console.error('❌ Erro ao imprimir pedido:', error);
      setLastError(`Erro na impressão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    } finally {
      setPrinting(false);
    }
  }, [connection.isConnected, config, sendData]);

  // Print test page
  const printTest = useCallback(async (): Promise<void> => {
    if (!connection.isConnected) {
      throw new Error('Impressora não conectada');
    }

    setPrinting(true);
    try {
      let testReceipt = '';
      
      testReceipt += commands.init;
      testReceipt += commands.center + commands.bold;
      testReceipt += centerText('TESTE DE IMPRESSORA') + commands.lf;
      testReceipt += commands.boldOff;
      testReceipt += centerText('Elite Acai') + commands.lf;
      testReceipt += centerText('Sistema de Impressao Automatica') + commands.lf;
      testReceipt += commands.left;
      testReceipt += separator('=') + commands.lf;
      testReceipt += `Data: ${new Date().toLocaleDateString('pt-BR')}` + commands.lf;
      testReceipt += `Hora: ${new Date().toLocaleTimeString('pt-BR')}` + commands.lf;
      testReceipt += separator('=') + commands.lf;
      testReceipt += 'Configuracao da impressora:' + commands.lf;
      testReceipt += `Largura: ${config.paperWidth}mm` + commands.lf;
      testReceipt += `Caracteres por linha: ${config.characterWidth}` + commands.lf;
      testReceipt += `Baud rate: ${config.baudRate}` + commands.lf;
      testReceipt += separator('=') + commands.lf;
      testReceipt += commands.center;
      testReceipt += centerText('Teste concluido com sucesso!') + commands.lf;
      testReceipt += commands.left;
      testReceipt += commands.lf + commands.lf + commands.lf;
      testReceipt += commands.cut;

      await sendData(testReceipt);
      console.log('✅ Página de teste impressa com sucesso');
    } catch (error) {
      console.error('❌ Erro ao imprimir teste:', error);
      throw error;
    } finally {
      setPrinting(false);
    }
  }, [connection.isConnected, config, sendData, centerText, separator]);

  // Update printer configuration
  const updateConfig = useCallback((newConfig: Partial<ThermalPrinterConfig>): void => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    connection,
    config,
    lastError,
    printing,
    isWebSerialSupported,
    connect,
    disconnect,
    printOrder,
    printTest,
    updateConfig
  };
};