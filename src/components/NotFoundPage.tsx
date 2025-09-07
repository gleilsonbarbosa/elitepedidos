import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="bg-white rounded-full p-2 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg border-2 border-red-200">
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
        <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-red-600">404</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Página não encontrada
        </h1>
        
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Página Inicial
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          
          <button
            onClick={() => navigate('/buscar-pedido')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Search size={18} />
            Buscar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;