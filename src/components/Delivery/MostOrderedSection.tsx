import React from 'react';
import { TrendingUp, Star, Package, Eye } from 'lucide-react';
import { useMostOrderedProducts } from '../../hooks/useDeliveryProducts';

interface MostOrderedSectionProps {
  onProductClick?: (productName: string) => void;
}

const MostOrderedSection: React.FC<MostOrderedSectionProps> = ({ onProductClick }) => {
  const { mostOrdered, loading, error } = useMostOrderedProducts();

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando produtos populares...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || mostOrdered.length === 0) {
    return null; // Don't show section if there's an error or no data
  }

  return (
    <section className="py-12 bg-gradient-to-r from-purple-50 to-green-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp size={32} className="text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              Mais Pedidos da Semana
            </h2>
            <div className="bg-purple-100 rounded-full p-3">
              <Star size={32} className="text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Os sabores que estão conquistando nossos clientes esta semana! 
            Descubra os favoritos e experimente você também.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mostOrdered.map((product, index) => (
            <div
              key={product.product_name}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => onProductClick?.(product.product_name)}
            >
              {/* Ranking Badge */}
              <div className="relative">
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
                <div className="absolute top-4 left-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                    'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`}>
                    #{index + 1}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <TrendingUp size={14} className="text-green-600" />
                    <span className="text-sm font-bold text-green-600">
                      {product.order_count} pedidos
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2">
                  {product.product_name}
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-purple-600" />
                    <span className="text-sm text-gray-600">
                      {product.total_quantity} unidades vendidas
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.category === 'acai' ? 'bg-purple-100 text-purple-700' :
                    product.category === 'combo' ? 'bg-orange-100 text-orange-700' :
                    product.category === 'milkshake' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {product.category === 'acai' ? 'Açaí' :
                     product.category === 'combo' ? 'Combo' :
                     product.category === 'milkshake' ? 'Milkshake' :
                     product.category}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Top {index + 1} da Semana
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick?.(product.product_name);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-green-500 hover:from-purple-600 hover:to-green-600 text-white px-4 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Eye size={16} />
                    Ver Produto
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Experimente os Favoritos da Semana!
            </h3>
            <p className="text-gray-600 mb-6">
              Estes são os sabores que mais conquistaram nossos clientes nos últimos 7 dias. 
              Que tal experimentar um deles no seu próximo pedido?
            </p>
            <a
              href="#cardapio"
              className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Package size={20} />
              Ver Cardápio Completo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostOrderedSection;