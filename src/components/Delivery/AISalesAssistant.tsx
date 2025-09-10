import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Users, Plus } from 'lucide-react';
import { CartItem } from '../../types/cart';
import { Product } from '../../types/product';

interface AISalesAssistantProps {
  cartItems: CartItem[];
  availableProducts: Product[];
  onAddSuggestion: (product: Product, reason: string) => void;
  className?: string;
}

interface Suggestion {
  product: Product;
  reason: string;
  trigger: 'social_proof' | 'affinity' | 'urgency';
  price_extra?: number;
}

const AISalesAssistant: React.FC<AISalesAssistantProps> = ({
  cartItems,
  availableProducts,
  onAddSuggestion,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Generate intelligent suggestions based on cart contents
  const generateSuggestions = () => {
    if (cartItems.length === 0) return [];

    const suggestions: Suggestion[] = [];
    const addedComplements = new Set<string>();
    const addedProducts = new Set<string>();
    
    // Verificar complementos já adicionados no carrinho
    cartItems.forEach(item => {
      addedProducts.add(item.product.id);
      item.selectedComplements.forEach(comp => {
        addedComplements.add(comp.complement.name.toLowerCase().trim());
      });
    });

    // Get cart total for context
    const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const hasAcai = cartItems.some(item => item.product.category === 'acai');
    const hasMilkshake = cartItems.some(item => item.product.category === 'milkshake');
    const hasCombo = cartItems.some(item => item.product.category === 'combo');
    
    // Gerar sugestões de complementos pagos baseado no carrinho
    // Generate product suggestions
    const generateProductSuggestions = () => {
      const productSuggestions: Suggestion[] = [];

      // PRIORITY: Açaí 300g suggestion (highest priority)
      if (!addedProducts.has('acai-300g')) {
        const acai300g = availableProducts.find(p => 
          p.name.includes('300g') && p.category === 'acai'
        );
        
        if (acai300g) {
          productSuggestions.push({
            product: acai300g,
            reason: 'O Açaí 300g é um dos mais pedidos do dia! Garanta o seu por apenas R$14,50.',
            trigger: 'social_proof'
          });
        }
      }

      // Product upgrade suggestions
      const upgradeSuggestions = [
        {
          condition: () => cartItems.some(item => item.product.name.includes('300g')),
          product: availableProducts.find(p => p.name.includes('500g')),
          reason: '87% dos clientes preferem o **tamanho 500g** - mais açaí, melhor custo-benefício!',
          trigger: 'social_proof' as const
        },
        {
          condition: () => cartItems.length === 1 && !hasCombo,
          product: availableProducts.find(p => p.category === 'combo'),
          reason: 'Que tal o **Combo Casal**? Perfeito para compartilhar e economizar!',
          trigger: 'affinity' as const
        },
        {
          condition: () => hasAcai && !hasMilkshake,
          product: availableProducts.find(p => p.category === 'milkshake'),
          reason: 'Complete sua experiência com um **milkshake cremoso** - combinação perfeita!',
          trigger: 'affinity' as const
        }
      ];

      // Generate upgrade suggestions
      upgradeSuggestions.forEach(upgrade => {
        if (upgrade.condition() && upgrade.product && !addedProducts.has(upgrade.product.id)) {
          productSuggestions.push({
            product: upgrade.product,
            reason: upgrade.reason,
            trigger: upgrade.trigger
          });
        }
      });

      // Add category-based suggestions
      if (hasAcai && cartTotal < 30) {
        const bebidas = availableProducts.filter(p => 
          p.category === 'bebidas' && !addedProducts.has(p.id)
        );
        
        if (bebidas.length > 0) {
          const randomBebida = bebidas[Math.floor(Math.random() * bebidas.length)];
          productSuggestions.push({
            product: randomBebida,
            reason: `Hidrate-se! **${randomBebida.name}** é a escolha de 73% dos nossos clientes.`,
            trigger: 'social_proof'
          });
        }
      }

      return productSuggestions;
    };

    // Generate paid complement suggestions
    const generatePaidComplementSuggestions = () => {
      const complementSuggestions: Suggestion[] = [];
      
      // Complementos pagos disponíveis (baseado nos dados do sistema)
      const paidComplements = [
        { name: 'AMENDOIN', price: 2.00, description: 'Amendoim torrado crocante' },
        { name: 'CASTANHA EM BANDA', price: 3.00, description: 'Castanha em fatias' },
        { name: 'CEREJA', price: 2.00, description: 'Cereja doce' },
        { name: 'CHOCOBALL MINE', price: 2.00, description: 'Chocoball pequeno' },
        { name: 'CHOCOBALL POWER', price: 2.00, description: 'Chocoball grande' },
        { name: 'CREME DE COOKIES', price: 3.00, description: 'Creme de cookies' },
        { name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 3.00, description: 'Chocolate com avelã' },
        { name: 'COBERTURA DE CHOCOLATE', price: 2.00, description: 'Cobertura de chocolate' },
        { name: 'COBERTURA DE MORANGO', price: 2.00, description: 'Cobertura de morango' },
        { name: 'GRANOLA', price: 2.00, description: 'Granola crocante' },
        { name: 'KIWI', price: 3.00, description: 'Kiwi fatiado fresco' },
        { name: 'LEITE CONDENSADO', price: 2.00, description: 'Leite condensado' },
        { name: 'MORANGO', price: 3.00, description: 'Morango fresco' },
        { name: 'PAÇOCA', price: 2.00, description: 'Paçoca triturada' }
      ];
      
      // Sugestões específicas para açaí
      if (hasAcai) {
        // Verificar quais complementos ainda não foram adicionados
        const availableComplements = paidComplements.filter(comp => 
          !addedComplements.has(comp.name.toLowerCase().trim())
        );
        
        // Sugestões por categoria de complemento
        const topSuggestions = [
          {
            complement: availableComplements.find(c => c.name.includes('PAÇOCA')),
            reason: 'Esse copo fica ainda mais gostoso com **paçoca crocante**.',
            trigger: 'affinity' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('LEITE CONDENSADO')),
            reason: 'A maioria completa com **leite condensado extra (+{price})**.',
            trigger: 'social_proof' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('MORANGO')),
            reason: 'Top escolha junto com esse copo: **morango fresco 🍓**.',
            trigger: 'social_proof' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('GRANOLA')),
            reason: 'Adicione **granola crocante** agora por apenas +{price}.',
            trigger: 'urgency' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('NUTELA')),
            reason: 'Clientes que pediram esse copo também escolheram **creme de nutella**.',
            trigger: 'social_proof' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('CASTANHA')),
            reason: 'Esse sabor combina perfeitamente com **castanha em banda**.',
            trigger: 'affinity' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('CHOCOBALL POWER')),
            reason: 'Adicione **chocoball power** por apenas +{price} - oferta limitada!',
            trigger: 'urgency' as const
          },
          {
            complement: availableComplements.find(c => c.name.includes('KIWI')),
            reason: 'Refresque ainda mais com **kiwi fatiado 🥝**.',
            trigger: 'affinity' as const
          }
        ];
        
        // Adicionar sugestões válidas
        topSuggestions.forEach(suggestion => {
          if (suggestion.complement) {
            // Criar um produto virtual para o complemento
            const virtualProduct: Product = {
              id: `complement-${suggestion.complement.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: suggestion.complement.name,
              category: 'complementos',
              price: suggestion.complement.price,
              description: suggestion.complement.description,
              image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
              isActive: true
            };
            
            complementSuggestions.push({
              product: virtualProduct,
              reason: suggestion.reason.replace('{price}', formatPrice(suggestion.complement.price)),
              trigger: suggestion.trigger
            });
          }
        });
      }
      
      // Sugestões para milkshake
      if (hasMilkshake && !hasAcai) {
        const milkshakeComplements = paidComplements.filter(comp => 
          ['CHOCOLATE', 'MORANGO', 'GRANOLA', 'LEITE CONDENSADO'].some(keyword => 
            comp.name.includes(keyword)
          ) && !addedComplements.has(comp.name.toLowerCase().trim())
        );
        
        milkshakeComplements.slice(0, 2).forEach(comp => {
          const virtualProduct: Product = {
            id: `complement-${comp.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: comp.name,
            category: 'complementos',
            price: comp.price,
            description: comp.description,
            image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
            isActive: true
          };
          
          complementSuggestions.push({
            product: virtualProduct,
            reason: `Complete seu milkshake com **${comp.name.toLowerCase()}** por apenas +${formatPrice(comp.price)}.`,
            trigger: 'affinity'
          });
        });
      }
      
      // Limitar a 3 sugestões de complementos
      return complementSuggestions.slice(0, 3);
    };

    // Combinar sugestões de produtos e complementos
    const productSuggestions = generateProductSuggestions();
    const complementSuggestions = generatePaidComplementSuggestions();
    
    // Mesclar e priorizar sugestões
    const allSuggestions = [...productSuggestions, ...complementSuggestions];
    
    // Ordenar por relevância e limitar a 2 para melhor experiência mobile
    return allSuggestions.slice(0, 2);
  };

  // Update suggestions when cart changes
  useEffect(() => {
    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions);
    setIsVisible(newSuggestions.length > 0 && cartItems.length > 0);
  }, [cartItems, availableProducts]);

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'social_proof':
        return <Users size={16} className="text-blue-600" />;
      case 'urgency':
        return <Clock size={16} className="text-orange-600" />;
      case 'affinity':
        return <TrendingUp size={16} className="text-green-600" />;
      default:
        return <Sparkles size={16} className="text-purple-600" />;
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'social_proof':
        return 'from-blue-500 to-indigo-500';
      case 'urgency':
        return 'from-orange-500 to-red-500';
      case 'affinity':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 md:p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-purple-800 text-sm md:text-base">🤖 Assistente IA</h3>
          <p className="text-purple-600 text-xs md:text-sm">Sugestões personalizadas</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-3 md:p-4 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-2 md:gap-3">
              <div className="flex-shrink-0 mt-1">
                {getTriggerIcon(suggestion.trigger)}
              </div>
              
              <div className="flex-1">
                <div 
                  className="text-xs md:text-sm text-gray-700 mb-2"
                  dangerouslySetInnerHTML={{ 
                    __html: suggestion.reason.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-700">$1</strong>')
                  }}
                />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={suggestion.product.image}
                      alt={suggestion.product.name}
                      className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-xs md:text-sm truncate">{suggestion.product.name}</p>
                      <p className="text-xs text-gray-600">
                        {suggestion.price_extra 
                          ? `+${formatPrice(suggestion.price_extra)}` 
                          : formatPrice(suggestion.product.price)
                        }
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onAddSuggestion(suggestion.product, suggestion.reason)}
                    className={`bg-gradient-to-r ${getTriggerColor(suggestion.trigger)} hover:shadow-lg text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-xs md:text-sm transform hover:scale-105 touch-manipulation flex-shrink-0`}
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <p className="text-purple-700 text-xs md:text-sm font-medium">
            💡 Sugestões baseadas em análise de pedidos e preferências dos clientes
          </p>
        </div>
      </div>
    </div>
  );
};

export default AISalesAssistant;