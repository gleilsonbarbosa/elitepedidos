import React from 'react';
import { X, Printer } from 'lucide-react';

interface SalePrintViewProps {
  sale: any;
  items: any[];
  storeSettings?: any;
  onClose: () => void;
}

const SalePrintView: React.FC<SalePrintViewProps> = ({
  sale,
  items,
  storeSettings,
  onClose
}) => {
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const getPaymentMethodLabel = (method: string) => method === 'dinheiro' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'cartao_credito' ? 'Cartão de Crédito' : method === 'cartao_debito' ? 'Cartão de Débito' : method === 'voucher' ? 'Voucher' : method === 'misto' ? 'Pagamento Misto' : method;

  const handlePrint = () => {
    // Criar uma nova janela com conteúdo específico para impressão térmica
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Venda #${sale.sale_number || 'N/A'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: black !important;
            background: white !important;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            color: black;
            background: white;
            padding: 2mm;
            width: 76mm;
          }
          
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .separator { 
            border-bottom: 1px dashed black; 
            margin: 5px 0; 
            padding-bottom: 5px; 
          }
          .flex-between { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
          }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 5px; }
          .mb-3 { margin-bottom: 8px; }
          .ml-2 { margin-left: 8px; }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="center mb-3 separator">
          <div class="bold" style="font-size: 16px;">ELITE AÇAÍ</div>
          <div class="small">Comprovante de Venda</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: ${storeSettings?.cnpj || '38.130.139/0001-22'}</div>
        </div>
        
        <!-- Dados da Venda -->
        <div class="mb-3 separator">
          <div class="bold center mb-2">=== COMPROVANTE DE VENDA ===</div>
          <div class="small">Venda: #${sale.sale_number || 'N/A'}</div>
          <div class="small">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          <div class="small">Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
          <div class="small">Operador: ${sale.operator_name || 'Sistema'}</div>
          ${sale.customer_name ? `<div class="small">Cliente: ${sale.customer_name}</div>` : ''}
        </div>
        
        <!-- Itens -->
        <div class="mb-3 separator">
          <div class="bold mb-1">ITENS DA VENDA:</div>
          ${items.map((item, index) => `
            <div class="mb-2">
              <div class="bold">${item.product_name}</div>
              <div class="flex-between">
                <span class="small">${item.weight_kg ? `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` : `${item.quantity}x ${formatPrice(item.unit_price || 0)}`}</span>
                <span class="small">${formatPrice(item.subtotal)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Resumo -->
        <div class="mb-3 separator">
          <div class="bold mb-1">RESUMO:</div>
          <div class="flex-between">
            <span class="small">Subtotal:</span>
            <span class="small">${formatPrice(sale.subtotal || 0)}</span>
          </div>
          ${sale.discount_amount > 0 ? `
          <div class="flex-between">
            <span class="small">Desconto:</span>
            <span class="small">-${formatPrice(sale.discount_amount)}</span>
          </div>
          ` : ''}
          <div style="border-top: 1px solid black; padding-top: 3px; margin-top: 3px;">
            <div class="flex-between bold">
              <span>TOTAL:</span>
              <span>${formatPrice(sale.total_amount || 0)}</span>
            </div>
          </div>
        </div>
        
        <!-- Pagamento -->
        <div class="mb-3 separator">
          <div class="bold mb-1">PAGAMENTO:</div>
          <div class="small">Forma: ${getPaymentMethodLabel(sale.payment_type)}</div>
          ${sale.payment_type === 'misto' && sale.payment_details?.mixed_payments ? `
            <div class="ml-2">
              ${sale.payment_details.mixed_payments.map((payment: any) => `
                <div class="small">${getPaymentMethodLabel(payment.method)}: ${formatPrice(payment.amount)}</div>
              `).join('')}
            </div>
          ` : ''}
          ${sale.change_amount > 0 ? `<div class="small">Troco: ${formatPrice(sale.change_amount)}</div>` : ''}
        </div>
        
        <!-- Rodapé -->
        <div class="center small">
          <div class="bold mb-2">Obrigado pela preferência!</div>
          <div>Elite Açaí - O melhor açaí da cidade!</div>
          <div>@eliteacai</div>
          <div>⭐⭐⭐⭐⭐ Avalie-nos no Google</div>
          <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid black;">
            <div>Elite Açaí - CNPJ: ${storeSettings?.cnpj || '38.130.139/0001-22'}</div>
            <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
            <div>Este não é um documento fiscal</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <>
      {/* Modal Interface - Hidden on print */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Imprimir Venda</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="font-bold text-lg">ELITE AÇAÍ</p>
                <p className="text-sm">Comprovante de Venda</p>
                <p className="text-xs">Rua Um, 1614-C</p>
                <p className="text-xs">Residencial 1 - Cágado</p>
                <p className="text-xs">Tel: (85) 98904-1010</p>
                <p className="text-xs">CNPJ: {storeSettings?.cnpj || '38.130.139/0001-22'}</p>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold text-center">=== COMPROVANTE DE VENDA ===</p>
                <p className="text-xs">Venda: #{sale.sale_number || 'N/A'}</p>
                <p className="text-xs">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="text-xs">Hora: {new Date().toLocaleTimeString('pt-BR')}</p>
                <p className="text-xs">Operador: {sale.operator_name || 'Sistema'}</p>
                {sale.customer_name && <p className="text-xs">Cliente: {sale.customer_name}</p>}
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold">ITENS:</p>
                {items.map((item, index) => (
                  <div key={index} className="text-xs mb-2">
                    <p className="font-bold">{item.product_name}</p>
                    <div className="flex justify-between">
                      <span>
                        {item.weight_kg ? 
                          `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` : 
                          `${item.quantity}x ${formatPrice(item.unit_price || 0)}`
                        }
                      </span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{formatPrice(sale.subtotal || 0)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Desconto:</span>
                    <span>-{formatPrice(sale.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>{formatPrice(sale.total_amount || 0)}</span>
                </div>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-bold">PAGAMENTO:</p>
                <p className="text-xs">Forma: {getPaymentMethodLabel(sale.payment_type)}</p>
                {sale.payment_type === 'misto' && sale.payment_details?.mixed_payments && (
                  <div className="ml-2">
                    {sale.payment_details.mixed_payments.map((payment: any, idx: number) => (
                      <p key={idx} className="text-xs">{getPaymentMethodLabel(payment.method)}: {formatPrice(payment.amount)}</p>
                    ))}
                  </div>
                )}
                {sale.change_amount > 0 && <p className="text-xs">Troco: {formatPrice(sale.change_amount)}</p>}
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="text-center text-xs">
                <p className="font-bold">Obrigado pela preferência!</p>
                <p>Elite Açaí</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalePrintView;