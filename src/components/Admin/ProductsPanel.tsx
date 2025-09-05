import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Save, Package, Image as ImageIcon, GripVertical, RefreshCw, Wrench, Bug, AlertCircle, Calendar, Eye, EyeOff, Settings } from 'lucide-react';
import { usePDVProducts } from '../../hooks/usePDV';
import { useDeliveryProducts, DeliveryProduct } from '../../hooks/useDeliveryProducts';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useProductScheduling } from '../../hooks/useProductScheduling';
import { standardComplementGroups } from '../../data/products';
import ImageUploadModal from './ImageUploadModal';
import ProductScheduleModal from './ProductScheduleModal';

interface ComplementOption {
  name: string;
  price: number;
  description: string;
  is_active?: boolean;
}

interface ComplementGroup {
  name: string;
  required: boolean;
  min_items: number;
  max_items: number;
  options: ComplementOption[];
}

interface ProductFormData {
  id?: string;
  name: string;
  category: string;
  price: number;
  original_price?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  price_per_gram?: number;
  has_complements: boolean;
  complement_groups?: ComplementGroup[];
  sizes?: any[];
}

const DEFAULT_COMPLEMENT_GROUPS: ComplementGroup[] = [
  {
    name: "TIPO DE AÇAÍ (ESCOLHA 1 ITEM)",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "AÇAÍ PREMIUM TRADICIONAL", price: 0, description: "Açaí tradicional premium" },
      { name: "AÇAÍ PREMIUM (0% AÇÚCAR - FIT)", price: 0, description: "Açaí sem açúcar, ideal para dieta" },
      { name: "AÇAÍ PREMIUM COM MORANGO", price: 0, description: "Açaí premium com sabor morango" }
    ]
  },
  {
    name: "COMO DESEJA A QUANTIDADE DE AÇAÍ?",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "MAIS AÇAÍ", price: 0, description: "Quantidade extra de açaí" },
      { name: "NÃO QUERO AÇAÍ", price: 0, description: "Sem açaí" },
      { name: "MENOS AÇAÍ", price: 0, description: "Quantidade reduzida de açaí" },
      { name: "QUANTIDADE NORMAL", price: 0, description: "Quantidade padrão de açaí" }
    ]
  },
  {
    name: "CREMES * OPCIONAL (ATÉ 2 ITEM)",
    required: false,
    min_items: 0,
    max_items: 2,
    options: [
      { name: "CREME DE CUPUAÇU", price: 0, description: "Creme cremoso de cupuaçu" },
      { name: "CREME DE MORANGO", price: 0, description: "Creme doce de morango" },
      { name: "CREME DE NINHO", price: 0, description: "Creme de leite ninho" },
      { name: "CREME DE NUTELA", price: 0, description: "Creme de nutella" },
      { name: "CREME DE MARACUJÁ", price: 0, description: "Creme azedinho de maracujá" },
      { name: "CREME DE PAÇOCA", price: 0, description: "Creme de paçoca" },
      { name: "CREME DE OVOMALTINE", price: 0, description: "Creme de ovomaltine" },
      { name: "CREME DE PISTACHE", price: 0, description: "Creme de pistache" }
    ].map(comp => ({ ...comp, is_active: true }))
  },
  {
    name: "3 ADICIONAIS * OPCIONAL (ATÉ 3 ITENS)",
    required: false,
    min_items: 0,
    max_items: 3,
    options: [
      { name: "CASTANHA EM BANDA", price: 0, description: "Castanha em fatias" },
      { name: "CEREJA", price: 0, description: "Cereja doce" },
      { name: "CHOCOBALL MINE", price: 0, description: "Chocoball pequeno" },
      { name: "CHOCOBALL POWER", price: 0, description: "Chocoball grande" },
      { name: "CREME DE COOKIES BRANCO", price: 0, description: "Creme de cookies branco" },
      { name: "CHOCOLATE COM AVELÃ (NUTELA)", price: 0, description: "Chocolate com avelã" },
      { name: "COBERTURA DE CHOCOLATE", price: 0, description: "Cobertura de chocolate" },
      { name: "COBERTURA DE MORANGO", price: 0, description: "Cobertura de morango" },
      { name: "COBERTURA FINE DENTADURA", price: 0, description: "Cobertura fine dentadura" },
      { name: "COBERTURA FINE BANANINHA", price: 0, description: "Cobertura fine bananinha" },
      { name: "COBERTURA FINE BEIJINHO", price: 0, description: "Cobertura fine beijinho" },
      { name: "GANACHE MEIO AMARGO", price: 0, description: "Ganache meio amargo" },
      { name: "GOTAS DE CHOCOLATE PRETO", price: 0, description: "Gotas de chocolate preto" },
      { name: "GRANULADO DE CHOCOLATE", price: 0, description: "Granulado de chocolate" },
      { name: "GRANOLA", price: 0, description: "Granola crocante" },
      { name: "JUJUBA", price: 0, description: "Jujuba colorida" },
      { name: "KIWI", price: 0, description: "Kiwi fatiado" },
      { name: "LEITE CONDENSADO", price: 0, description: "Leite condensado" },
      { name: "LEITE EM PÓ", price: 0, description: "Leite em pó" },
      { name: "MARSHMALLOWS", price: 0, description: "Marshmallows macios" },
      { name: "MMS", price: 0, description: "Confetes coloridos" },
      { name: "MORANGO", price: 0, description: "Morango fresco" },
      { name: "PAÇOCA", price: 0, description: "Paçoca triturada" },
      { name: "RECHEIO LEITINHO", price: 0, description: "Recheio de leitinho" },
      { name: "SUCRILHOS", price: 0, description: "Sucrilhos crocantes" },
      { name: "UVA", price: 0, description: "Uva fresca" },
      { name: "UVA PASSAS", price: 0, description: "Uva passas" },
      { name: "FLOCOS DE TAPIOCA CARAMELIZADO", price: 0, description: "Flocos de tapioca caramelizado" },
      { name: "CANUDOS", price: 0, description: "Canudos crocantes" },
      { name: "OVOMALTINE", price: 0, description: "Ovomaltine em pó" },
      { name: "FARINHA LÁCTEA", price: 0, description: "Farinha láctea" },
      { name: "ABACAXI AO VINHO", price: 0, description: "Abacaxi ao vinho" },
      { name: "AMENDOIM COLORIDO", price: 0, description: "Amendoim colorido" },
      { name: "FINE BEIJINHO", price: 0, description: "Fine beijinho" },
      { name: "FINE AMORA", price: 0, description: "Fine amora" },
      { name: "FINE DENTADURA", price: 0, description: "Fine dentadura" },
      { name: "NESTON EM FLOCOS", price: 0, description: "Neston em flocos" },
      { name: "RECHEIO FERRERO ROCHÊ", price: 0, description: "Recheio ferrero rochê" },
      { name: "AVEIA EM FLOCOS", price: 0, description: "Aveia em flocos" },
      { name: "GANACHE CHOCOLATE AO LEITE", price: 0, description: "Ganache chocolate ao leite" },
      { name: "CHOCOBOLL BOLA BRANCA", price: 0, description: "Chocoboll bola branca" },
      { name: "MORANGO EM CALDAS", price: 0, description: "Morango em caldas" },
      { name: "DOCE DE LEITE", price: 0, description: "Doce de leite" },
      { name: "CHOCOWAFER BRANCO", price: 0, description: "Chocowafer branco" },
      { name: "CREME DE COOKIES PRETO", price: 0, description: "Creme de cookies preto" },
      { name: "PASTA DE AMENDOIM", price: 0, description: "Pasta de amendoim" },
      { name: "RECHEIO DE LEITINHO", price: 0, description: "Recheio de leitinho" },
      { name: "BEIJINHO", price: 0, description: "Beijinho" },
      { name: "BRIGADEIRO", price: 0, description: "Brigadeiro" },
      { name: "PORÇÕES DE BROWNIE", price: 0, description: "Porções de brownie" },
      { name: "RASPAS DE CHOCOLATE", price: 0, description: "Raspas de chocolate" },
      { name: "RECHEIO DE FERREIRO ROCHÊ", price: 0, description: "Recheio de ferreiro rochê" }
    ].map(comp => ({ ...comp, is_active: true }))
  },
  {
    name: "10 ADICIONAIS * OPCIONAL (ATÉ 10 ITENS)",
    required: false,
    min_items: 0,
    max_items: 10,
    options: [
      { name: "AMENDOIN", price: 2, description: "Amendoim torrado" },
      { name: "CASTANHA EM BANDA", price: 3, description: "Castanha em fatias" },
      { name: "CEREJA", price: 2, description: "Cereja doce" },
      { name: "CHOCOBALL MINE", price: 2, description: "Chocoball pequeno" },
      { name: "CHOCOBALL POWER", price: 2, description: "Chocoball grande" },
      { name: "CREME DE COOKIES", price: 3, description: "Creme de cookies" },
      { name: "CHOCOLATE COM AVELÃ (NUTELA)", price: 3, description: "Chocolate com avelã" },
      { name: "COBERTURA DE CHOCOLATE", price: 2, description: "Cobertura de chocolate" },
      { name: "COBERTURA DE MORANGO", price: 2, description: "Cobertura de morango" },
      { name: "GANACHE MEIO AMARGO", price: 2, description: "Ganache meio amargo" },
      { name: "GRANOLA", price: 2, description: "Granola crocante" },
      { name: "GOTAS DE CHOCOLATE", price: 3, description: "Gotas de chocolate" },
      { name: "GRANULADO DE CHOCOLATE", price: 2, description: "Granulado de chocolate" },
      { name: "JUJUBA", price: 2, description: "Jujuba colorida" },
      { name: "KIWI", price: 3, description: "Kiwi fatiado" },
      { name: "LEITE CONDENSADO", price: 2, description: "Leite condensado" },
      { name: "LEITE EM PÓ", price: 3, description: "Leite em pó" },
      { name: "MARSHMALLOWS", price: 2, description: "Marshmallows macios" },
      { name: "MMS", price: 2, description: "Confetes coloridos" },
      { name: "MORANGO", price: 3, description: "Morango fresco" },
      { name: "PAÇOCA", price: 2, description: "Paçoca triturada" },
      { name: "RECHEIO DE NINHO", price: 2, description: "Recheio de ninho" },
      { name: "UVA", price: 2, description: "Uva fresca" },
      { name: "UVA PASSAS", price: 2, description: "Uva passas" },
      { name: "COBERTURA FINE DENTADURA", price: 2, description: "Cobertura fine dentadura" },
      { name: "COBERTURA FINE BEIJINHO", price: 2, description: "Cobertura fine beijinho" },
      { name: "COBERTURA FINE BANANINHA", price: 2, description: "Cobertura fine bananinha" }
    ].map(comp => ({ ...comp, is_active: true }))
  },
  {
    name: "VOCÊ PREFERE OS OPCIONAIS SEPARADOS OU JUNTO COM O AÇAÍ?",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "SIM, QUERO TUDO JUNTO", price: 0, description: "Misturar tudo com o açaí" },
      { name: "NÃO, QUERO SEPARADOS", price: 0, description: "Servir os complementos separadamente" }
    ]
  },
  {
    name: "CONSUMA MENOS DESCARTÁVEIS.",
    required: true,
    min_items: 1,
    max_items: 1,
    options: [
      { name: "SIM, VOU QUERER A COLHER", price: 0, description: "Incluir colher descartável" },
      { name: "NÃO QUERO COLHER, VOU AJUDAR AO MEIO AMBIENTE", price: 0, description: "Sem colher, ajudando o meio ambiente" }
    ]
  }
];

const ProductsPanel: React.FC = () => {
  const { products: pdvProducts, loading: productsLoading, createProduct, updateProduct, deleteProduct, searchProducts } = usePDVProducts();
  const { products: deliveryProducts, loading, createProduct: createDeliveryProduct, updateProduct: updateDeliveryProduct, deleteProduct: deleteDeliveryProduct } = useDeliveryProducts();
  const { uploadImage, uploading, getProductImage } = useImageUpload();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showComplementToggleDialog, setShowComplementToggleDialog] = useState(false);
  const [complementToggleData, setComplementToggleData] = useState<{
    productId: string;
    groupIndex: number;
    complementIndex: number;
    complementName: string;
    newActiveState: boolean;
  } | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'acai',
    price: 0,
    description: '',
    is_active: true,
    is_weighable: false,
    has_complements: false,
    complement_groups: []
  });
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<{ groupIndex: number; optionIndex: number } | null>(null);
  const { error, debugProduct, fixProduct } = useProductScheduling();
  const [selectedProductForSchedule, setSelectedProductForSchedule] = useState<any | null>(null);
  
  const { getProductSchedule, saveProductSchedule } = useProductScheduling();

  const filteredProducts = React.useMemo(() => {
    let result = searchTerm 
      ? deliveryProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : deliveryProducts;
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [deliveryProducts, searchTerm, selectedCategory]);

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  // Carregar imagens dos produtos
  useEffect(() => {
    const loadProductImages = async () => {
      // Skip image loading if Supabase is not configured
      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - pulando carregamento de imagens');
        return;
      }

      try {
        // Skip if Supabase is not configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl.includes('placeholder') || 
            supabaseKey.includes('placeholder')) {
          console.warn('⚠️ Supabase não configurado - usando imagens padrão dos produtos');
          return;
        }

        // Verificar se há produtos para carregar
        if (filteredProducts.length === 0) {
          return;
        }

        const images: Record<string, string> = {};
        
        // Process products with timeout and error handling for each
        const imagePromises = filteredProducts.map(async (product) => {
          try {
            // Set timeout for each individual request
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            );
            
            const imagePromise = getProductImage(product.id);
            
            const savedImage = await Promise.race([imagePromise, timeoutPromise]) as string | null;
            
            if (savedImage) {
              images[product.id] = savedImage;
            }
          } catch (error) {
            // Handle network errors gracefully for individual products
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
              console.warn(`⚠️ Erro de rede ao carregar imagem do produto ${product.name} - usando fallback`);
            } else if (error instanceof Error && error.message === 'Timeout') {
              console.warn(`⏰ Timeout ao carregar imagem do produto ${product.name}`);
            } else {
              console.warn(`⚠️ Erro ao carregar imagem do produto ${product.name}:`, error);
            }
            // Don't add to images object, will use product's default image
          }
        });

        // Wait for all image loading attempts to complete
        await Promise.allSettled(imagePromises);
        
        setProductImages(images);
      } catch (error) {
        // Handle any other unexpected errors
        console.error('❌ Erro geral ao carregar imagens dos produtos:', error);
        return;
      }

      // Skip image loading if Supabase is not configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - pulando carregamento de imagens');
        return;
      }

      // Skip image loading if no products to load
      if (filteredProducts.length === 0) {
        return;
      }

      // Skip image loading if there are no products
      if (deliveryProducts.length === 0) return;
      
      const supabaseUrl2 = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey2 = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Check if Supabase is properly configured
      if (!supabaseUrl2 || !supabaseKey2 ||
          supabaseUrl2.includes('placeholder') || 
          supabaseKey2.includes('placeholder') ||
          supabaseUrl2 === 'your_supabase_url_here' ||
          supabaseKey2 === 'your_supabase_anon_key_here') {
        console.warn('⚠️ Supabase not configured, skipping image loading');
        return;
      }

     try {
       console.log('🔄 Carregando imagens dos produtos...');
       const images: Record<string, string> = {};
       let successCount = 0;
       let errorCount = 0;
       
       // Verificar se Supabase está configurado
       const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
       const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
       
       if (!supabaseUrl || !supabaseKey || 
           supabaseUrl.includes('placeholder') || 
           supabaseKey.includes('placeholder')) {
         console.warn('⚠️ Supabase não configurado - imagens não disponíveis');
         return;
       }

       const imagePromises = deliveryProducts.map(async (product) => {
         try {
           const imageUrl = await getProductImage(product.id);
           return { productId: product.id, imageUrl };
         } catch (error) {
           console.warn(`Erro ao carregar imagem do produto ${product.id}:`, error);
           return { productId: product.id, imageUrl: null };
         }
       });

       const results = await Promise.all(imagePromises);
       const imageMap: Record<string, string> = {};
       
       results.forEach(({ productId, imageUrl }) => {
         if (imageUrl) {
           imageMap[productId] = imageUrl;
         }
       });
       
       setProductImages(imageMap);
     } catch (error) {
       if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
         console.warn('⚠️ Erro de conectividade - trabalhando sem imagens');
       } else {
         console.error('Erro ao carregar imagens dos produtos:', error);
       }
     }
    };

    // Adicionar delay para evitar múltiplas chamadas simultâneas
    const timeoutId = setTimeout(() => {
      loadProductImages();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filteredProducts, getProductImage, supabaseConfigured]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'acai',
      price: 0,
      description: '',
      is_active: true,
      is_weighable: false,
      has_complements: false,
      complement_groups: []
    });
    setEditingProduct(null);
  };

  const handleCreate = () => {
    // Usar grupos de complementos padrão para novos produtos
    setFormData({
      name: '',
      category: 'acai',
      price: 0,
      original_price: undefined,
      description: '',
      image_url: '',
      is_active: true,
      is_weighable: false,
      price_per_gram: undefined,
      has_complements: true,
      complement_groups: DEFAULT_COMPLEMENT_GROUPS.map(group => ({
        name: group.name,
        required: group.required,
        min_items: group.min_items,
        max_items: group.max_items,
        options: group.options.map(option => ({
          name: option.name,
          price: option.price,
          description: option.description,
          is_active: true
        }))
      }))
    });
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: any) => {
    console.log('📝 Iniciando edição do produto:', {
      productName: product.name,
      productId: product.id,
      hasComplements: product.has_complements,
      complementGroupsFromDB: product.complement_groups
    });
    
    console.log('📝 Editando produto:', {
      id: product.id,
      name: product.name,
      has_complements: product.has_complements || false,
      complement_groups: product.complement_groups,
      complement_groups_type: typeof product.complement_groups,
      complement_groups_length: Array.isArray(product.complement_groups) ? product.complement_groups.length : 'não é array'
    });
    
    // Processar complement_groups corretamente
    let complementGroups: ComplementGroup[] = [];
    let hasComplements = false;
    
    if (product.complement_groups) {
      try {
        if (Array.isArray(product.complement_groups)) {
          complementGroups = product.complement_groups.map((group: any) => ({
            ...group,
            options: Array.isArray(group.options) 
              ? group.options.map((option: any) => ({
                  ...option,
                  is_active: option.is_active !== false
                }))
              : Array.isArray(group.complements) 
                ? group.complements.map((comp: any) => ({
                    name: comp.name,
                    price: comp.price || 0,
                    description: comp.description || '',
                    is_active: comp.isActive !== false
                  }))
                : []
          }));
          hasComplements = true;
        }
      } catch (error) {
        console.error('❌ Erro ao processar complement_groups:', error);
        complementGroups = [];
        hasComplements = false;
      }
    }
    
    console.log('✅ Grupos de complementos processados:', {
      hasComplements,
      groupsCount: complementGroups.length,
      groups: complementGroups.map(g => ({ name: g.name, optionsCount: g.options.length }))
    });
    
    const productData: ProductFormData = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image_url: productImages[product.id] || product.image_url,
      original_price: product.original_price,
      description: product.description,
      is_active: product.is_active,
      is_weighable: product.is_weighable,
      has_complements: hasComplements,
      complement_groups: complementGroups
    };
    
    console.log('✅ Dados do produto mapeados para edição:', {
      hasComplements: productData.has_complements,
      complementGroupsCount: productData.complement_groups?.length || 0,
      groups: productData.complement_groups?.map(g => ({ name: g.name, optionsCount: g.options.length }))
    });
    
    setFormData(productData);
    setEditingProduct(productData);
    setShowModal(true);
  };

  const handleRefreshProducts = async () => {
    try {
      console.log('🔄 Recarregando produtos...');
      // Force refresh from database
      window.location.reload();
    } catch (error) {
      console.error('Erro ao recarregar produtos:', error);
    }
  };

  const handleComplementToggle = (productId: string, groupIndex: number, complementIndex: number, complementName: string, newActiveState: boolean) => {
    setComplementToggleData({
      productId,
      groupIndex,
      complementIndex,
      complementName,
      newActiveState
    });
    setShowComplementToggleDialog(true);
  };

  const applyComplementToggle = async (applyToAll: boolean) => {
    if (!complementToggleData) return;

    try {
      const { productId, groupIndex, complementIndex, complementName, newActiveState } = complementToggleData;

      if (applyToAll) {
        // Apply to all products with the same complement name
        console.log(`🔄 ${newActiveState ? 'Ativando' : 'Desativando'} complemento "${complementName}" em todos os produtos...`);
        
        let updatedCount = 0;
        
        for (const product of deliveryProducts) {
          if (!product.complement_groups || !Array.isArray(product.complement_groups)) continue;
          
          let productUpdated = false;
          const updatedGroups = product.complement_groups.map(group => {
            if (!Array.isArray(group.options)) return group;
            
            const updatedOptions = group.options.map(option => {
              if (option.name === complementName) {
                productUpdated = true;
                return { ...option, is_active: newActiveState };
              }
              return option;
            });
            
            return { ...group, options: updatedOptions };
          });
          
          if (productUpdated) {
            await updateDeliveryProduct(product.id, { complement_groups: updatedGroups });
            updatedCount++;
          }
        }
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = `fixed top-4 right-4 ${newActiveState ? 'bg-green-500' : 'bg-orange-500'} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2`;
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Complemento "${complementName}" ${newActiveState ? 'ativado' : 'desativado'} em ${updatedCount} produto(s)!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 4000);
        
      } else {
        // Apply only to current product
        const product = deliveryProducts.find(p => p.id === productId);
        if (!product || !product.complement_groups) return;
        
        const updatedGroups = [...product.complement_groups];
        if (updatedGroups[groupIndex] && updatedGroups[groupIndex].options[complementIndex]) {
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            options: updatedGroups[groupIndex].options.map((option, idx) => 
              idx === complementIndex ? { ...option, is_active: newActiveState } : option
            )
          };
          
          await updateDeliveryProduct(productId, { complement_groups: updatedGroups });
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = `fixed top-4 right-4 ${newActiveState ? 'bg-green-500' : 'bg-orange-500'} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2`;
          successMessage.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Complemento "${complementName}" ${newActiveState ? 'ativado' : 'desativado'} apenas neste produto!
          `;
          document.body.appendChild(successMessage);
          
          setTimeout(() => {
            if (document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
          }, 3000);
        }
      }
      
      setShowComplementToggleDialog(false);
      setComplementToggleData(null);
      
    } catch (error) {
      console.error('Erro ao alterar status do complemento:', error);
      alert('Erro ao alterar status do complemento. Tente novamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data instead of editingProduct
    if (!formData.name.trim() || !formData.category) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    console.log('🚀 Iniciando salvamento do produto:', {
      isEditing: !!formData.id,
      formData,
      productId: formData.id
    });

    try {
      console.log('💾 Iniciando salvamento:', {
        productId: formData.id,
        productName: formData.name,
        isCreating: !formData.id,
        updates: formData
      });
      
      let savedProduct;
      
      if (!formData.id) {
        // Creating new product
        const { id, ...createData } = formData;
        savedProduct = await createDeliveryProduct(createData);
        console.log('✅ Novo produto criado:', savedProduct);
      } else {
        // Updating existing product
        const { id, ...updateData } = formData;
        savedProduct = await updateDeliveryProduct(formData.id, updateData);
        console.log('✅ Produto atualizado:', savedProduct);
      }
      
      setShowModal(false);
      resetForm();
      
      // Show success message
      alert(`Produto ${formData.id ? 'atualizado' : 'criado'} com sucesso!`);
      
      // Refresh products list
      
      // Forçar recarregamento dos produtos após salvar
      console.log('✅ Produto salvo, recarregando lista...');
      try {
        // Tentar recarregar produtos do delivery se o hook estiver disponível
        const deliveryRefresh = (window as any).refreshDeliveryProducts;
        if (deliveryRefresh) {
          console.log('🔄 Atualizando produtos do delivery após alteração...');
          await deliveryRefresh();
          console.log('✅ Produtos do delivery atualizados');
        }
        
        // Mostrar feedback de sucesso
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Produto ${formData.id ? 'atualizado' : 'criado'} com sucesso!
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } catch (error) {
        console.log('Delivery refresh não disponível:', error);
      }
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);

      // Mostrar erro detalhado
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar produto: ${errorMessage}\n\nDetalhes: ${JSON.stringify(error)}`);
      
      // Log completo do erro
      console.error('Erro completo:', {
        error,
        formData,
        productId: formData.id
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      console.log('🚀 Iniciando upload de imagem...');
      const uploadedImage = await uploadImage(file);
      if (uploadedImage) {
        setFormData(prev => ({ ...prev, image_url: uploadedImage }));
        console.log('✅ Imagem carregada com sucesso:', uploadedImage);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    setShowImageModal(false);
  };

  const handleDelete = async (product: any) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      return;
    }

    try {
      await deleteDeliveryProduct(product.id);
      
      // Mostrar feedback de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Produto excluído com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Tente novamente.');
    }
  };

  const handleSaveSchedule = async (productId: string, schedule: any) => {
    try {
      await saveProductSchedule(productId, schedule);
      alert('Horário de funcionamento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      alert('Erro ao salvar horário. Tente novamente.');
    }
  };

  const handleGroupDragStart = (e: React.DragEvent, groupIndex: number) => {
    setDraggedGroupIndex(groupIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedGroupIndex === null || draggedGroupIndex === targetIndex) {
      setDraggedGroupIndex(null);
      return;
    }

    const newGroups = [...(formData.complement_groups || [])];
    const draggedGroup = newGroups[draggedGroupIndex];
    
    newGroups.splice(draggedGroupIndex, 1);
    newGroups.splice(targetIndex, 0, draggedGroup);
    
    setFormData(prev => ({
      ...prev,
      complement_groups: newGroups
    }));
    
    setDraggedGroupIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleOptionDragStart = (e: React.DragEvent, groupIndex: number, optionIndex: number) => {
    setDraggedOptionIndex({ groupIndex, optionIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleOptionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.stopPropagation();
  };

  const handleOptionDrop = (e: React.DragEvent, targetGroupIndex: number, targetOptionIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedOptionIndex || 
        (draggedOptionIndex.groupIndex === targetGroupIndex && draggedOptionIndex.optionIndex === targetOptionIndex)) {
      setDraggedOptionIndex(null);
      return;
    }

    const newGroups = [...(formData.complement_groups || [])];
    const sourceGroup = newGroups[draggedOptionIndex.groupIndex];
    const targetGroup = newGroups[targetGroupIndex];
    
    // Se for o mesmo grupo, reordenar dentro do grupo
    if (draggedOptionIndex.groupIndex === targetGroupIndex) {
      const draggedOption = sourceGroup.options[draggedOptionIndex.optionIndex];
      sourceGroup.options.splice(draggedOptionIndex.optionIndex, 1);
      
      const insertIndex = draggedOptionIndex.optionIndex < targetOptionIndex ? targetOptionIndex - 1 : targetOptionIndex;
      sourceGroup.options.splice(insertIndex, 0, draggedOption);
    } else {
      // Mover entre grupos diferentes
      const draggedOption = sourceGroup.options[draggedOptionIndex.optionIndex];
      sourceGroup.options.splice(draggedOptionIndex.optionIndex, 1);
      targetGroup.options.splice(targetOptionIndex, 0, draggedOption);
    }
    
    setFormData(prev => ({
      ...prev,
      complement_groups: newGroups
    }));
    
    setDraggedOptionIndex(null);
  };

  const addComplementGroup = () => {
    console.log('➕ Adicionando novo grupo de complementos...');
    const newGroup: ComplementGroup = {
      name: "Novo Grupo",
      required: false,
      min_items: 0,
      max_items: 1,
      options: []
    };
    
    setFormData(prev => {
      const newComplementGroups = [...(prev.complement_groups || []), newGroup];
      const updatedData = {
        ...prev,
        complement_groups: newComplementGroups,
        has_complements: true
      };
      
      console.log('✅ Novo grupo adicionado:', {
        totalGroups: updatedData.complement_groups.length,
        newGroupName: newGroup.name,
        hasComplements: updatedData.has_complements
      });
      
      return updatedData;
    });
  };

  const updateComplementGroup = (groupIndex: number, updates: Partial<ComplementGroup>) => {
    console.log('✏️ Atualizando grupo:', { groupIndex, updates });
    
    setFormData(prev => {
      const updatedGroups = prev.complement_groups?.map((group, index) =>
        index === groupIndex ? { ...group, ...updates } : group
      ) || [];
      
      const updatedData = {
        ...prev,
        complement_groups: updatedGroups
      };
      
      console.log('✅ Grupo atualizado:', {
        groupIndex,
        updates,
        totalGroups: updatedData.complement_groups.length
      });
      
      return updatedData;
    });
  };

  const removeComplementGroup = (groupIndex: number) => {
    console.log('🗑️ Removendo grupo:', { groupIndex });
    
    setFormData(prev => {
      if (!prev.complement_groups || !Array.isArray(prev.complement_groups)) {
        console.warn('⚠️ complement_groups não é um array válido');
        return prev;
      }
      
      const filteredGroups = prev.complement_groups.filter((_, index) => index !== groupIndex);
      const updatedData = {
        ...prev,
        complement_groups: filteredGroups,
        has_complements: filteredGroups.length > 0
      };
      
      console.log('✅ Grupo removido:', {
        removedGroupIndex: groupIndex,
        remainingGroups: updatedData.complement_groups.length,
        hasComplements: updatedData.has_complements
      });
      
      return updatedData;
    });
  };


  const addComplementOption = (groupIndex: number) => {
    const newOption: ComplementOption = {
      name: "",
      price: 0,
      description: "",
      is_active: true
    };
    
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.map((group, index) =>
        index === groupIndex 
          ? { ...group, options: [...(group.options || []), newOption] }
          : group
      ) || []
    }));
  };

  const updateComplementOption = (groupIndex: number, optionIndex: number, updates: Partial<ComplementOption>) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.map((group, gIndex) =>
        gIndex === groupIndex
          ? {
              ...group,
              options: group.options.map((option, oIndex) =>
                oIndex === optionIndex ? { ...option, ...updates } : option
              )
            }
          : group
      ) || []
    }));
  };

  const removeComplementOption = (groupIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: Array.isArray(prev.complement_groups) ? prev.complement_groups.map((group, gIndex) =>
        gIndex === groupIndex
          ? { ...group, options: group.options.filter((_, oIndex) => oIndex !== optionIndex) }
          : group
      ) : []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Supabase Não Configurado</h3>
              <p className="text-yellow-700 text-sm">
                Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acessar as funcionalidades completas.
                Algumas funcionalidades como upload de imagens estarão limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-purple-600" />
            Gerenciar Produtos do Delivery
          </h2>
          <p className="text-gray-600">Configure produtos, preços, complementos e disponibilidade</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshProducts}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Package size={16} />
            Atualizar
          </button>
          <button
            onClick={handleCreate}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Package size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="acai">Açaí</option>
              <option value="combo">Combos</option>
              <option value="milkshake">Milkshakes</option>
              <option value="vitamina">Vitaminas</option>
              <option value="sorvetes">Sorvetes</option>
              <option value="bebidas">Bebidas</option>
              <option value="complementos">Complementos</option>
              <option value="sobremesas">Sobremesas</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Produtos do Delivery ({filteredProducts.length})
          </h3>
          <p className="text-gray-600">
            Gerencie os produtos disponíveis para delivery
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Nenhum produto encontrado'
                : 'Nenhum produto cadastrado'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Novo Produto" para adicionar o primeiro produto'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={handleCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Criar Primeiro Produto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={productImages[product.id] || product.image_url || 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-1">
                      Categoria: {product.category}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(product.price)}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(product.original_price)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        {product.is_weighable && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Pesável
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProductForSchedule(product);
                          setShowScheduleModal(true);
                        }}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        title="Programar disponibilidade"
                      >
                        <Calendar size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Açaí 500ml"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="acai">Açaí</option>
                    <option value="combo">Combos</option>
                    <option value="milkshake">Milkshakes</option>
                    <option value="vitamina">Vitaminas</option>
                    <option value="sorvetes">Sorvetes</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="complementos">Complementos</option>
                    <option value="sobremesas">Sobremesas</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Original (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || undefined }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para produtos em promoção
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                  placeholder="Descrição do produto..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={16} />
                    Galeria
                  </button>
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Produto ativo
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_weighable}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_weighable: e.target.checked }))}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Produto pesável
                      </span>
                    </label>
                  </div>

                  {formData.is_weighable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço por grama (R$)
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        min="0"
                        value={formData.price_per_gram || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_gram: parseFloat(e.target.value) || undefined }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.04499"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.has_complements}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_complements: e.target.checked }))}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Produto tem complementos
                    </span>
                  </label>

                  {formData.has_complements && (
                    <button
                      type="button"
                      onClick={addComplementGroup}
                      className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar Grupo de Complementos
                    </button>
                  )}
                </div>
              </div>

              {/* Complement Groups */}
              {formData.has_complements && formData.complement_groups && formData.complement_groups.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-800">Grupos de Complementos</h4>
                    <button
                      type="button"
                      onClick={addComplementGroup}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Novo Grupo
                    </button>
                  </div>
                  {formData.complement_groups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800">Grupo {groupIndex + 1}</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {(group.options || []).filter(c => c.is_active !== false).length} ativo(s)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeComplementGroup(groupIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Grupo
                          </label>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => updateComplementGroup(groupIndex, { name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Cremes"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mín
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={group.min_items}
                              onChange={(e) => updateComplementGroup(groupIndex, { min_items: parseInt(e.target.value) || 0 })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Máx
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={group.max_items}
                              onChange={(e) => updateComplementGroup(groupIndex, { max_items: parseInt(e.target.value) || 1 })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={group.required}
                                onChange={(e) => updateComplementGroup(groupIndex, { required: e.target.checked })}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-xs text-gray-700">Obrigatório</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Complement Options */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-medium text-gray-700">Opções ({(group.options || []).length})</h6>
                          <button
                            type="button"
                            onClick={() => addComplementOption(groupIndex)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                          >
                            <Plus size={12} />
                            Adicionar
                          </button>
                        </div>

                        {(group.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className={`border rounded-lg p-3 transition-all ${
                            (option.is_active === false)
                              ? 'bg-red-50 border-red-200 opacity-60'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={option.name}
                                onChange={(e) => updateComplementOption(groupIndex, optionIndex, { name: e.target.value })}
                                className="flex-2 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Nome do complemento"
                              />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={option.price}
                                onChange={(e) => updateComplementOption(groupIndex, optionIndex, { price: parseFloat(e.target.value) || 0 })}
                                className="w-20 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="0.00"
                              />
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-800">
                                    {option.name}
                                  </span>
                                  {option.price > 0 && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                      +{new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(option.price)}
                                    </span>
                                  )}
                                  {(option.is_active === false) && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                      INATIVO
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleComplementToggle(
                                    formData.id || '',
                                    groupIndex,
                                    optionIndex,
                                    option.name,
                                    !(option.is_active !== false)
                                  )}
                                  className={`p-1 rounded-full transition-colors border-2 ${
                                    (option.is_active !== false)
                                      ? 'text-green-600 hover:bg-green-100'
                                      : 'text-red-600 hover:bg-red-100 bg-red-50 border-red-200'
                                  }`}
                                  title={
                                    (option.is_active !== false)
                                      ? 'Clique para desativar este complemento'
                                      : 'Clique para ativar este complemento'
                                  }
                                >
                                  {(option.is_active !== false) ? (
                                    <Eye size={16} />
                                  ) : (
                                    <EyeOff size={16} />
                                  )}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeComplementOption(groupIndex, optionIndex)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || !formData.category || formData.price <= 0}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onSelectImage={handleImageSelect}
          currentImage={formData.image_url}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedProductForSchedule && (
        <ProductScheduleModal
          product={selectedProductForSchedule}
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedProductForSchedule(null);
          }}
          onSave={handleSaveSchedule}
          currentSchedule={getProductSchedule(selectedProductForSchedule.id)}
        />
      )}

      {/* Complement Toggle Confirmation Dialog */}
      {showComplementToggleDialog && complementToggleData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {complementToggleData.newActiveState ? '✅ Ativar' : '❌ Desativar'} Complemento
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                complementToggleData.newActiveState 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <p className={`font-medium ${
                  complementToggleData.newActiveState ? 'text-green-800' : 'text-orange-800'
                }`}>
                  Complemento: "{complementToggleData.complementName}"
                </p>
                <p className={`text-sm mt-1 ${
                  complementToggleData.newActiveState ? 'text-green-700' : 'text-orange-700'
                }`}>
                  Você deseja {complementToggleData.newActiveState ? 'ativar' : 'desativar'} este complemento em:
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => applyComplementToggle(false)}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">❌ NÃO - Apenas este produto</p>
                      <p className="text-sm text-blue-700">
                        {complementToggleData.newActiveState ? 'Ativar' : 'Desativar'} apenas neste produto específico
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => applyComplementToggle(true)}
                  className={`w-full p-4 border-2 rounded-lg hover:bg-opacity-50 transition-colors text-left ${
                    complementToggleData.newActiveState 
                      ? 'border-green-200 hover:bg-green-50' 
                      : 'border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      complementToggleData.newActiveState ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        complementToggleData.newActiveState ? 'text-green-600' : 'text-orange-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-medium ${
                        complementToggleData.newActiveState ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        ✅ SIM - Todos os produtos
                      </p>
                      <p className={`text-sm ${
                        complementToggleData.newActiveState ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {complementToggleData.newActiveState ? 'Ativar' : 'Desativar'} em TODOS os produtos que tenham "{complementToggleData.complementName}"
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className={`p-3 rounded-lg ${
                complementToggleData.newActiveState 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  <svg className={`w-4 h-4 mt-0.5 ${
                    complementToggleData.newActiveState ? 'text-yellow-600' : 'text-red-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${
                      complementToggleData.newActiveState ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      ⚠️ Atenção
                    </p>
                    <p className={`text-xs ${
                      complementToggleData.newActiveState ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {complementToggleData.newActiveState 
                        ? 'Esta ação ativará o complemento em todos os produtos que o possuem.'
                        : 'Esta ação desativará o complemento em todos os produtos que o possuem.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowComplementToggleDialog(false);
                  setComplementToggleData(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;