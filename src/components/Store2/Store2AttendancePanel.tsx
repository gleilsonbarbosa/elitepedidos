import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowLeft, User, LogOut, AlertCircle, Package, DollarSign, BarChart3 } from 'lucide-react';

interface Store2AttendancePanelProps {
  operator: any;
  onLogout: () => void;
}

const Store2AttendancePanel: React.FC<Store2AttendancePanelProps> = ({ operator, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'reports'>('sales');

  const renderContent = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Sistema de Vendas - Loja 2
            </h3>
            <p className="text-gray-500">
              Sistema de vendas presenciais da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      case 'products':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Gerenciar Produtos - Loja 2
            </h3>
            <p className="text-gray-500">
              Gerenciamento de produtos da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Relatórios - Loja 2
            </h3>
            <p className="text-gray-500">
              Relatórios específicos da Loja 2 em desenvolvimento.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="bg-blue-100 rounded-full p-2">
                <Calculator size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Atendimento Loja 2</h1>
                <p className="text-gray-600">Elite Açaí - Sistema Exclusivo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                <User size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{operator.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'sales'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calculator size={20} />
              Vendas
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} />
              Produtos
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={20} />
              Relatórios
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Store2AttendancePanel;