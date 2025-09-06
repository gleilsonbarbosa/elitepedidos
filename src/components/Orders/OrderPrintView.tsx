import React, { useState, useEffect } from 'react';
import { Order } from '../../types/order';

interface OrderPrintViewProps {
  order: Order | any;
  storeSettings?: any;
  onClose: () => void;
}

const OrderPrintView: React.FC<OrderPrintViewProps> = ({ order, storeSettings, onClose }) => {
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const getPaymentMethodLabel = (method: string) => method === 'money' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : method;
  const getStatusLabel = (status: string) => ({
    pending: 'Pendente', confirmed: 'Confirmado', preparing: 'Em Preparo',
    out_for_delivery: 'Saiu para Entrega', ready_for_pickup: 'Pronto para Retirada',
    delivered: 'Entregue', cancelled: 'Cancelado'
  })[status] || status;

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
        <title>Pedido #${(order.id || '').slice(-8)}</title>
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
          .mt-1 { margin-top: 2px; }
          .mt-2 { margin-top: 5px; }
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
          
          img {
            max-width: 60mm;
            height: auto;
            display: block;
            margin: 5px auto;
          }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="center mb-3 separator">
          <div class="header-title">ELITE AÇAÍ</div>
          <div class="medium">DELIVERY PREMIUM</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: ${storeSettings?.cnpj || '38.130.139/0001-22'}</div>
        </div>
        
        ${order.payment_method === 'pix' ? `
        <!-- QR Code PIX -->
        <div class="center mb-3 separator">
          <div class="section-title mb-2">QR CODE PIX</div>
          <div class="small">Chave PIX: 85989041010</div>
          <div class="small">Nome: Amanda Suyelen da Costa Pereira</div>
          <div class="price-value">Valor: ${formatPrice(order.total_price || 0)}</div>
        </div>
        ` : ''}
        
        <!-- Dados do Pedido -->
        <div class="mb-3 separator">
          <div class="section-title center mb-2">=== PEDIDO DE DELIVERY ===</div>
          <div class="medium">Pedido: #${(order.id || '').slice(-8)}</div>
          <div class="item-details">Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
          <div class="item-details">Hora: ${new Date(order.created_at).toLocaleTimeString('pt-BR')}</div>
          <div class="item-details">Status: ${getStatusLabel(order.status)}</div>
        </div>
        
        <!-- Cliente -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">DADOS DO CLIENTE:</div>
          <div class="item-details">Nome: ${order.customer_name}</div>
          <div class="item-details">Telefone: ${order.customer_phone}</div>
          ${order.delivery_type === 'pickup' ? `
          <div class="bold" style="font-size: 14px; font-weight: 900;">*** RETIRADA NA LOJA ***</div>
          <div class="bold" style="font-size: 12px; font-weight: 900;">RUA UM, 1614-C - RESIDENCIAL 1 - CÁGADO</div>
          ` : `
          <div class="item-details">Endereço: ${order.customer_address}</div>
          <div class="item-details">Bairro: ${order.customer_neighborhood}</div>
          `}
          ${order.customer_complement ? `<div class="item-details">Complemento: ${order.customer_complement}</div>` : ''}
        </div>
        
        <!-- Itens -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">ITENS DO PEDIDO:</div>
          ${order.items.map((item, index) => `
            <div class="mb-2">
              <div class="item-name">${item.product_name}</div>
              ${item.selected_size ? `<div class="item-details">Tamanho: ${item.selected_size}</div>` : ''}
              <div class="flex-between">
                <span class="item-details">${item.quantity}x ${formatPrice(item.unit_price)}</span>
                <span class="price-value">${formatPrice(item.total_price)}</span>
              </div>
              ${item.complements && item.complements.length > 0 ? `
                <div class="ml-2 mt-1">
                  <div class="item-details">Complementos:</div>
                  ${item.complements.map(comp => `
                    <div class="item-details ml-2">• ${comp.name}${comp.price > 0 ? ` (+${formatPrice(comp.price)})` : ''}</div>
                  `).join('')}
                </div>
              ` : ''}
              ${item.observations ? `<div class="item-details ml-2 mt-1">⚠️ OBS: ${item.observations}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <!-- Resumo -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">RESUMO:</div>
          <div class="flex-between">
            <span class="item-details">Subtotal:</span>
            <span class="price-value">${formatPrice(Math.max(0, (order.total_price || 0) - (order.delivery_fee || 0)))}</span>
          </div>
          ${order.delivery_fee && order.delivery_fee > 0 ? `
          <div class="flex-between">
            <span class="item-details">Taxa de Entrega:</span>
            <span class="price-value">${formatPrice(order.delivery_fee)}</span>
          </div>
          ` : ''}
          <div style="border-top: 2px solid black; padding-top: 5px; margin-top: 5px;">
            <div class="flex-between bold">
              <span class="section-title">TOTAL:</span>
              <span class="total-value">${formatPrice(order.total_price || 0)}</span>
            </div>
          </div>
        </div>
        
        <!-- Pagamento -->
        <div class="mb-3 separator">
          <div class="section-title mb-1">PAGAMENTO:</div>
          <div class="item-details">Forma: ${getPaymentMethodLabel(order.payment_method)}</div>
          ${order.change_for ? `<div class="item-details">Troco para: ${formatPrice(order.change_for)}</div>` : ''}
          ${(order.payment_method === 'pix' || order.payment_method === 'pix_online') ? `
          <div class="mt-2">
            <div class="item-details">⚠️ IMPORTANTE:</div>
            <div class="item-details">Envie o comprovante do PIX</div>
            <div class="item-details">para confirmar o pedido!</div>
          </div>
          ` : ''}
        </div>
        
        <!-- Rodapé -->
        <div class="center item-details">
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
    
    // Aguardar carregar e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const generateWhatsAppMessage = () => {
    // Validate order data
    if (!order || !order.id) {
      console.error('Dados do pedido não disponíveis para gerar mensagem', order);
      return encodeURIComponent('Erro ao gerar mensagem: Dados do pedido não disponíveis.');
    }

    let message = `🆕 *NOVO PEDIDO RECEBIDO - ELITE AÇAÍ*\n\n`;
    message += `📋 *Pedido #${(order.id || '').slice(-8)}*\n`;
    message += `🕐 Recebido: ${new Date(order.created_at).toLocaleString('pt-BR')}\n`;
    message += `📊 Status: ${getStatusLabel(order.status || 'pending')}\n\n`;
    
    message += `👤 *CLIENTE:*\n`;
    message += `Nome: ${order.customer_name || 'Não informado'}\n`;
    message += `📱 Telefone: ${order.customer_phone}\n`;
    message += `📍 Endereço: ${order.customer_address || 'Não informado'}\n`;
    message += `🏘️ Bairro: ${order.customer_neighborhood}\n`;
    if (order.customer_complement) {
      message += `🏠 Complemento: ${order.customer_complement}\n`;
    }
    
    // Adicionar link do Google Maps para localização
    const fullAddress = `${order.customer_address || ''}, ${order.customer_neighborhood || ''}`.trim();
    const encodedAddress = encodeURIComponent(fullAddress);
    message += `📍 *LOCALIZAÇÃO:*\n`;
    message += `https://www.google.com/maps/search/?api=1&query=${encodedAddress}\n`;
    message += `\n`;
    
    message += `🛒 *ITENS DO PEDIDO:*\n`;
    (order.items || []).forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      if (item.selected_size) {
        message += `   Tamanho: ${item.selected_size}\n`;
      }
      message += `   Qtd: ${item.quantity}x - ${formatPrice(item.total_price)}\n`;
      
      if (Array.isArray(item.complements) && item.complements.length > 0) {
        message += `   *Complementos:*\n`;
        item.complements.forEach(comp => {
          message += `   • ${comp.name}`;
          if (comp.price > 0) {
            message += ` (+${formatPrice(comp.price)})`;
          }
          message += `\n`;
        });
      }
      
      if (item.observations) {
        message += `   *Obs:* ${item.observations}\n`;
      }
      message += `\n`;
    });
    
    message += `💰 *VALORES:*\n`;
    const subtotal = order.total_price - (order.delivery_fee || 0);
    message += `Subtotal: ${formatPrice(subtotal)}\n`;
    if (order.delivery_fee && order.delivery_fee > 0) {
      message += `Taxa de entrega: ${formatPrice(order.delivery_fee)}\n`;
    }
    message += `*TOTAL: ${formatPrice(order.total_price || 0)}*\n\n`;
    
    message += `💳 *PAGAMENTO:*\n`;
    message += `Forma: ${getPaymentMethodLabel(order.payment_method)}\n`;
    if (order.change_for) {
      message += `Troco para: ${formatPrice(order.change_for)}\n`;
    }
    if (order.payment_method === 'pix') {
      message += `\n📱 *DADOS PIX:*\n`;
      message += `Chave: 85989041010\n`;
      message += `Nome: Grupo Elite\n`;
      message += `Valor: ${formatPrice(order.total_price || 0)}\n`;
    }
    message += `\n`;
    
    message += `⚠️ *AÇÃO NECESSÁRIA:*\n`;
    message += `• Confirmar recebimento do pedido\n`;
    message += `• Iniciar preparo dos itens\n`;
    if (order.payment_method === 'pix') {
      message += `• Aguardar comprovante do PIX\n`;
    }
    message += `\n`;
    
    message += `🔗 *LINK DE ACOMPANHAMENTO:*\n`;
    message += `${window.location.origin}/pedido/${order.id || ''}\n`;
    message += `Cliente pode acompanhar status em tempo real\n\n`;
    
    message += `📱 Sistema de Atendimento - Elite Açaí`;
    
    return encodeURIComponent(message);
  };

  return (
    <>
      {/* Modal Interface - Hidden on print */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Imprimir Pedido</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const message = generateWhatsAppMessage();
                    // Abrir WhatsApp da loja
                    window.open(`https://wa.me/5585989041010?text=${message}`, '_blank');
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  title="Enviar pedido para WhatsApp da loja"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp Loja
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  🖨️ Imprimir
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
                <p className="font-bold">DELIVERY PREMIUM</p>
                <p className="text-xs">Rua Um, 1614-C</p>
                <p className="text-xs">Residencial 1 - Cágado</p>
                <p className="text-xs">Tel: (85) 98904-1010</p>
                <p className="text-xs">CNPJ: {storeSettings?.cnpj || '38.130.139/0001-22'}</p>
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              {/* QR Code PIX - apenas para pagamentos PIX */}
              {order.payment_method === 'pix' && (
                <div className="text-center mb-4 pb-3 border-b-2 border-solid border-gray-600">
                  <div className="font-black text-base mb-3">QR CODE PIX</div>
                  <div className="space-y-1">
                    <div className="font-bold">Chave PIX: 85989041010</div>
                    <div className="font-bold">Nome: Amanda Suyelen da Costa Pereira</div>
                    <div className="font-black text-lg">Valor: {formatPrice(order.total_price || 0)}</div>
                  </div>
                  <p className="font-bold">══════════════════════════</p>
                </div>
              )}
              
              <div className="mb-3">
                <p className="font-bold">Pedido: #{(order.id || '').slice(-8)}</p>
                <p className="font-semibold">Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                <p className="font-semibold">Hora: {new Date(order.created_at).toLocaleTimeString('pt-BR')}</p>
                <p className="font-semibold">Status: {getStatusLabel(order.status)}</p>
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <p className="font-black text-base">DADOS DO CLIENTE:</p>
                <p className="font-bold">Nome: {order.customer_name}</p>
                <p className="font-bold">Telefone: {order.customer_phone}</p>
                {order.delivery_type === 'pickup' ? (
                  <>
                    <p className="font-black text-lg bg-yellow-100 p-1 rounded mt-1">*** RETIRADA NA LOJA ***</p>
                    <p className="font-black bg-blue-100 p-1 rounded mt-1">RUA UM, 1614-C - RESIDENCIAL 1 - CÁGADO</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Endereço: {order.customer_address}</p>
                    <p className="font-bold">Bairro: {order.customer_neighborhood}</p>
                  </>
                )}
                {order.customer_complement && <p className="font-bold">Complemento: {order.customer_complement}</p>}
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <p className="font-black text-base">ITENS DO PEDIDO:</p>
                {order.items.map((item, index) => (
                  <div key={index} className="mb-3">
                    <p className="font-black">{item.product_name}</p>
                    {item.selected_size && <p className="font-semibold">Tamanho: {item.selected_size}</p>}
                    <div className="flex justify-between font-bold">
                      <span>{item.quantity}x {formatPrice(item.unit_price)}</span>
                      <span>{formatPrice(item.total_price)}</span>
                    </div>
                    
                    {item.complements && item.complements.length > 0 && (
                      <div className="ml-2 mt-2">
                        <p className="font-semibold">Complementos:</p>
                        {item.complements.map((comp, idx) => (
                          <p key={idx} className="ml-2 font-medium">• {comp.name}{comp.price > 0 && ` (+${formatPrice(comp.price)})`}</p>
                        ))}
                      </div>
                    )}
                    
                    {item.observations && <p className="font-bold bg-yellow-100 p-1 rounded mt-1">⚠️ OBS: {item.observations}</p>}
                  </div>
                ))}
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>{formatPrice(Math.max(0, (order.total_price || 0) - (order.delivery_fee || 0)))}</span>
                </div>
                {order.delivery_fee && order.delivery_fee > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Taxa Entrega:</span>
                    <span>{formatPrice(order.delivery_fee)}</span>
                  </div>
                )}
                <div className="border-t-2 border-black mt-2 pt-2">
                  <div className="flex justify-between">
                    <span className="font-black text-lg">TOTAL:</span>
                    <span className="font-black text-xl">{formatPrice(order.total_price || 0)}</span>
                  </div>
                </div>
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="mb-3">
                <p className="font-black text-base">PAGAMENTO:</p>
                <p className="font-bold">Forma: {getPaymentMethodLabel(order.payment_method)}</p>
                {order.change_for && <p className="font-bold">Troco para: {formatPrice(order.change_for)}</p>}
                {order.payment_method === 'pix' && (
                  <div className="mt-2">
                    <p className="font-bold text-red-600">⚠️ IMPORTANTE:</p>
                    <p className="font-semibold">Envie o comprovante do PIX</p>
                    <p className="font-semibold">para confirmar o pedido!</p>
                  </div>
                )}
                <p className="font-bold">══════════════════════════</p>
              </div>
              
              <div className="text-center">
                <p className="font-black text-base">Obrigado pela preferência!</p>
                <p className="font-bold">Elite Açaí - O melhor açaí da cidade!</p>
                <p className="font-medium">@eliteacai</p>
                <p className="font-medium">⭐⭐⭐⭐⭐ Avalie-nos no Google</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Content - Only visible when printing */}
      <div className="hidden print:block print:w-full print:h-full print:bg-white print:text-black thermal-print-content">
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: '14px', lineHeight: '1.4', color: 'black', background: 'white', padding: '10mm' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed black', paddingBottom: '10px', color: 'black', background: 'white' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>ELITE AÇAÍ</h1>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>Delivery Premium</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Rua Dois, 2130-A</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Residencial 1 - Cágado</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Tel: (85) 98904-1010</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>CNPJ: {storeSettings?.cnpj || '38.130.139/0001-22'}</p>
          </div>

          {/* QR Code PIX */}
          {(order.payment_method === 'pix' || order.payment_method === 'pix_online') && (
            <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed black', paddingBottom: '10px', color: 'black', background: 'white' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>QR CODE PIX</p>
              <p style={{ fontSize: '10px', margin: '5px 0' }}>Chave PIX: 85989041010</p>
              <p style={{ fontSize: '10px', margin: '5px 0' }}>Nome: Grupo Elite</p>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '5px 0' }}>Valor: {formatPrice(order.total_price || 0)}</p>
            </div>
          )}

          {/* Order Info */}
          <div style={{ marginBottom: '15px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>=== PEDIDO DE DELIVERY ===</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Pedido: #{(order.id || '').slice(-8)}</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Hora: {new Date(order.created_at).toLocaleTimeString('pt-BR')}</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Status: {getStatusLabel(order.status)}</p>
          </div>

          {/* Customer Info */}
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '15px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>DADOS DO CLIENTE:</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Nome: {order.customer_name}</p>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Telefone: {order.customer_phone}</p>
            {order.delivery_type === 'pickup' ? (
              <>
                <p style={{ fontSize: '14px', fontWeight: '900', margin: '5px 0', color: 'black' }}>*** RETIRADA NA LOJA ***</p>
                <p style={{ fontSize: '12px', fontWeight: '900', margin: '3px 0', color: 'black' }}>RUA UM, 1614-C - RESIDENCIAL 1 - CÁGADO</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Data: {order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Horário: {order.scheduled_pickup_time || 'Não definido'}</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Endereço: {order.customer_address}</p>
                <p style={{ fontSize: '10px', margin: '2px 0' }}>Bairro: {order.customer_neighborhood}</p>
                {order.customer_complement && <p style={{ fontSize: '10px', margin: '2px 0' }}>Complemento: {order.customer_complement}</p>}
              </>
            )}
          </div>

          {/* Items */}
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '15px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>ITENS DO PEDIDO:</p>
            {order.items.map((item, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0' }}>{item.product_name}</p>
                {item.selected_size && <p style={{ fontSize: '12px', margin: '2px 0' }}>Tamanho: {item.selected_size}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px' }}>{item.quantity}x {formatPrice(item.unit_price)}</span>
                  <span style={{ fontSize: '12px' }}>{formatPrice(item.total_price)}</span>
                </div>
                
                {item.complements && item.complements.length > 0 && (
                  <div style={{ marginLeft: '8px', marginTop: '5px' }}>
                    <p style={{ fontSize: '12px' }}>Complementos:</p>
                    {item.complements.map((comp, idx) => (
                      <p key={idx} style={{ fontSize: '12px', marginLeft: '8px' }}>• {comp.name}{comp.price > 0 && ` (+${formatPrice(comp.price)})`}</p>
                    ))}
                  </div>
                )}
                
                {item.observations && <p style={{ fontSize: '12px', marginLeft: '8px', marginTop: '5px' }}>Obs: {item.observations}</p>}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '15px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>RESUMO:</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px' }}>Subtotal:</span>
              <span style={{ fontSize: '12px' }}>{formatPrice(Math.max(0, (order.total_price || 0) - (order.delivery_fee || 0)))}</span>
            </div>
            {order.delivery_fee && order.delivery_fee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px' }}>Taxa de Entrega:</span>
                <span style={{ fontSize: '12px' }}>{formatPrice(order.delivery_fee)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid black', paddingTop: '5px', marginTop: '5px' }}>
              <span style={{ fontSize: '14px' }}>TOTAL:</span>
              <span style={{ fontSize: '14px' }}>{formatPrice(order.total_price || 0)}</span>
            </div>
          </div>

          {/* Payment */}
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '15px', color: 'black', background: 'white' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>PAGAMENTO:</p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>Forma: {getPaymentMethodLabel(order.payment_method)}</p>
            {order.change_for && <p style={{ fontSize: '12px', margin: '2px 0' }}>Troco para: {formatPrice(order.change_for)}</p>}
            {(order.payment_method === 'pix' || order.payment_method === 'pix_online') && (
              <div style={{ marginTop: '5px' }}>
                <p style={{ fontSize: '12px', margin: '2px 0' }}>⚠️ IMPORTANTE:</p>
                <p style={{ fontSize: '12px', margin: '2px 0' }}>Envie o comprovante do PIX</p>
                <p style={{ fontSize: '12px', margin: '2px 0' }}>para confirmar o pedido!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '12px', borderTop: '1px solid black', paddingTop: '10px', color: 'black', background: 'white' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Obrigado pela preferência!</p>
            <p style={{ margin: '2px 0' }}>Elite Açaí - O melhor açaí da cidade!</p>
            <p style={{ margin: '2px 0' }}>@eliteacai</p>
            <p style={{ margin: '2px 0' }}>⭐⭐⭐⭐⭐ Avalie-nos no Google</p>
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid black' }}>
              <p style={{ margin: '2px 0' }}>Elite Açaí - CNPJ: {storeSettings?.cnpj || '38.130.139/0001-22'}</p>
              <p style={{ margin: '2px 0' }}>Impresso: {new Date().toLocaleString('pt-BR')}</p>
              <p style={{ margin: '2px 0' }}>Este não é um documento fiscal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0 !important;
          }
          
          html, body {
            font-family: 'Courier New', monospace !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: black !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          * {
            color: black !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
            visibility: visible !important;
          }
          
          .print\\:w-full {
            width: 100% !important;
          }
          
          .print\\:h-full {
            height: 100% !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:text-black {
            color: black !important;
          }
          
          /* Force visibility for thermal printing */
          .thermal-print-content {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            font-family: 'Courier New', monospace !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
            color: black !important;
            background: white !important;
            padding: 2mm !important;
            margin: 0 !important;
          }
          
          /* Remove all transforms and effects */
          .thermal-print-content * {
            transform: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          
          /* Ensure text is visible */
          .thermal-print-content p,
          .thermal-print-content div,
          .thermal-print-content span {
            color: black !important;
            background: white !important;
            display: block !important;
            visibility: visible !important;
          }
          
          /* Images for thermal printing */
          .thermal-print-content img {
            max-width: 60mm !important;
            height: auto !important;
            display: block !important;
            margin: 5mm auto !important;
          }
        }
      `}</style>
    </>
  );
};

export default OrderPrintView;