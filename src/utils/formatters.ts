/**
 * Utility functions for formatting values
 */

/**
 * Format a number as a price in BRL currency
 * @param price - The price to format
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  // Ensure we have a valid number
  const numericPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  
  // Round to 2 decimal places to avoid floating-point precision issues
  const roundedPrice = Math.round(numericPrice * 100) / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(roundedPrice);
};

/**
 * Get the display name for a payment method
 * @param method - The payment method code
 * @returns Display name for the payment method
 */
export const getPaymentMethodName = (method: string): string => {
  const labels: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'voucher': 'Voucher',
    'misto': 'Pagamento Misto'
  };
  return labels[method] || method;
};