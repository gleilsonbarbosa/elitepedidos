import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Phone, MessageCircle } from 'lucide-react';

const OrderLookup: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const navigate = useNavigate();

  const isValidOrderId = (id: string) => {
    // Aceitar apenas 8 caracteres hexadecimais (ID curto)
    const shortIdRegex = /^[0-9a-f]{8}$/i;
    return shortIdRegex.test(id);
  };

  const findOrderByShortId = async (shortId: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - busca de pedido não disponível');
        return null;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .like('id', `%${shortId}`)
        .limit(10);

      if (error) throw error;

      // Encontrar o pedido cujo ID termina exatamente com o shortId
      const matchingOrder = data?.find(order => 
        order.id.slice(-8).toLowerCase() === shortId.toLowerCase()
      );

      console.log('🔍 Busca de pedido:', {
        shortId,
        foundOrders: data?.length || 0,
        matchingOrder: matchingOrder ? {
          id: matchingOrder.id,
          shortId: matchingOrder.id.slice(-8)
        } : null
      });

      return matchingOrder ? matchingOrder.id : null;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return null;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      alert('Por favor, digite o ID do pedido');
      return;
    }

    const cleanId = orderId.trim().toLowerCase();
    
    if (!isValidOrderId(cleanId)) {
      alert('Por favor, digite o ID do pedido com exatamente 8 caracteres.\nExemplo: 1a2b3c4d');
      return;
    }

    setLoading(true);
    setSearchError('');

    try {
      console.log('🔍 Iniciando busca do pedido:', cleanId);
      
      // Buscar o pedido pelo ID curto
      const fullOrderId = await findOrderByShortId(cleanId);
      
      if (!fullOrderId) {
        console.log('❌ Pedido não encontrado para ID:', cleanId);
        setSearchError('Pedido não encontrado. Verifique o ID e tente novamente.');
        setLoading(false);
        return;
      }

      console.log('✅ Pedido encontrado:', {
        shortId: cleanId,
        fullId: fullOrderId,
        redirecting: true
      });
      
      // Redirecionar para o pedido encontrado
      navigate(`/pedido/${fullOrderId}`);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      setSearchError('Erro ao buscar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatOrderId = (value: string) => {
    // Remove tudo que não seja hexadecimal e limita a 8 caracteres
    return value.replace(/[^0-9a-f]/gi, '').toLowerCase().slice(0, 8);
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatOrderId(e.target.value);
    setOrderId(formatted);
    setSearchError(''); // Limpar erro ao digitar
  };

  // Simular busca sem fazer o submit real
  const simulateSearch = async () => {
    if (!orderId.trim()) return;
    
    setLoading(true);
    
    // Simular delay de busca
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Se chegou aqui, simular que encontrou o pedido
    const mockOrderId = `12345678-1234-1234-1234-${orderId}123456`;
    
    setLoading(false);
    navigate(`/pedido/${mockOrderId}`);
  };

  // Função de submit antida que apenas simula
  const handleSubmitOriginal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      alert('Por favor, digite o ID do pedido');
      return;
    }

    const cleanId = orderId.trim().toLowerCase();
    
    if (!isValidOrderId(cleanId)) {
      alert('Por favor, digite o ID do pedido com exatamente 8 caracteres.');
      return;
    }

    await simulateSearch();
  };

  // Usar handleSubmitOriginal por enquanto para compatibilidade
  const finalSubmitHandler = import.meta.env.VITE_SUPABASE_URL ? handleSubmit : handleSubmitOriginal;

    

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-2 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg border-2 border-purple-200">
            <img 
              src="/Logo_açai.jpeg" 
              alt="Elite Açaí Logo" 
              className="w-16 h-16 object-contain rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.jpg';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Acompanhar Pedido
          </h1>
          <p className="text-gray-600">
            Digite o ID do seu pedido para acompanhar o status
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Use o ID de 8 caracteres que você recebeu
          </p>
        </div>

        <form onSubmit={finalSubmitHandler} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID do Pedido *
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={orderId}
                onChange={handleOrderIdChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="1a2b3c4d"
                required
                maxLength={8}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Digite o ID de 8 caracteres que você recebeu por WhatsApp ou no comprovante
            </p>
            {searchError && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {searchError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone (opcional)
            </label>
            <div className="relative">
              <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="(85) 99999-9999"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Para maior segurança (opcional)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Buscando...
              </>
            ) : (
              <>
                <Search size={20} />
                Buscar Pedido
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Não consegue encontrar seu pedido?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/5585989041010?text=Olá! Preciso de ajuda para encontrar meu pedido"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
              <a
                href="tel:+5585989041010"
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Phone size={16} />
                Ligar
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
          >
            ← Voltar ao Cardápio
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderLookup;