import React, { useState, useEffect } from 'react';
import { useStoreHours } from '../../hooks/useStoreHours';
import { AlertCircle, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProductAnnouncement {
  id: string;
  product_name: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

const StoreStatusBanner: React.FC = () => {
  const { getStoreStatus, loading, refreshData } = useStoreHours();
  const [announcements, setAnnouncements] = useState<ProductAnnouncement[]>([]);
  const [currentView, setCurrentView] = useState<'status' | 'announcement'>('status');
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  // Buscar anúncios ativos
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('product_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();

    // Realtime para novos anúncios
    const channel = supabase
      .channel('product_announcements_changes')
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

  // Sistema de rotação entre status e anúncios
  useEffect(() => {
    if (announcements.length === 0) {
      setCurrentView('status');
      return;
    }

    const interval = setInterval(() => {
      setCurrentView((prev) => {
        if (prev === 'status') {
          return 'announcement';
        } else {
          // Se há mais de um anúncio, rotacionar entre eles
          if (announcements.length > 1) {
            setCurrentAnnouncementIndex((prevIndex) =>
              (prevIndex + 1) % announcements.length
            );
          }
          return 'status';
        }
      });
    }, 5000); // Alterna a cada 5 segundos

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          <div>
            <h3 className="font-semibold text-gray-600">Verificando status...</h3>
            <p className="text-gray-500">Carregando informações da loja</p>
          </div>
        </div>
      </div>
    );
  }

  const status = getStoreStatus();

  const handleRefresh = async () => {
    try {
      await refreshData();
      console.log('✅ Status da loja atualizado');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Mostrar anúncio com animação
  if (currentView === 'announcement' && announcements.length > 0) {
    const currentAnnouncement = announcements[currentAnnouncementIndex];

    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6 animate-[fadeIn_0.5s_ease-in-out]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-purple-600 animate-pulse" />
            <div>
              <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                ✨ Novidade: {currentAnnouncement.product_name}
              </h3>
              <p className="text-purple-700">{currentAnnouncement.message}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('status')}
            className="text-purple-600 hover:text-purple-800 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            title="Ver status da loja"
          >
            Ver Status
          </button>
        </div>
      </div>
    );
  }

  // Mostrar status da loja aberta
  if (status.isOpen) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-[fadeIn_0.5s_ease-in-out]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">🟢 Loja Aberta</h3>
              <p className="text-green-700">{status.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {announcements.length > 0 && (
              <button
                onClick={() => setCurrentView('announcement')}
                className="text-purple-600 hover:text-purple-800 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center gap-1"
                title="Ver novidades"
              >
                <Sparkles size={16} />
                Novidades
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-100 transition-colors"
              title="Atualizar status da loja"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar status da loja fechada
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 shadow-lg animate-[fadeIn_0.5s_ease-in-out]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">🔴 Loja Fechada</h3>
            <p className="text-red-700">{status.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {announcements.length > 0 && (
            <button
              onClick={() => setCurrentView('announcement')}
              className="text-purple-600 hover:text-purple-800 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center gap-1"
              title="Ver novidades"
            >
              <Sparkles size={16} />
              Novidades
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100 transition-colors"
            title="Atualizar status da loja"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreStatusBanner;