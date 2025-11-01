import React, { useState } from 'react';
import { Package, MapPin, Clock, Users, LogOut, ShoppingBag, Settings, Calculator, DollarSign, Truck, BarChart3, FileText, Gift, Zap, Sparkles } from 'lucide-react';
import ProductsPanel from './ProductsPanel';
import NeighborhoodsPanel from './NeighborhoodsPanel';
import StoreHoursPanel from './StoreHoursPanel';
import PromotionsPanel from './PromotionsPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import UnifiedAttendancePage from '../UnifiedAttendancePage';
import AttendanceUsersPanel from './AttendanceUsersPanel';
import AttendantPanel from '../Orders/AttendantPanel';
import CashRegisterMenu from '../PDV/CashRegisterMenu';
import PDVSalesScreen from '../PDV/PDVSalesScreen';
import TableSalesPanel from '../TableSales/TableSalesPanel';
import SalesHistoryPanel from '../Orders/SalesHistoryPanel';
import PDVReports from '../PDV/PDVReports';
import PDVSalesReport from '../PDV/PDVSalesReport';
import PDVDailyCashReport from '../PDV/PDVDailyCashReport';
import OrderSettingsPanel from './OrderSettingsPanel';
import WhatsAppContactsPanel from './WhatsAppContactsPanel';
import AdvancedReportsPanel from './AdvancedReportsPanel';

import { useScale } from '../../hooks/useScale';
import { useStoreHours } from '../../hooks/useStoreHours';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'neighborhoods' | 'hours' | 'users' | 'order-settings' | 'whatsapp-contacts' | 'promotions' | 'announcements' | 'advanced-reports'>('products');
  const scale = useScale();
  const { storeSettings } = useStoreHours();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsPanel />;
      case 'neighborhoods':
        return <NeighborhoodsPanel />;
      case 'hours':
        return <StoreHoursPanel />;
      case 'users':
        return <AttendanceUsersPanel />;
      case 'order-settings':
        return <OrderSettingsPanel />;
      case 'whatsapp-contacts':
        return <WhatsAppContactsPanel />;
      case 'promotions':
        return <PromotionsPanel />;
      case 'announcements':
        return <AnnouncementsPanel />;
      case 'advanced-reports':
        return <AdvancedReportsPanel />;
      default:
        return <ProductsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <ShoppingBag size={24} className="text-purple-600" />
              </div>
              <div>
              <h1 className="text-2xl font-bold text-gray-800">Administrativo</h1>
              <p className="text-gray-600">Elite Açaí - Gestão Completa</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-3">
            <button
              onClick={() => setActiveTab('products')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} />
              <span className="text-sm">Produtos Delivery</span>
            </button>
            <button
              onClick={() => setActiveTab('neighborhoods')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'neighborhoods'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin size={20} />
              <span className="text-sm">Bairros</span>
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'hours'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock size={20} />
              <span className="text-sm">Horários</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              <span className="text-sm">Usuários</span>
            </button>
            <button
              onClick={() => setActiveTab('order-settings')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'order-settings'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={20} />
              <span className="text-sm">Config. Pedidos</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp-contacts')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'whatsapp-contacts'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="text-sm">Contatos WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'promotions'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap size={20} />
              <span className="text-sm">Promoções</span>
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'announcements'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={20} />
              <span className="text-sm">Anúncios</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced-reports')}
              className={`p-3 rounded-lg font-medium transition-colors flex flex-col items-center gap-2 text-center ${
                activeTab === 'advanced-reports'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={20} />
              <span className="text-sm">Relatórios</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;