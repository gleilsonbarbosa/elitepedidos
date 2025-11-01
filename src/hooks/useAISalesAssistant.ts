import { useState, useCallback } from 'react';
import { CartItem } from '../types/cart';
import { Product } from '../types/product';

interface SuggestionRule {
  id: string;
  name: string;
  condition: (cartItems: CartItem[]) => boolean;
  suggestions: SuggestionTemplate[];
}

interface SuggestionTemplate {
  productMatch: (products: Product[]) => Product | null;
  reason: string;
  trigger: 'social_proof' | 'affinity' | 'urgency';
  priority: number;
  priceExtra?: number;
}

export const useAISalesAssistant = () => {
  const [lastCartHash, setLastCartHash] = useState<string>('');

  // Define suggestion rules using psychology triggers
  const suggestionRules: SuggestionRule[] = [
    {
      id: 'acai-300g-promotion',
      name: 'Promoção Açaí 300g',
      condition: (items) => !items.some(item => item.product.name.includes('300g')),
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.name.includes('300g') && p.category === 'acai'),
          reason: 'O Açaí 300g é um dos mais pedidos do dia! Garanta o seu por apenas R$14,50.',
          trigger: 'social_proof',
          priority: 10
        }
      ]
    },
    {
      id: 'acai-complements',
      name: 'Complementos para Açaí',
      condition: (items) => items.some(item => item.product.category === 'acai'),
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.name.toLowerCase().includes('paçoca')),
          reason: 'Esse copo fica ainda mais gostoso com **paçoca crocante**.',
          trigger: 'affinity',
          priority: 9,
          priceExtra: 2.00
        },
        {
          productMatch: (products) => products.find(p => p.name.toLowerCase().includes('leite condensado')),
          reason: 'A maioria completa com **leite condensado extra (+{price})**.',
          trigger: 'social_proof',
          priority: 8,
          priceExtra: 1.50
        },
        {
          productMatch: (products) => products.find(p => p.name.toLowerCase().includes('morango')),
          reason: 'Top escolha junto com esse copo: **morango fresco 🍓**.',
          trigger: 'social_proof',
          priority: 8,
          priceExtra: 3.00
        },
        {
          productMatch: (products) => products.find(p => p.name.toLowerCase().includes('granola')),
          reason: 'Adicione **granola crocante** agora por apenas +{price}.',
          trigger: 'urgency',
          priority: 7,
          priceExtra: 2.00
        },
        {
          productMatch: (products) => products.find(p => p.name.toLowerCase().includes('nutella')),
          reason: 'Clientes que pediram esse copo também escolheram **creme de nutella**.',
          trigger: 'social_proof',
          priority: 7,
          priceExtra: 3.00
        }
      ]
    },
    {
      id: 'size-upgrade',
      name: 'Upgrade de Tamanho',
      condition: (items) => items.some(item => item.product.name.includes('300g')),
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.name.includes('500g')),
          reason: '87% dos clientes preferem o **tamanho 500g** - mais açaí, melhor custo-benefício!',
          trigger: 'social_proof',
          priority: 10
        }
      ]
    },
    {
      id: 'combo-suggestion',
      name: 'Sugestão de Combo',
      condition: (items) => items.length === 1 && !items.some(item => item.product.category === 'combo'),
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.category === 'combo'),
          reason: 'Que tal o **Combo Casal**? Perfeito para compartilhar e economizar!',
          trigger: 'affinity',
          priority: 9
        }
      ]
    },
    {
      id: 'beverage-pairing',
      name: 'Harmonização com Bebidas',
      condition: (items) => items.some(item => item.product.category === 'acai') && items.every(item => item.product.category !== 'bebidas'),
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.category === 'bebidas'),
          reason: 'Hidrate-se! **{productName}** é a escolha de 73% dos nossos clientes.',
          trigger: 'social_proof',
          priority: 6
        }
      ]
    },
    {
      id: 'milkshake-complement',
      name: 'Complemento para Milkshake',
      condition: (items) => items.some(item => item.product.category === 'milkshake'),
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.category === 'acai' && p.name.includes('300g')),
          reason: 'Complete sua experiência com um **açaí tradicional** - combinação perfeita!',
          trigger: 'affinity',
          priority: 7
        }
      ]
    },
    {
      id: 'low-value-upsell',
      name: 'Upsell para Carrinho Baixo Valor',
      condition: (items) => {
        const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
        return total < 20;
      },
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.category === 'sobremesas'),
          reason: 'Adicione uma **sobremesa especial** por apenas +{price} - oferta por tempo limitado!',
          trigger: 'urgency',
          priority: 8
        }
      ]
    },
    {
      id: 'premium-experience',
      name: 'Experiência Premium',
      condition: (items) => {
        const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
        return total > 40;
      },
      suggestions: [
        {
          productMatch: (products) => products.find(p => p.name.toLowerCase().includes('premium')),
          reason: 'Você merece o melhor! **{productName}** - experiência premium garantida.',
          trigger: 'affinity',
          priority: 9
        }
      ]
    }
  ];

  const generateSuggestions = useCallback((
    cartItems: CartItem[],
    availableProducts: Product[]
  ): Array<{
    product: Product;
    reason: string;
    trigger: 'social_proof' | 'affinity' | 'urgency';
    priority: number;
  }> => {
    if (cartItems.length === 0) return [];

    // Create cart hash to avoid regenerating identical suggestions
    const cartHash = cartItems.map(item => `${item.product.id}-${item.quantity}`).join('|');
    if (cartHash === lastCartHash) return [];
    setLastCartHash(cartHash);

    const suggestions: Array<{
      product: Product;
      reason: string;
      trigger: 'social_proof' | 'affinity' | 'urgency';
      priority: number;
    }> = [];

    const addedProducts = new Set(cartItems.map(item => item.product.id));
    
    // Complementos pagos disponíveis do sistema
    const paidComplements = [
      { name: 'AMENDOIN', price: 2.00, category: 'nuts' },
      { name: 'CASTANHA EM BANDA', price: 3.00, category: 'nuts' },
      { name: 'CEREJA', price: 2.00, category: 'fruits' },
      { name: 'CHOCOBALL MINE', price: 2.00, category: 'chocolate' },
      { name: 'CHOCOBALL POWER', price: 2.00, category: 'chocolate' },
      { name: 'CREME DE COOKIES', price: 3.00, category: 'cream' },
      { name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 3.00, category: 'chocolate' },
      { name: 'COBERTURA DE CHOCOLATE', price: 2.00, category: 'topping' },
      { name: 'COBERTURA DE MORANGO', price: 2.00, category: 'topping' },
      { name: 'GRANOLA', price: 2.00, category: 'healthy' },
      { name: 'KIWI', price: 3.00, category: 'fruits' },
      { name: 'LEITE CONDENSADO', price: 2.00, category: 'sweet' },
      { name: 'MORANGO', price: 3.00, category: 'fruits' },
      { name: 'PAÇOCA', price: 2.00, category: 'nuts' }
    ];
    
    const addedComplements = new Set<string>();

    // Collect already added complements
    cartItems.forEach(item => {
      item.selectedComplements.forEach(comp => {
        addedComplements.add(comp.complement.name.toLowerCase().trim());
      });
    });

    // Regras para complementos pagos
    const paidComplementRules: SuggestionRule[] = [
      {
        id: 'acai-paid-complements',
        name: 'Complementos Pagos para Açaí',
        condition: (items) => items.some(item => item.product.category === 'acai'),
        suggestions: [
          {
            productMatch: (products) => {
              const pacocaComp = paidComplements.find(c => c.name.includes('PAÇOCA'));
              if (pacocaComp && !addedComplements.has(pacocaComp.name.toLowerCase())) {
                return createVirtualProduct(pacocaComp);
              }
              return null;
            },
            reason: 'Esse copo fica ainda mais gostoso com **paçoca crocante**.',
            trigger: 'affinity',
            priority: 9
          },
          {
            productMatch: (products) => {
              const leiteComp = paidComplements.find(c => c.name.includes('LEITE CONDENSADO'));
              if (leiteComp && !addedComplements.has(leiteComp.name.toLowerCase())) {
                return createVirtualProduct(leiteComp);
              }
              return null;
            },
            reason: 'A maioria completa com **leite condensado extra (+{price})**.',
            trigger: 'social_proof',
            priority: 8
          },
          {
            productMatch: (products) => {
              const morangoComp = paidComplements.find(c => c.name.includes('MORANGO') && !c.name.includes('COBERTURA'));
              if (morangoComp && !addedComplements.has(morangoComp.name.toLowerCase())) {
                return createVirtualProduct(morangoComp);
              }
              return null;
            },
            reason: 'Top escolha junto com esse copo: **morango fresco 🍓**.',
            trigger: 'social_proof',
            priority: 8
          },
          {
            productMatch: (products) => {
              const granolaComp = paidComplements.find(c => c.name.includes('GRANOLA'));
              if (granolaComp && !addedComplements.has(granolaComp.name.toLowerCase())) {
                return createVirtualProduct(granolaComp);
              }
              return null;
            },
            reason: 'Adicione **granola crocante** agora por apenas +{price}.',
            trigger: 'urgency',
            priority: 7
          },
          {
            productMatch: (products) => {
              const nutellaComp = paidComplements.find(c => c.name.includes('NUTELA'));
              if (nutellaComp && !addedComplements.has(nutellaComp.name.toLowerCase())) {
                return createVirtualProduct(nutellaComp);
              }
              return null;
            },
            reason: 'Clientes que pediram esse copo também escolheram **creme de nutella**.',
            trigger: 'social_proof',
            priority: 7
          },
          {
            productMatch: (products) => {
              const castanhaComp = paidComplements.find(c => c.name.includes('CASTANHA'));
              if (castanhaComp && !addedComplements.has(castanhaComp.name.toLowerCase())) {
                return createVirtualProduct(castanhaComp);
              }
              return null;
            },
            reason: 'Esse sabor combina perfeitamente com **castanha em banda**.',
            trigger: 'affinity',
            priority: 7
          },
          {
            productMatch: (products) => {
              const chocoComp = paidComplements.find(c => c.name.includes('CHOCOBALL POWER'));
              if (chocoComp && !addedComplements.has(chocoComp.name.toLowerCase())) {
                return createVirtualProduct(chocoComp);
              }
              return null;
            },
            reason: 'Adicione **chocoball power** por apenas +{price} - oferta limitada!',
            trigger: 'urgency',
            priority: 6
          },
          {
            productMatch: (products) => {
              const kiwiComp = paidComplements.find(c => c.name.includes('KIWI'));
              if (kiwiComp && !addedComplements.has(kiwiComp.name.toLowerCase())) {
                return createVirtualProduct(kiwiComp);
              }
              return null;
            },
            reason: 'Refresque ainda mais com **kiwi fatiado 🥝**.',
            trigger: 'affinity',
            priority: 6
          }
        ]
      },
      {
        id: 'milkshake-paid-complements',
        name: 'Complementos Pagos para Milkshake',
        condition: (items) => items.some(item => item.product.category === 'milkshake'),
        suggestions: [
          {
            productMatch: (products) => {
              const chocolateComp = paidComplements.find(c => c.name.includes('CHOCOLATE COM AVELÃ'));
              if (chocolateComp && !addedComplements.has(chocolateComp.name.toLowerCase())) {
                return createVirtualProduct(chocolateComp);
              }
              return null;
            },
            reason: 'Milkshake fica irresistível com **chocolate com avelã** (+{price}).',
            trigger: 'affinity',
            priority: 8
          },
          {
            productMatch: (products) => {
              const coberturaComp = paidComplements.find(c => c.name.includes('COBERTURA DE CHOCOLATE'));
              if (coberturaComp && !addedComplements.has(coberturaComp.name.toLowerCase())) {
                return createVirtualProduct(coberturaComp);
              }
              return null;
            },
            reason: '78% dos clientes adicionam **cobertura de chocolate** no milkshake.',
            trigger: 'social_proof',
            priority: 7
          }
        ]
      },
      {
        id: 'premium-complements',
        name: 'Complementos Premium',
        condition: (items) => {
          const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
          return total > 25; // Carrinho de valor alto
        },
        suggestions: [
          {
            productMatch: (products) => {
              const premiumComp = paidComplements.find(c => c.price >= 3.00 && !addedComplements.has(c.name.toLowerCase()));
              return premiumComp ? createVirtualProduct(premiumComp) : null;
            },
            reason: 'Você merece o melhor! **{productName}** - experiência premium.',
            trigger: 'affinity',
            priority: 8
          }
        ]
      }
    ];
    
    // Função para criar produto virtual a partir de complemento
    const createVirtualProduct = (complement: typeof paidComplements[0]): Product => ({
      id: `complement-${complement.name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`,
      name: complement.name,
      category: 'complementos',
      price: complement.price,
      description: `Adicional: ${complement.description || complement.name}`,
      image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
      isActive: true
    });

    // Apply suggestion rules
    const allRules = [...suggestionRules, ...paidComplementRules];
    
    allRules.forEach(rule => {
      if (rule.condition(cartItems)) {
        rule.suggestions.forEach(template => {
          const product = template.productMatch(availableProducts);
          
          if (product && !addedProducts.has(product.id)) {
            let reason = template.reason;
            
            // Replace placeholders
            reason = reason.replace('{productName}', product.name);
            reason = reason.replace('{price}', new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(product.price));
            if (template.priceExtra) {
              reason = reason.replace('{price}', new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(template.priceExtra));
            }

            suggestions.push({
              product,
              reason,
              trigger: template.trigger,
              priority: template.priority
            });
          }
        });
      }
    });

    // Sort by priority and return top 3
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2); // Limitar a 2 sugestões para melhor experiência mobile
  }, [lastCartHash]);

  const getPersonalizedMessage = useCallback((cartItems: CartItem[]): string => {
    if (cartItems.length === 0) return '';

    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const hasAcai = cartItems.some(item => item.product.category === 'acai');
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const messages = [
      `🎯 Seu pedido está quase perfeito! Que tal completar com algo especial?`,
      `✨ Baseado no seu gosto, temos algumas sugestões irresistíveis...`,
      `🍓 Outros clientes com pedidos similares também adicionaram:`,
      `💡 Para tornar sua experiência ainda melhor, recomendamos:`,
      `🎉 Aproveite para experimentar nossos complementos mais populares!`
    ];

    if (total > 30) {
      return `🌟 Excelente escolha! Para um pedido premium como o seu, sugerimos:`;
    } else if (hasAcai) {
      return `🍇 Seu açaí ficará ainda mais delicioso com:`;
    } else if (itemCount > 2) {
      return `🎊 Pedido generoso! Que tal finalizar com:`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  return {
    generateSuggestions,
    getPersonalizedMessage
  };
};