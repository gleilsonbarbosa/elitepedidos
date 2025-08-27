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
            font-size: 14px;
            line-height: 1.4;
            color: black;
            background: white;
            padding: 2mm;
            width: 76mm;
          }
          
          .center { text-align: center; }
          .bold { font-weight: 900 !important; }
          .small { font-size: 12px; font-weight: bold !important; }
          .medium { font-size: 14px; font-weight: bold !important; }
          .large { font-size: 16px; font-weight: 900 !important; }
          .separator { 
            border-bottom: 2px solid black; 
            margin: 6px 0; 
            padding-bottom: 6px; 
          }
          .flex-between { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
          }
          .mb-1 { margin-bottom: 3px; }
          .mb-2 { margin-bottom: 6px; }
          .mb-3 { margin-bottom: 9px; }
          .ml-2 { margin-left: 8px; }
          
          /* Novos estilos para melhor legibilidade */
          .header-title { 
            font-size: 18px; 
            font-weight: 900 !important; 
            color: black !important; 
            margin-bottom: 4px;
          }
          .section-title { 
            font-size: 15px; 
            font-weight: 900 !important; 
            color: black !important; 
            text-transform: uppercase; 
          }
          .item-name { 
            font-size: 14px; 
            font-weight: 900 !important; 
            color: black !important; 
          }
          .item-details { 
            font-size: 12px; 
            font-weight: bold !important; 
            color: black !important; 
          }
          .price-value { 
            font-size: 14px; 
            font-weight: 900 !important; 
            color: black !important; 
          }
          .total-value { 
            font-size: 16px; 
            font-weight: 900 !important; 
            color: black !important; 
          }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="center mb-3 separator">
          <div class="header-title">ELITE AÇAÍ</div>
          <div class="medium">COMPROVANTE DE VENDA</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: ${storeSettings?.cnpj || '38.130.139/0001-22'}</div>
        </div>
        
        <!-- Dados da Venda -->
        <div class="mb-3 separator">
          <div class="section-title center mb-2">=== COMPROVANTE DE VENDA ===</div>
          <div class="medium">Venda: #${sale.sale_number || 'N/A'}</div>
          <div class="item-details">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          <div class="item-details">Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
          <div class="item-details">Operador: ${sale.operator_name || 'Sistema'}</div>
          ${sale.customer_name ? `<div class="item-details">Cliente: ${sale.customer_name}</div>` : ''}
        </div>
        
        <!-- Itens -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">ITENS DA VENDA:</div>
          ${items.map((item, index) => `
            <div class="mb-2">
              <div class="item-name">${item.product_name}</div>
              <div class="flex-between">
                <span class="item-details">${item.weight_kg ? `${item.weight_kg}kg × ${formatPrice((item.price_per_gram || 0) * 1000)}/kg` : `${item.quantity}x ${formatPrice(item.unit_price || 0)}`}</span>
                <span class="price-value">${formatPrice(item.subtotal)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Resumo -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">RESUMO:</div>
          <div class="flex-between">
            <span class="item-details">Subtotal:</span>
            <span class="price-value">${formatPrice(sale.subtotal || 0)}</span>
          </div>
          ${sale.discount_amount > 0 ? `
          <div class="flex-between">
            <span class="item-details">Desconto:</span>
            <span class="price-value">-${formatPrice(sale.discount_amount)}</span>
          </div>
          ` : ''}
          <div style="border-top: 2px solid black; padding-top: 5px; margin-top: 5px;">
            <div class="flex-between bold">
              <span class="section-title">TOTAL:</span>
              <span class="total-value">${formatPrice(sale.total_amount || 0)}</span>
            </div>
          </div>
        </div>
        
        <!-- Pagamento -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">PAGAMENTO:</div>
          <div class="item-details">Forma: ${getPaymentMethodLabel(sale.payment_type)}</div>
          ${sale.payment_type === 'misto' && sale.payment_details?.mixed_payments ? `
            <div class="ml-2">
              ${sale.payment_details.mixed_payments.map((payment: any) => `
                <div class="item-details">${getPaymentMethodLabel(payment.method)}: ${formatPrice(payment.amount)}</div>
              `).join('')}
            </div>
          ` : ''}
          ${sale.change_amount > 0 ? `<div class="item-details">Troco: ${formatPrice(sale.change_amount)}</div>` : ''}
        </div>
        
        <!-- Rodapé -->
        <div class="center">
          <div class="section-title mb-2">Obrigado pela preferência!</div>
          <div class="item-details">Elite Açaí - O melhor açaí da cidade!</div>
          <div class="item-details">@eliteacai</div>
          <div class="item-details">⭐⭐⭐⭐⭐ Avalie-nos no Google</div>
          <div style="margin-top: 10px; padding-top: 6px; border-top: 2px solid black;">
            <div class="small">Elite Açaí - CNPJ: ${storeSettings?.cnpj || '38.130.139/0001-22'}</div>
            <div class="small">Impresso: ${new Date().toLocaleString('pt-BR')}</div>
            <div class="small">Este não é um documento fiscal</div>
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm leading-relaxed">
              <div className="text-center mb-4">
                <p className="font-black text-xl">ELITE AÇAÍ</p>
                <p className="font-bold">COMPROVANTE DE VENDA</p>
                <p className="text-xs">Rua Um, 1614-C</p>
                <p className="text-xs">Residencial 1 - Cágado</p>
                <p className="text-xs">Tel: (85) 98904-1010</p>
                <p className="text-xs">CNPJ: {storeSettings?.cnpj || '38.130.139/0001-22'}</p>
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <p className="font-black text-base text-center">=== COMPROVANTE DE VENDA ===</p>
                <p className="font-bold">Venda: #{sale.sale_number || 'N/A'}</p>
                <p className="font-semibold">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="font-semibold">Hora: {new Date().toLocaleTimeString('pt-BR')}</p>
                <p className="font-semibold">Operador: {sale.operator_name || 'Sistema'}</p>
                {sale.customer_name && <p className="font-semibold">Cliente: {sale.customer_name}</p>}
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <p className="font-black text-base">ITENS DA VENDA:</p>
                {items.map((item, index) => (
                  <div key={index} className="mb-3">
                    <p className="font-black">{item.product_name}</p>
                    <div className="flex justify-between">
                      <span>
                        {item.weight_kg ? 
                          <span className="font-bold">{item.weight_kg}kg × {formatPrice((item.price_per_gram || 0) * 1000)}/kg</span> : 
                          <span className="font-bold">{item.quantity}x {formatPrice(item.unit_price || 0)}</span>
                        }
                      </span>
                      <span className="font-black">{formatPrice(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between font-semibold">
                  <span className="item-details">Subtotal:</span>
                  <span className="price-value">{formatPrice(sale.subtotal || 0)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="item-details">Desconto:</span>
                    <span className="price-value">-{formatPrice(sale.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t-2 border-black mt-2 pt-2">
                  <div className="flex justify-between">
                    <span className="section-title">TOTAL:</span>
                    <span className="total-value">{formatPrice(sale.total_amount || 0)}</span>
                  </div>
                </div>
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <p className="font-black text-base">PAGAMENTO:</p>
                <p className="font-bold">Forma: {getPaymentMethodLabel(sale.payment_type)}</p>
                {sale.payment_type === 'misto' && sale.payment_details?.mixed_payments && (
                  <div className="ml-2">
                    {sale.payment_details.mixed_payments.map((payment: any, idx: number) => (
                      <p key={idx} className="item-details">{getPaymentMethodLabel(payment.method)}: {formatPrice(payment.amount)}</p>
                    ))}
                  </div>
                )}
                {sale.change_amount > 0 && <p className="font-bold">Troco: {formatPrice(sale.change_amount)}</p>}
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="text-center">
                <p className="font-black text-base">Obrigado pela preferência!</p>
                <p className="font-bold">Elite Açaí - O melhor açaí da cidade!</p>
                <p className="font-medium">@eliteacai</p>
                <p className="font-medium">⭐⭐⭐⭐⭐ Avalie-nos no Google</p>
                <div className="border-t-2 border-black mt-3 pt-3">
                  <p className="small">Elite Açaí - CNPJ: {storeSettings?.cnpj || '38.130.139/0001-22'}</p>
                  <p className="small">Impresso: {new Date().toLocaleString('pt-BR')}</p>
                  <p className="small">Este não é um documento fiscal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalePrintView;