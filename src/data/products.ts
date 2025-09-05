import { Product, ComplementGroup, Complement } from '../types/product';

// Standard complement groups that repeat across all products
export const standardComplementGroups: ComplementGroup[] = [
  {
    id: 'tipo-acai',
    name: 'TIPO DE AÇAÍ (ESCOLHA 1 ITEM)',
    required: true,
    minItems: 1,
    maxItems: 1,
    complements: [
      { id: 'acai-tradicional', name: 'AÇAÍ PREMIUM TRADICIONAL', price: 0, description: 'Açaí tradicional premium', isActive: true },
      { id: 'acai-fit', name: 'AÇAÍ PREMIUM (0% AÇÚCAR - FIT)', price: 0, description: 'Açaí sem açúcar, ideal para dieta', isActive: true },
      { id: 'acai-morango', name: 'AÇAÍ PREMIUM COM MORANGO', price: 0, description: 'Açaí premium com sabor morango', isActive: true }
    ]
  },
  {
    id: 'quantidade-acai',
    name: 'COMO DESEJA A QUANTIDADE DE AÇAÍ?',
    required: true,
    minItems: 1,
    maxItems: 1,
    complements: [
      { id: 'mais-acai', name: 'MAIS AÇAÍ', price: 0, description: 'Quantidade extra de açaí', isActive: true },
      { id: 'nao-quero-acai', name: 'NÃO QUERO AÇAÍ', price: 0, description: 'Sem açaí', isActive: true },
      { id: 'menos-acai', name: 'MENOS AÇAÍ', price: 0, description: 'Quantidade reduzida de açaí', isActive: true },
      { id: 'quantidade-normal', name: 'QUANTIDADE NORMAL', price: 0, description: 'Quantidade padrão de açaí', isActive: true }
    ]
  },
  {
    id: 'cremes-opcional',
    name: 'CREMES * OPCIONAL (ATÉ 2 ITEM)',
    required: false,
    minItems: 0,
    maxItems: 2,
    complements: [
      { id: 'creme-cupuacu', name: 'CREME DE CUPUAÇU', price: 0, description: 'Creme cremoso de cupuaçu', isActive: true },
      { id: 'creme-morango', name: 'CREME DE MORANGO', price: 0, description: 'Creme doce de morango', isActive: true },
      { id: 'creme-ninho', name: 'CREME DE NINHO', price: 0, description: 'Creme de leite ninho', isActive: true },
      { id: 'creme-nutela', name: 'CREME DE NUTELA', price: 0, description: 'Creme de nutella', isActive: true },
      { id: 'creme-maracuja', name: 'CREME DE MARACUJÁ', price: 0, description: 'Creme azedinho de maracujá', isActive: true },
      { id: 'creme-pacoca', name: 'CREME DE PAÇOCA', price: 0, description: 'Creme de paçoca', isActive: true },
      { id: 'creme-ovomaltine', name: 'CREME DE OVOMALTINE', price: 0, description: 'Creme de ovomaltine', isActive: true },
      { id: 'creme-pistache', name: 'CREME DE PISTACHE', price: 0, description: 'Creme de pistache', isActive: true }
    ]
  },
  {
    id: 'adicionais-3',
    name: '3 ADICIONAIS * OPCIONAL (ATÉ 3 ITENS)',
    required: false,
    minItems: 0,
    maxItems: 3,
    complements: [
      { id: 'castanha-banda', name: 'CASTANHA EM BANDA', price: 0, description: 'Castanha em fatias', isActive: true },
      { id: 'cereja', name: 'CEREJA', price: 0, description: 'Cereja doce', isActive: true },
      { id: 'chocoball-mine', name: 'CHOCOBALL MINE', price: 0, description: 'Chocoball pequeno', isActive: true },
      { id: 'chocoball-power', name: 'CHOCOBALL POWER', price: 0, description: 'Chocoball grande', isActive: true },
      { id: 'creme-cookies-branco', name: 'CREME DE COOKIES BRANCO', price: 0, description: 'Creme de cookies branco', isActive: true },
      { id: 'chocolate-avela', name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 0, description: 'Chocolate com avelã', isActive: true },
      { id: 'cobertura-chocolate', name: 'COBERTURA DE CHOCOLATE', price: 0, description: 'Cobertura de chocolate', isActive: true },
      { id: 'cobertura-morango', name: 'COBERTURA DE MORANGO', price: 0, description: 'Cobertura de morango', isActive: true },
      { id: 'granola', name: 'GRANOLA', price: 0, description: 'Granola crocante', isActive: true },
      { id: 'granulado-chocolate', name: 'GRANULADO DE CHOCOLATE', price: 0, description: 'Granulado de chocolate', isActive: true },
      { id: 'leite-condensado', name: 'LEITE CONDENSADO', price: 0, description: 'Leite condensado', isActive: true },
      { id: 'morango', name: 'MORANGO', price: 0, description: 'Morango fresco', isActive: true },
      { id: 'pacoca', name: 'PAÇOCA', price: 0, description: 'Paçoca triturada', isActive: true },
      { id: 'marshmallows', name: 'MARSHMALLOWS', price: 0, description: 'Marshmallows macios', isActive: true },
      { id: 'mms', name: 'MMS', price: 0, description: 'Confetes coloridos', isActive: true },
      { id: 'jujuba', name: 'JUJUBA', price: 0, description: 'Jujuba colorida', isActive: true },
      { id: 'kiwi', name: 'KIWI', price: 0, description: 'Kiwi fatiado', isActive: true },
      { id: 'uva', name: 'UVA', price: 0, description: 'Uva fresca', isActive: true },
      { id: 'uva-passas', name: 'UVA PASSAS', price: 0, description: 'Uva passas', isActive: true }
    ]
  },
  {
    id: 'adicionais-10',
    name: '10 ADICIONAIS * OPCIONAL (ATÉ 10 ITENS)',
    required: false,
    minItems: 0,
    maxItems: 10,
    complements: [
      { id: 'amendoin-pago', name: 'AMENDOIN', price: 2.00, description: 'Amendoim torrado', isActive: true },
      { id: 'castanha-banda-pago', name: 'CASTANHA EM BANDA', price: 3.00, description: 'Castanha em fatias', isActive: true },
      { id: 'cereja-pago', name: 'CEREJA', price: 2.00, description: 'Cereja doce', isActive: true },
      { id: 'chocoball-mine-pago', name: 'CHOCOBALL MINE', price: 2.00, description: 'Chocoball pequeno', isActive: true },
      { id: 'chocoball-power-pago', name: 'CHOCOBALL POWER', price: 2.00, description: 'Chocoball grande', isActive: true },
      { id: 'creme-cookies-pago', name: 'CREME DE COOKIES', price: 3.00, description: 'Creme de cookies', isActive: true },
      { id: 'chocolate-avela-pago', name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 3.00, description: 'Chocolate com avelã', isActive: true },
      { id: 'cobertura-chocolate-pago', name: 'COBERTURA DE CHOCOLATE', price: 2.00, description: 'Cobertura de chocolate', isActive: true },
      { id: 'cobertura-morango-pago', name: 'COBERTURA DE MORANGO', price: 2.00, description: 'Cobertura de morango', isActive: true },
      { id: 'granola-pago', name: 'GRANOLA', price: 2.00, description: 'Granola crocante', isActive: true },
      { id: 'kiwi-pago', name: 'KIWI', price: 3.00, description: 'Kiwi fatiado', isActive: true },
      { id: 'leite-condensado-pago', name: 'LEITE CONDENSADO', price: 2.00, description: 'Leite condensado', isActive: true },
      { id: 'morango-pago', name: 'MORANGO', price: 3.00, description: 'Morango fresco', isActive: true },
      { id: 'pacoca-pago', name: 'PAÇOCA', price: 2.00, description: 'Paçoca triturada', isActive: true }
    ]
  },
  {
    id: 'opcionais-separados',
    name: 'VOCÊ PREFERE OS OPCIONAIS SEPARADOS OU JUNTO COM O AÇAÍ?',
    required: true,
    minItems: 1,
    maxItems: 1,
    complements: [
      { id: 'tudo-junto', name: 'SIM, QUERO TUDO JUNTO', price: 0, description: 'Misturar tudo com o açaí', isActive: true },
      { id: 'separados', name: 'NÃO, QUERO SEPARADOS', price: 0, description: 'Servir os complementos separadamente', isActive: true }
    ]
  },
  {
    id: 'colher-descartavel',
    name: 'CONSUMA MENOS DESCARTÁVEIS.',
    required: true,
    minItems: 1,
    maxItems: 1,
    complements: [
      { id: 'sim-colher', name: 'SIM, VOU QUERER A COLHER', price: 0, description: 'Incluir colher descartável', isActive: true },
      { id: 'nao-colher', name: 'NÃO QUERO COLHER, VOU AJUDAR AO MEIO AMBIENTE', price: 0, description: 'Sem colher, ajudando o meio ambiente', isActive: true }
    ]
  }
];

