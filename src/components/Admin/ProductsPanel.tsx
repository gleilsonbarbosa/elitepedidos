import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Save, Package, Image as ImageIcon, GripVertical } from 'lucide-react';
import { usePDVProducts } from '../../hooks/usePDV';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
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

  // Carregar imagens dos produtos
  useEffect(() => {
    const loadProductImages = async () => {
      // Skip image loading if there are no products
      if (deliveryProducts.length === 0) return;
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Check if Supabase is properly configured
      if (!supabaseUrl || !supabaseKey ||
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder') ||
          supabaseUrl === 'your_supabase_url_here' ||
          supabaseKey === 'your_supabase_anon_key_here') {
        console.warn('⚠️ Supabase not configured, skipping image loading');
        return;
      }

     try {
       console.log('🔄 Carregando imagens dos produtos...');
       const images: Record<string, string> = {};
       let successCount = 0;
       let errorCount = 0;
       
       for (const product of deliveryProducts) {
         try {
           const savedImage = await getProductImage(product.id);
           if (savedImage) {
             images[product.id] = savedImage;
             successCount++;
             console.log(`✅ Imagem carregada para produto ${product.name}`);
           }
         } catch (error) {
           errorCount++;
           // Handle network errors gracefully
           if (error instanceof TypeError && error.message === 'Failed to fetch') {
             console.warn(`⚠️ Network error loading image for ${product.name}, using fallback`);
           } else {
             console.warn(`⚠️ Error loading image for ${product.name}:`, error);
           }
           // Continue without the image - don't break the component
         }
       }
       
       setProductImages(images);
       if (successCount > 0 || errorCount > 0) {
         console.log(`📊 Carregamento de imagens concluído: ${successCount} sucessos, ${errorCount} erros`);
       }
     } catch (error) {
       console.error('Erro geral no carregamento de imagens:', error);
     }
    };

    // Only load images if we have products
    loadProductImages();
  }, [deliveryProducts, getProductImage]);

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
      price_per_gram: product.price_per_gram,
      has_complements: product.has_complements,
      complement_groups: Array.isArray(product.complement_groups) 
        ? product.complement_groups.map(group => ({
            ...group,
            options: Array.isArray(group.options) ? group.options : []
          }))
        : []
    };
    
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
    
    console.log('🚀 Iniciando salvamento do produto:', {
      editingProduct: !!editingProduct,
      formData,
      productId: editingProduct?.id
    });

    // Validate that we have a valid product ID for updates
    if (editingProduct && (!editingProduct.id || editingProduct.id.startsWith('temp-'))) {
      alert('Erro: ID do produto inválido. Tente recarregar a página e criar o produto novamente.');
      setShowModal(false);
      return;
    }
    
    try {
      let savedProduct;
      
      if (editingProduct) {
        await updateProduct(editingProduct.id!, formData);
      } else {
        const newProduct = await createProduct(formData);
        setEditingProduct(newProduct);
      }
      setShowModal(false);
      resetForm();
      
      // Show success message
      alert(`Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`);
      
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
          Produto excluído com sucesso!
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
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);

      // Mostrar erro detalhado
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar produto: ${errorMessage}\n\nDetalhes: ${JSON.stringify(error)}`);
      
      // Log completo do erro
      console.error('Erro completo:', {
        error,
        formData,
        editingProduct
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
    const newGroup: ComplementGroup = {
      name: "Novo Grupo",
      required: false,
      min_items: 0,
      max_items: 1,
      options: []
    };
    
    setFormData(prev => ({
      ...prev,
      complement_groups: [...(prev.complement_groups || []), newGroup]
    }));
  };

  const updateComplementGroup = (groupIndex: number, updates: Partial<ComplementGroup>) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.map((group, index) =>
        index === groupIndex ? { ...group, ...updates } : group
      ) || []
    }));
  };

  const removeComplementGroup = (groupIndex: number) => {
    setFormData(prev => ({
      ...prev,
      complement_groups: prev.complement_groups?.filter((_, index) => index !== groupIndex) || []
    }));
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
          <p className="text-gray-600 text-sm">
            Gerencie todos os produtos disponíveis no sistema de delivery
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
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
            <button
              onClick={handleCreate}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Criar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Produto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Preço</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Programação</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {productImages[product.id] ? (
                            <img 
                              src={productImages[product.id]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-semibold text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(product.price)}
                        </div>
                        {product.original_price && product.original_price > product.price && (
                          <div className="text-sm text-gray-500 line-through">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(product.original_price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getProductSchedule(product.id)?.enabled ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Programado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Sempre
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedProductForSchedule(product);
                            setShowScheduleModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Configurar
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar produto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir produto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="acai">Açaí</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="lanches">Lanches</option>
                      <option value="sobremesas">Sobremesas</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Original (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.original_price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || undefined }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Imagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem do Produto
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {formData.image_url ? 'Alterar Imagem' : 'Adicionar Imagem'}
                    </button>
                  </div>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Produto Ativo</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_weighable}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_weighable: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Produto Pesável</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_complements}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_complements: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Tem Complementos</span>
                  </label>
                </div>

                {formData.is_weighable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço por Grama (R$)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.price_per_gram || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_per_gram: parseFloat(e.target.value) || undefined }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Complementos */}
                <div className={`transition-all duration-300 ${formData.has_complements ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Grupos de Complementos</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, complement_groups: DEFAULT_COMPLEMENT_GROUPS }))}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                      >
                        <Package className="w-4 h-4" />
                        Aplicar Grupos Padrão
                      </button>
                      <button
                        type="button"
                        onClick={addComplementGroup}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Grupo
                      </button>
                    </div>
                  </div>

                  {formData.complement_groups && formData.complement_groups.length > 0 ? (
                    <div className="space-y-6">
                      {formData.complement_groups.map((group, groupIndex) => (
                        <div 
                          key={groupIndex} 
                          className={`border rounded-lg p-4 bg-gray-50 transition-all ${
                            draggedGroupIndex === groupIndex ? 'opacity-50 scale-95' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleGroupDragStart(e, groupIndex)}
                          onDragOver={handleGroupDragOver}
                          onDrop={(e) => handleGroupDrop(e, groupIndex)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <div className="cursor-move text-gray-400 hover:text-gray-600">
                                <GripVertical size={16} />
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                Grupo {groupIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Nome do Grupo
                                </label>
                                <input
                                  type="text"
                                  value={group.name}
                                  onChange={(e) => updateComplementGroup(groupIndex, { name: e.target.value })}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mín. Itens
                                  </label>
                                  <input
                                    type="number"
                                    value={group.min_items}
                                    onChange={(e) => updateComplementGroup(groupIndex, { min_items: parseInt(e.target.value) || 0 })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Máx. Itens
                                  </label>
                                  <input
                                    type="number"
                                    value={group.max_items}
                                    onChange={(e) => updateComplementGroup(groupIndex, { max_items: parseInt(e.target.value) || 1 })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={group.required}
                                    onChange={(e) => updateComplementGroup(groupIndex, { required: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Obrigatório
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeComplementGroup(groupIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Complementos */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium text-sm">
                                Complementos ({group.options.length})
                              </h5>
                              <button
                                type="button"
                                onClick={() => addComplementOption(groupIndex)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Adicionar Complemento
                              </button>
                            </div>

                            {group.options.length > 0 && (
                              <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-700 bg-gray-100 p-2 rounded">
                                <div>Ordem</div>
                                <div>Nome</div>
                                <div>Preço (R$)</div>
                                <div>Descrição</div>
                                <div>Status</div>
                                <div>Ações</div>
                              </div>
                            )}

                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {group.options.map((option, optionIndex) => (
                                <div 
                                  key={optionIndex} 
                                  className={`grid grid-cols-7 gap-2 items-center bg-white p-2 rounded border transition-all ${
                                    draggedOptionIndex?.groupIndex === groupIndex && draggedOptionIndex?.optionIndex === optionIndex 
                                      ? 'opacity-50 scale-95' : ''
                                  } ${option.is_active === false ? 'bg-red-50 border-red-200' : ''}`}
                                  draggable
                                  onDragStart={(e) => handleOptionDragStart(e, groupIndex, optionIndex)}
                                  onDragOver={handleOptionDragOver}
                                  onDrop={(e) => handleOptionDrop(e, groupIndex, optionIndex)}
                                >
                                  <div className="cursor-move text-gray-400 hover:text-gray-600 flex items-center justify-center">
                                    <GripVertical size={14} />
                                  </div>
                                  <input
                                    type="text"
                                    value={option.name}
                                    onChange={(e) => updateComplementOption(groupIndex, optionIndex, { name: e.target.value })}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    placeholder="Nome"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={option.price}
                                    onChange={(e) => updateComplementOption(groupIndex, optionIndex, { price: parseFloat(e.target.value) || 0 })}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={option.description}
                                    onChange={(e) => updateComplementOption(groupIndex, optionIndex, { description: e.target.value })}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    placeholder="Descrição"
                                  />
                                  <div className="flex items-center justify-center">
                                    <label className="flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={option.is_active !== false}
                                        onChange={(e) => updateComplementOption(groupIndex, optionIndex, { is_active: e.target.checked })}
                                        className="w-3 h-3 text-green-600"
                                      />
                                      <span className="text-xs text-gray-600">Ativo</span>
                                    </label>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeComplementOption(groupIndex, optionIndex)}
                                    className="text-red-600 hover:text-red-800 flex items-center justify-center"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum grupo de complementos configurado</p>
                      <p className="text-sm">Clique em "Aplicar Grupos Padrão" para começar</p>
                      <p className="text-xs mt-2 text-blue-600">
                        💡 Dica: Após criar grupos, você pode arrastá-los para reordenar
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingProduct ? 'Atualizar' : 'Criar'} Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onSelectImage={handleImageSelect}
          currentImage={formData.image_url || (editingProduct?.id && productImages[editingProduct.id])}
        />
      )}

      {/* Product Schedule Modal */}
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
    </div>
  );
};

export default ProductsPanel;