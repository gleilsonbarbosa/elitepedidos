import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Edit2, Save, X, Power, PowerOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  product_name: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

const AnnouncementsPanel: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    message: '',
    is_active: true
  });

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_announcements'
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('product_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('product_announcements')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_announcements')
          .insert([formData]);

        if (error) throw error;
      }

      setFormData({ product_name: '', message: '', is_active: true });
      setShowForm(false);
      setEditingId(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao salvar anúncio:', error);
      alert('Erro ao salvar anúncio');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      product_name: announcement.product_name,
      message: announcement.message,
      is_active: announcement.is_active
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;

    try {
      const { error } = await supabase
        .from('product_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
      alert('Erro ao excluir anúncio');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    }
  };

  const cancelEdit = () => {
    setFormData({ product_name: '', message: '', is_active: true });
    setShowForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="text-purple-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Anúncios e Novidades</h2>
            <p className="text-gray-600">Gerencie os banners de novidades que aparecem no delivery</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Anúncio
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            {editingId ? 'Editar Anúncio' : 'Novo Anúncio'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto/Novidade
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Açaí Premium 500ml"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Experimente nosso novo sabor com granola crocante!"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Ativo (aparecerá no delivery)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Produto/Novidade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Mensagem</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Data</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Sparkles size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">Nenhum anúncio cadastrado</p>
                    <p className="text-sm">Clique em "Novo Anúncio" para criar o primeiro</p>
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(announcement.id, announcement.is_active)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          announcement.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {announcement.is_active ? (
                          <>
                            <Power size={14} />
                            Ativo
                          </>
                        ) : (
                          <>
                            <PowerOff size={14} />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600" />
                        <span className="font-medium text-gray-900">{announcement.product_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{announcement.message}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(announcement.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <Sparkles size={18} />
          Como funciona?
        </h4>
        <ul className="text-sm text-purple-800 space-y-2">
          <li>✨ Os anúncios ativos aparecem automaticamente na página de delivery</li>
          <li>🔄 O sistema alterna entre o status da loja e os anúncios a cada 5 segundos</li>
          <li>📱 Clientes podem clicar em "Novidades" para ver os anúncios manualmente</li>
          <li>⚡ Use para divulgar novos produtos, promoções especiais ou lançamentos</li>
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementsPanel;