// Category names mapping
export const categoryNames = {
  acai: 'Açaí',
  combo: 'Combos',
  milkshake: 'Milkshakes',
  vitamina: 'Vitaminas',
  sorvetes: 'Sorvetes',
  bebidas: 'Bebidas',
  complementos: 'Complementos',
  sobremesas: 'Sobremesas',
  outros: 'Outros'
};

// Base complements for different product types
export const complementsFor1Creme2Mix: ComplementGroup[] = [
  {
    id: 'creme-1',
    name: '1 CREME * OPCIONAL (ESCOLHA 1 ITEM)',
    required: false,
    minItems: 0,
    maxItems: 1,
    complements: [
      { id: 'creme-cupuacu', name: 'CREME DE CUPUAÇU', price: 0, description: 'Creme cremoso de cupuaçu', isActive: true },
      { id: 'creme-morango', name: 'CREME DE MORANGO', price: 0, description: 'Creme doce de morango', isActive: true },
      { id: 'creme-ninho', name: 'CREME DE NINHO', price: 0, description: 'Creme de leite ninho', isActive: true },
      { id: 'creme-nutela', name: 'CREME DE NUTELA', price: 0, description: 'Creme de nutella', isActive: true },
      { id: 'creme-maracuja', name: 'CREME DE MARACUJÁ', price: 0, description: 'Creme azedinho de maracujá', isActive: true },
      { id: 'creme-pacoca', name: 'CREME DE PAÇOCA', price: 0, description: 'Creme de paçoca', isActive: true },
      { id: 'creme-ovomaltine', name: 'CREME DE OVOMALTINE', price: 0, description: 'Creme de ovomaltine', isActive: true },
      { id: 'creme-pistache', name: 'CREME DE PISTACHE', price: 0, description: 'Creme de pistache', isActive: true }
    ]
  },
  {
    id: 'mix-2',
    name: '2 MIX * OPCIONAL (ATÉ 2 ITENS)',
    required: false,
    minItems: 0,
    maxItems: 2,
    complements: [
      { id: 'castanha-banda', name: 'CASTANHA EM BANDA', price: 0, description: 'Castanha em fatias', isActive: true },
      { id: 'cereja', name: 'CEREJA', price: 0, description: 'Cereja doce', isActive: true },
      { id: 'chocoball-mine', name: 'CHOCOBALL MINE', price: 0, description: 'Chocoball pequeno', isActive: true },
      { id: 'chocoball-power', name: 'CHOCOBALL POWER', price: 0, description: 'Chocoball grande', isActive: true },
      { id: 'creme-cookies-branco', name: 'CREME DE COOKIES BRANCO', price: 0, description: 'Creme de cookies branco', isActive: true },
      { id: 'chocolate-avela', name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 0, description: 'Chocolate com avelã', isActive: true },
      { id: 'cobertura-chocolate', name: 'COBERTURA DE CHOCOLATE', price: 0, description: 'Cobertura de chocolate', isActive: true },
      { id: 'cobertura-morango', name: 'COBERTURA DE MORANGO', price: 0, description: 'Cobertura de morango', isActive: true },
      { id: 'granola', name: 'GRANOLA', price: 0, description: 'Granola crocante', isActive: true },
      { id: 'granulado-chocolate', name: 'GRANULADO DE CHOCOLATE', price: 0, description: 'Granulado de chocolate', isActive: true },
      { id: 'leite-condensado', name: 'LEITE CONDENSADO', price: 0, description: 'Leite condensado', isActive: true },
      { id: 'morango', name: 'MORANGO', price: 0, description: 'Morango fresco', isActive: true },
      { id: 'pacoca', name: 'PAÇOCA', price: 0, description: 'Paçoca triturada', isActive: true },
      { id: 'marshmallows', name: 'MARSHMALLOWS', price: 0, description: 'Marshmallows macios', isActive: true },
      { id: 'mms', name: 'MMS', price: 0, description: 'Confetes coloridos', isActive: true },
      { id: 'jujuba', name: 'JUJUBA', price: 0, description: 'Jujuba colorida', isActive: true },
      { id: 'kiwi', name: 'KIWI', price: 0, description: 'Kiwi fatiado', isActive: true },
      { id: 'uva', name: 'UVA', price: 0, description: 'Uva fresca', isActive: true },
      { id: 'uva-passas', name: 'UVA PASSAS', price: 0, description: 'Uva passas', isActive: true }
    ]
  }
];

export const complementsFor5Mix: ComplementGroup[] = [
  {
    id: 'mix-5',
    name: '5 MIX * OPCIONAL (ATÉ 5 ITENS)',
    required: false,
    minItems: 0,
    maxItems: 5,
    complements: [
      { id: 'castanha-banda', name: 'CASTANHA EM BANDA', price: 0, description: 'Castanha em fatias', isActive: true },
      { id: 'cereja', name: 'CEREJA', price: 0, description: 'Cereja doce', isActive: true },
      { id: 'chocoball-mine', name: 'CHOCOBALL MINE', price: 0, description: 'Chocoball pequeno', isActive: true },
      { id: 'chocoball-power', name: 'CHOCOBALL POWER', price: 0, description: 'Chocoball grande', isActive: true },
      { id: 'creme-cookies-branco', name: 'CREME DE COOKIES BRANCO', price: 0, description: 'Creme de cookies branco', isActive: true },
      { id: 'chocolate-avela', name: 'CHOCOLATE COM AVELÃ (NUTELA)', price: 0, description: 'Chocolate com avelã', isActive: true },
      { id: 'cobertura-chocolate', name: 'COBERTURA DE CHOCOLATE', price: 0, description: 'Cobertura de chocolate', isActive: true },
      { id: 'cobertura-morango', name: 'COBERTURA DE MORANGO', price: 0, description: 'Cobertura de morango', isActive: true },
      { id: 'granola', name: 'GRANOLA', price: 0, description: 'Granola crocante', isActive: true },
      { id: 'granulado-chocolate', name: 'GRANULADO DE CHOCOLATE', price: 0, description: 'Granulado de chocolate', isActive: true },
      { id: 'leite-condensado', name: 'LEITE CONDENSADO', price: 0, description: 'Leite condensado', isActive: true },
      { id: 'morango', name: 'MORANGO', price: 0, description: 'Morango fresco', isActive: true },
      { id: 'pacoca', name: 'PAÇOCA', price: 0, description: 'Paçoca triturada', isActive: true },
      { id: 'marshmallows', name: 'MARSHMALLOWS', price: 0, description: 'Marshmallows macios', isActive: true },
      { id: 'mms', name: 'MMS', price: 0, description: 'Confetes coloridos', isActive: true },
      { id: 'jujuba', name: 'JUJUBA', price: 0, description: 'Jujuba colorida', isActive: true },
      { id: 'kiwi', name: 'KIWI', price: 0, description: 'Kiwi fatiado', isActive: true },
      { id: 'uva', name: 'UVA', price: 0, description: 'Uva fresca', isActive: true },
      { id: 'uva-passas', name: 'UVA PASSAS', price: 0, description: 'Uva passas', isActive: true }
    ]
  }
];

export const vitaminaComplementGroups: ComplementGroup[] = [
  {
    id: 'frutas-vitamina',
    name: 'FRUTAS PARA VITAMINA',
    required: true,
    minItems: 1,
    maxItems: 3,
    complements: [
      { id: 'banana', name: 'BANANA', price: 0, description: 'Banana madura', isActive: true },
      { id: 'morango', name: 'MORANGO', price: 0, description: 'Morango fresco', isActive: true },
      { id: 'manga', name: 'MANGA', price: 0, description: 'Manga doce', isActive: true },
      { id: 'abacaxi', name: 'ABACAXI', price: 0, description: 'Abacaxi tropical', isActive: true },
      { id: 'kiwi', name: 'KIWI', price: 0, description: 'Kiwi azedinho', isActive: true },
      { id: 'maracuja', name: 'MARACUJÁ', price: 0, description: 'Maracujá azedo', isActive: true }
    ]
  },
  {
    id: 'leite-vitamina',
    name: 'TIPO DE LEITE',
    required: true,
    minItems: 1,
    maxItems: 1,
    complements: [
      { id: 'leite-integral', name: 'LEITE INTEGRAL', price: 0, description: 'Leite integral cremoso', isActive: true },
      { id: 'leite-desnatado', name: 'LEITE DESNATADO', price: 0, description: 'Leite desnatado light', isActive: true },
      { id: 'leite-condensado', name: 'LEITE CONDENSADO', price: 0, description: 'Leite condensado doce', isActive: true }
    ]
  }
];

// Product data
export const products: Product[] = [
  {
    id: 'acai-300g',
    name: 'Açaí Premium 300g',
    category: 'acai',
    price: 15.90,
    description: 'Açaí premium tradicional de 300g com opções de personalização',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    complementGroups: complementsFor1Creme2Mix,
    isActive: true
  },
  {
    id: 'acai-500g',
    name: 'Açaí Premium 500g',
    category: 'acai',
    price: 22.90,
    description: 'Açaí premium tradicional de 500g com opções de personalização',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    complementGroups: complementsFor5Mix,
    isActive: true
  },
  {
    id: 'acai-700g',
    name: 'Açaí Premium 700g',
    category: 'acai',
    price: 29.90,
    description: 'Açaí premium tradicional de 700g com opções de personalização',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    complementGroups: complementsFor5Mix,
    isActive: true
  },
  {
    id: 'combo-casal-1kg',
    name: 'Combo Casal 1kg',
    category: 'combo',
    price: 45.90,
    originalPrice: 52.90,
    description: 'Açaí de 1kg perfeito para compartilhar com quem você ama',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    complementGroups: complementsFor5Mix,
    isActive: true
  },
  {
    id: 'milkshake-500ml',
    name: 'Milkshake de Açaí 500ml',
    category: 'milkshake',
    price: 18.90,
    description: 'Delicioso milkshake cremoso de açaí',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    complementGroups: complementsFor1Creme2Mix,
    isActive: true
  },
  {
    id: 'vitamina-acai-500ml',
    name: 'Vitamina de Açaí 500ml',
    category: 'vitamina',
    price: 16.90,
    description: 'Vitamina nutritiva de açaí com frutas',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400',
    complementGroups: vitaminaComplementGroups,
    isActive: true
  }
];