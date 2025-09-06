import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Phone, Calendar, Download, RefreshCw, Search, Filter, Eye, Send, Bell, Smartphone, AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useWebPush } from '../../hooks/useWebPush';

interface PushSubscription {
  id: string;
  customer_phone?: string;
  customer_name?: string;
  subscription_data: any;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const WhatsAppContactsPanel: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);

  const { sendServerNotification, testNotification } = useWebPush();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        // Mock data for demonstration
        const mockSubscriptions: PushSubscription[] = [
          {
            id: '1',
            customer_phone: '85999887766',
            customer_name: 'Maria Santos',
            subscription_data: { endpoint: 'mock-endpoint-1' },
            user_agent: 'Chrome/120.0.0.0',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            customer_phone: '85988776655',
            customer_name: 'João Silva',
            subscription_data: { endpoint: 'mock-endpoint-2' },
            user_agent: 'Firefox/121.0.0.0',
            is_active: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        
        setSubscriptions(mockSubscriptions);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
      console.log(`✅ ${data?.length || 0} subscriptions carregadas`);
    } catch (err) {
      console.error('❌ Erro ao carregar subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      alert('Preencha o título e mensagem da notificação');
      return;
    }

    if (selectedSubscriptions.length === 0) {
      alert('Selecione pelo menos um contato para enviar');
      return;
    }

    setSending(true);
    try {
      const results = await Promise.allSettled(
        selectedSubscriptions.map(async (subId) => {
          const subscription = subscriptions.find(s => s.id === subId);
          if (!subscription?.customer_phone) {
            throw new Error('Telefone não encontrado');
          }

          return await sendServerNotification(subscription.customer_phone, {
            title: notificationTitle,
            body: notificationBody,
            tag: 'admin-broadcast',
            data: {
              type: 'admin_message',
              timestamp: Date.now()
            }
          });
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      alert(`✅ Notificações enviadas!\n\n${successful} enviadas com sucesso\n${failed} falharam`);
      
      setShowSendModal(false);
      setNotificationTitle('');
      setNotificationBody('');
      setSelectedSubscriptions([]);
    } catch (err) {
      console.error('❌ Erro ao enviar notificações:', err);
      alert('❌ Erro ao enviar notificações');
    } finally {
      setSending(false);
    }
  };

  const handleSelectAll = () => {
    const filtered = getFilteredSubscriptions();
    if (selectedSubscriptions.length === filtered.length) {
      setSelectedSubscriptions([]);
    } else {
      setSelectedSubscriptions(filtered.map(s => s.id));
    }
  };

  const handleToggleSubscription = (subId: string) => {
    setSelectedSubscriptions(prev => 
      prev.includes(subId) 
        ? prev.filter(id => id !== subId)
        : [...prev, subId]
    );
  };

  const getFilteredSubscriptions = () => {
    return subscriptions.filter(sub => {
      const matchesSearch = !searchTerm || 
        sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.customer_phone?.includes(searchTerm);
      
      const matchesFilter = !filterActive || sub.is_active;
      
      return matchesSearch && matchesFilter;
    });
  };

  const exportContacts = () => {
    const filtered = getFilteredSubscriptions();
    
    if (filtered.length === 0) {
      alert('Nenhum contato para exportar');
      return;
    }

    const csvContent = [
      ['Nome', 'Telefone', 'Status', 'Data de Cadastro', 'Navegador'],
      ...filtered.map(sub => [
        sub.customer_name || 'Não informado',
        sub.customer_phone || 'Não informado',
        sub.is_active ? 'Ativo' : 'Inativo',
        new Date(sub.created_at).toLocaleDateString('pt-BR'),
        sub.user_agent || 'Não informado'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contatos-push-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = getFilteredSubscriptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Bell size={24} className="text-blue-600" />
            Notificações Push
          </h2>
          <p className="text-gray-600">Gerencie contatos que recebem notificações Push no navegador</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSendModal(true)}
            disabled={filteredSubscriptions.length === 0}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            Enviar Notificação
          </button>
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(!filterActive)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filterActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Filter size={16} />
              {filterActive ? 'Apenas Ativos' : 'Todos'}
            </button>
            
            <button
              onClick={exportContacts}
              disabled={filteredSubscriptions.length === 0}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Contatos</p>
              <p className="text-2xl font-bold text-gray-800">{subscriptions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <Bell size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-800">
                {subscriptions.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-full p-2">
              <X size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-800">
                {subscriptions.filter(s => !s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hoje</p>
              <p className="text-2xl font-bold text-gray-800">
                {subscriptions.filter(s => {
                  const today = new Date().toDateString();
                  const subDate = new Date(s.created_at).toDateString();
                  return today === subDate;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Contatos Push ({filteredSubscriptions.length})
            </h3>
            {filteredSubscriptions.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedSubscriptions.length === filteredSubscriptions.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando contatos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchSubscriptions}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Tente buscar por outro termo'
                : 'Os clientes que ativarem notificações Push aparecerão aqui'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedSubscriptions.length === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Navegador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSubscriptions.includes(subscription.id)}
                        onChange={() => handleToggleSubscription(subscription.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">
                          {subscription.customer_name || 'Não informado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-800">
                          {subscription.customer_phone ? formatPhone(subscription.customer_phone) : 'Não informado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {subscription.user_agent ? 
                          subscription.user_agent.split(' ')[0] : 
                          'Não informado'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscription.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subscription.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (subscription.customer_phone) {
                              setSelectedSubscriptions([subscription.id]);
                              setNotificationTitle('🍧 Elite Açaí');
                              setNotificationBody('Temos novidades especiais para você!');
                              setShowSendModal(true);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          title="Enviar notificação individual"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => {
                            // Ver detalhes da subscription
                            alert(`Detalhes da Subscription:\n\nID: ${subscription.id}\nTelefone: ${subscription.customer_phone}\nEndpoint: ${subscription.subscription_data?.endpoint?.substring(0, 50)}...`);
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Enviar Notificação Push
                </h2>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setNotificationTitle('');
                    setNotificationBody('');
                    setSelectedSubscriptions([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Destinatários:</strong> {selectedSubscriptions.length} contato(s) selecionado(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Notificação *
                </label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 🍧 Elite Açaí - Nova Promoção!"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {notificationTitle.length}/50 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem *
                </label>
                <textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Ex: Açaí 500g por apenas R$15,99 até às 22h! Aproveite!"
                  maxLength={150}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {notificationBody.length}/150 caracteres
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 text-sm font-medium">Dicas para notificações eficazes:</p>
                    <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                      <li>• Use emojis para chamar atenção</li>
                      <li>• Seja claro e direto</li>
                      <li>• Inclua informações de urgência (horário limite)</li>
                      <li>• Mencione benefícios específicos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setNotificationTitle('');
                  setNotificationBody('');
                  setSelectedSubscriptions([]);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sending || !notificationTitle.trim() || !notificationBody.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Notificação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Smartphone size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como funcionam as Notificações Push</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Automáticas:</strong> Clientes recebem quando fazem pedidos</li>
              <li>• <strong>Funcionam offline:</strong> Chegam mesmo com o site fechado</li>
              <li>• <strong>Interativas:</strong> Cliente pode clicar para ver o pedido</li>
              <li>• <strong>Seguras:</strong> Requerem permissão explícita do usuário</li>
              <li>• <strong>Personalizadas:</strong> Você pode enviar promoções específicas</li>
              <li>• <strong>Compatíveis:</strong> Funcionam no Chrome, Firefox, Edge e Safari</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppContactsPanel;