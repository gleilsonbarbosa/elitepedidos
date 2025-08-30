import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Save, Package, Image as ImageIcon, GripVertical, RefreshCw, Wrench, Bug, AlertCircle } from 'lucide-react';
import { usePDVProducts } from '../../hooks/usePDV';
import { useDeliveryProducts, DeliveryProduct } from '../../hooks/useDeliveryProducts';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useProductScheduling } from '../../hooks/useProductScheduling';
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
    resetForm();
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
      const filteredGroups = prev.complement_groups?.filter((_, index) => index !== groupIndex) || [];
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
          ? { ...group, options: [...group.options, newOption] }
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

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Produtos do Delivery ({filteredProducts.length})
          </h3>
          <p className="text-gray-600">
            Gerencie os produtos disponíveis para delivery
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductsPanel;