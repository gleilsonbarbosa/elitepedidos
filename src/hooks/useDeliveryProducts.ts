import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { products as codeProducts } from '../data/products';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DeliveryProduct {
  id: string;
  name: string;
  category: 'acai' | 'combo' | 'milkshake' | 'vitamina' | 'sorvetes' | 'bebidas' | 'complementos' | 'sobremesas' | 'outros';
  price: number;
  original_price?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  price_per_gram?: number;
  complement_groups?: any;
  sizes?: any;
  scheduled_days?: any;
  availability_type?: string;
  created_at: string;
  updated_at: string;
}

export const useDeliveryProducts = () => {
  const [products, setProducts] = useState<DeliveryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando produtos de demonstração');
        
        // Fallback para produtos de demonstração se Supabase não estiver configurado
        const { products: demoProducts } = await import('../data/products');
        const mappedProducts = demoProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category as DeliveryProduct['category'],
          price: product.price,
          original_price: product.originalPrice,
          description: product.description,
          image_url: product.image,
          is_active: product.isActive !== false,
          is_weighable: product.is_weighable || false,
          price_per_gram: product.pricePerGram,
          complement_groups: product.complementGroups,
          sizes: product.sizes,
          scheduled_days: product.scheduledDays,
          availability_type: product.availability?.type || 'always',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setProducts(mappedProducts);
        setLoading(false);
        return;
      }
      
      console.log('🔄 Carregando produtos do banco de dados...');
      
      // Add timeout and retry logic for Supabase requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Conexão com Supabase demorou mais de 10 segundos')), 10000);
      });
      
      const fetchPromise = supabase
        .from('delivery_products')
        .select('*')
        .order('name');
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw new Error(`Erro do banco de dados: ${error.message}`);
      }
      
      console.log(`✅ ${data?.length || 0} produtos carregados do banco`);
      setProducts(data || []);
    } catch (err) {
      console.error('❌ Erro ao carregar produtos:', err);
      
      // Handle different types of errors gracefully
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('🌐 Erro de conectividade - usando produtos de demonstração');
        setError('Sem conexão com o servidor - usando modo offline');
        
        // Load demo products as fallback
        try {
          const { products: demoProducts } = await import('../data/products');
          const mappedProducts = demoProducts.map(product => ({
            id: product.id,
            name: product.name,
            category: product.category as DeliveryProduct['category'],
            price: product.price,
            original_price: product.originalPrice,
            description: product.description,
            image_url: product.image,
            is_active: product.isActive !== false,
            is_weighable: product.is_weighable || false,
            price_per_gram: product.pricePerGram,
            complement_groups: product.complementGroups,
            sizes: product.sizes,
            scheduled_days: product.scheduledDays,
            availability_type: product.availability?.type || 'always',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          setProducts(mappedProducts);
        } catch (importError) {
          console.error('❌ Erro ao carregar produtos de demonstração:', importError);
          setProducts([]);
        }
      } else if (err instanceof Error && err.message.includes('Timeout')) {
        console.warn('⏱️ Timeout na conexão - usando produtos de demonstração');
        setError('Conexão lenta - usando modo offline');
        
        // Load demo products as fallback for timeout
        try {
          const { products: demoProducts } = await import('../data/products');
          const mappedProducts = demoProducts.map(product => ({
            id: product.id,
            name: product.name,
            category: product.category as DeliveryProduct['category'],
            price: product.price,
            original_price: product.originalPrice,
            description: product.description,
            image_url: product.image,
            is_active: product.isActive !== false,
            is_weighable: product.is_weighable || false,
            price_per_gram: product.pricePerGram,
            complement_groups: product.complementGroups,
            sizes: product.sizes,
            scheduled_days: product.scheduledDays,
            availability_type: product.availability?.type || 'always',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          setProducts(mappedProducts);
        } catch (importError) {
          console.error('❌ Erro ao carregar produtos de demonstração:', importError);
          setProducts([]);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
        setError(errorMessage);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<DeliveryProduct, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🚀 Criando produto:', product);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - criando produto localmente');
        
        // Create product locally in demo mode
        const newProduct: DeliveryProduct = {
          ...product,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProducts(prev => [...prev, newProduct]);
        console.log('✅ Produto criado localmente:', newProduct);
        return newProduct;
      }
      
      const { data, error } = await supabase
        .from('delivery_products')
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [...prev, data]);
      console.log('✅ Produto criado:', data);
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<DeliveryProduct>) => {
    try {
      console.log('🔄 Iniciando atualização do produto:', { id, updates });
      
      console.log('✏️ Atualizando produto:', id, updates);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - atualizando produto localmente');
        
        // Update product locally in demo mode
        const existingProduct = products.find(p => p.id === id);
        if (!existingProduct) {
          throw new Error(`Produto ${id} não encontrado no estado local`);
        }
        
        const updatedProduct: DeliveryProduct = {
          ...existingProduct,
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        console.log('✅ Produto atualizado localmente:', updatedProduct);
        return updatedProduct;
      }

      // 1. Verificar se o produto existe no banco
      console.log('🔍 Verificando se produto existe no banco...', { id });
      const checkTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Verificação do produto demorou mais de 10 segundos')), 10000);
      });
      
      const checkFetchPromise = supabase
        .from('delivery_products')
        .select('*')
        .eq('id', id)
        .single();
      
      let existingProduct, checkError;
      
      try {
        const result = await Promise.race([
          checkFetchPromise,
          checkTimeoutPromise
        ]);
        existingProduct = result.data;
        checkError = result.error;
      } catch (err) {
        console.error('❌ Erro ao verificar produto:', err);
        
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          throw new Error('Erro de conectividade. Verifique sua internet e tente novamente.');
        } else if (err instanceof Error && err.message.includes('Timeout')) {
          throw new Error('Conexão lenta. Tente novamente em alguns segundos.');
        }
        throw err;
      }

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          console.warn('⚠️ Produto não encontrado no banco, criando novo...');
          
          // Se produto não existe no banco mas existe no estado local, criar no banco
          const localProduct = products.find(p => p.id === id);
          if (localProduct) {
            console.log('🔄 Produto existe localmente, criando no banco...');
            
            const productToCreate = {
              ...localProduct,
              ...updates,
              updated_at: new Date().toISOString()
            };
            
            // Remove campos que podem causar problema na criação
            const { created_at, ...createData } = productToCreate;
            
            const { data: createdProduct, error: createError } = await supabase
              .from('delivery_products')
              .insert([createData])
              .select()
              .single();
              
            if (createError) {
              console.error('❌ Erro ao criar produto no banco:', createError);
              throw new Error(`Erro ao sincronizar produto: ${createError.message}`);
            }
            
            console.log('✅ Produto criado no banco:', createdProduct);
            setProducts(prev => prev.map(p => p.id === id ? createdProduct : p));
            return createdProduct;
          } else {
            throw new Error(`Produto ${id.slice(0, 8)}... não encontrado. Pode ter sido removido.`);
          }
        }
        
        console.error('❌ Erro ao verificar produto:', checkError);
        throw new Error(`Erro ao verificar produto: ${checkError.message}`);
      }

      if (!existingProduct) {
        // Mesmo tratamento que acima para PGRST116
        const localProduct = products.find(p => p.id === id);
        if (localProduct) {
          console.log('🔄 Produto não existe no banco, criando...');
          
          const productToCreate = {
            ...localProduct,
            ...updates,
            updated_at: new Date().toISOString()
          };
          
          const { created_at, ...createData } = productToCreate;
          
          const { data: createdProduct, error: createError } = await supabase
            .from('delivery_products')
            .insert([createData])
            .select()
            .single();
            
          if (createError) {
            throw new Error(`Erro ao criar produto: ${createError.message}`);
          }
          
          setProducts(prev => prev.map(p => p.id === id ? createdProduct : p));
          return createdProduct;
        }
        
        throw new Error(`Produto ${id.slice(0, 8)}... não encontrado.`);
      }

      console.log('✅ Produto encontrado no banco:', existingProduct);

      // 2. Preparar dados da atualização
      const { 
        created_at, 
        updated_at, 
        has_complements,
        // Campos que podem não existir na tabela
        complement_groups,
        sizes,
        availability,
        scheduledDays,
        original_price,
        image,
        price,
        isActive,
        ...cleanUpdates 
      } = updates as any;
      
      // Mapear campos se necessário
      if (updates.isActive !== undefined) {
        cleanUpdates.is_active = updates.isActive;
      }
      
      const safeUpdate = Object.fromEntries(
        Object.entries({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        }).filter(([, value]) => value !== undefined)
      );

      console.log('📝 Preparando atualização:', {
        id,
        camposAtualizados: Object.keys(safeUpdate),
        updateData: safeUpdate
      });

      // 3. Verificar se há mudanças reais
      const hasChanges = Object.keys(cleanUpdates).some(key => {
        const oldValue = existingProduct[key];
        const newValue = cleanUpdates[key];
        console.log(`🔍 Comparando ${key}:`, { oldValue, newValue, changed: oldValue !== newValue });
        return oldValue !== newValue;
      });
      
      if (!hasChanges) {
        console.log('ℹ️ Nenhuma mudança detectada, retornando produto existente');
        return existingProduct;
      }
      
      console.log('🔄 Mudanças detectadas, prosseguindo com atualização...');

      // 4. Executar atualização
      const updateTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Atualização demorou mais de 15 segundos')), 15000);
      });
      
      const updateFetchPromise = supabase
        .from('delivery_products')
        .update(safeUpdate)
        .eq('id', id)
        .select('*');
      
      let updateData, updateError;
      
      try {
        const result = await Promise.race([
          updateFetchPromise,
          updateTimeoutPromise
        ]);
        updateData = result.data;
        updateError = result.error;
      } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          throw new Error('Erro de conectividade. Verifique sua internet.');
        }
        throw err;
      }

      if (updateError) {
        console.error('❌ Erro ao atualizar produto:', {
          id,
          error: updateError,
          code: updateError.code,
          message: updateError.message
        });
        
        if (updateError.code === 'PGRST116') {
          throw new Error('Produto não encontrado durante atualização. Pode ter sido removido.');
        } else if (updateError.code?.includes('unique') || updateError.message?.includes('unique')) {
          throw new Error('Erro: Já existe outro produto com esses dados únicos (nome ou código).');
        } else {
          throw new Error(`Erro ao atualizar: ${updateError.message}`);
        }
      }

      if (!updateData || updateData.length === 0) {
        console.warn('⚠️ Nenhuma linha atualizada, mas produto existe. Sincronizando...');
        
        const updatedProduct = {
          ...existingProduct,
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        };
        
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
        return updatedProduct;
      }

      const updatedProduct = updateData[0];
      console.log('✅ Produto atualizado com sucesso:', updatedProduct.name);

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;

    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err);
      
      // Log adicional para debug
      console.log('🔍 DEBUG - Estado atual:', {
        productId: id,
        localProductExists: !!products.find(p => p.id === id),
        totalProducts: products.length,
        updateData: updates
      });
      
      throw err;
    }
  }, [fetchProducts, products]);
  // Nova função para diagnosticar e corrigir problemas com produto específico
  const fixProduct = useCallback(async (productId: string) => {
    try {
      console.log('🔧 Iniciando correção para produto:', productId);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        throw new Error('Supabase não configurado');
      }
      
      // 1. Tentar buscar produto do banco
      const { data: dbProduct, error: dbError } = await supabase
        .from('delivery_products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();
      
      // 2. Verificar produto no estado local
      const localProduct = products.find(p => p.id === productId);
      
      console.log('🔍 Diagnóstico:', {
        productId,
        existsInDb: !!dbProduct,
        existsLocally: !!localProduct,
        dbError: dbError?.message,
        localName: localProduct?.name,
        dbName: dbProduct?.name
      });
      
      if (dbError && dbError.code !== 'PGRST116') {
        throw new Error(`Erro no banco: ${dbError.message}`);
      }
      
      // 3. Se produto não existe no banco mas existe local, criar no banco
      if (!dbProduct && localProduct) {
        console.log('📝 Criando produto no banco a partir do estado local...');
        
        const { created_at, updated_at, ...createData } = localProduct;
        
        const { data: createdProduct, error: createError } = await supabase
          .from('delivery_products')
          .insert([{
            ...createData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) {
          throw new Error(`Erro ao criar produto: ${createError.message}`);
        }
        
        console.log('✅ Produto criado no banco:', createdProduct.name);
        setProducts(prev => prev.map(p => p.id === productId ? createdProduct : p));
        return createdProduct;
      }
      
      // 4. Se produto existe no banco mas não local, adicionar ao estado
      if (dbProduct && !localProduct) {
        console.log('📥 Adicionando produto do banco ao estado local...');
        setProducts(prev => [...prev, dbProduct]);
        return dbProduct;
      }
      
      // 5. Se ambos existem, sincronizar (usar dados do banco como fonte da verdade)
      if (dbProduct && localProduct) {
        console.log('🔄 Sincronizando produto (banco como fonte da verdade)...');
        setProducts(prev => prev.map(p => p.id === productId ? dbProduct : p));
        return dbProduct;
      }
      
      throw new Error('Produto não encontrado em lugar nenhum');
      
    } catch (err) {
      console.error('❌ Erro ao corrigir produto:', err);
      throw err;
    }
  }, [products]);

  // Nova função para diagnosticar problemas com produto específico
  const debugProduct = useCallback(async (productId: string) => {
    try {
      console.log('🔍 DIAGNÓSTICO COMPLETO para produto:', productId);
      
      // 1. Verificar se existe no estado local
      const localProduct = products.find(p => p.id === productId);
      console.log('📱 Produto no estado local:', localProduct ? {
        id: localProduct.id,
        name: localProduct.name,
        category: localProduct.category,
        is_active: localProduct.is_active
      } : 'NÃO ENCONTRADO');
      
      // 2. Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const isConfigured = supabaseUrl && supabaseKey && 
                          !supabaseUrl.includes('placeholder') &&
                          !supabaseKey.includes('placeholder');
      
      console.log('🔧 Configuração Supabase:', {
        isConfigured,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlValid: !supabaseUrl?.includes('placeholder'),
        keyValid: !supabaseKey?.includes('placeholder')
      });
      
      if (!isConfigured) {
        console.warn('⚠️ Supabase não configurado - modo demo ativo');
        return;
      }
      
      // 3. Verificar se existe no banco
      const { data: dbProduct, error: dbError } = await supabase
        .from('delivery_products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();
      
      console.log('🗄️ Produto no banco de dados:', dbProduct ? {
        id: dbProduct.id,
        name: dbProduct.name,
        category: dbProduct.category,
        is_active: dbProduct.is_active,
        updated_at: dbProduct.updated_at
      } : 'NÃO ENCONTRADO');
      
      if (dbError) {
        console.error('❌ Erro ao consultar banco:', dbError);
      }
      
      // 4. Verificar se há dessincronia
      if (localProduct && dbProduct) {
        const isInSync = localProduct.name === dbProduct.name && 
                        localProduct.updated_at === dbProduct.updated_at;
        console.log('🔄 Sincronização:', {
          isInSync,
          localUpdated: localProduct.updated_at,
          dbUpdated: dbProduct.updated_at
        });
        
        if (!isInSync) {
          console.warn('⚠️ Produto desatualizado no estado local, sincronizando...');
          setProducts(prev => prev.map(p => p.id === productId ? dbProduct : p));
        }
      }
      
      // 5. Verificar permissões da tabela
      const { data: permissionsTest, error: permError } = await supabase
        .from('delivery_products')
        .select('count', { count: 'exact', head: true });
      
      console.log('🔐 Teste de permissões:', {
        canRead: !permError,
        totalProducts: permissionsTest || 0,
        permissionError: permError?.message
      });
      
      return {
        local: !!localProduct,
        database: !!dbProduct,
        synchronized: localProduct && dbProduct && localProduct.updated_at === dbProduct.updated_at,
        canAccess: !permError
      };
      
    } catch (err) {
      console.error('❌ Erro no diagnóstico:', err);
      return null;
    }
  }, [products]);

  // Nova função para forçar sincronização de um produto específico
  const forceSync = useCallback(async (productId: string) => {
    try {
      console.log('🔄 Forçando sincronização para produto:', productId);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        throw new Error('Supabase não configurado');
      }
      
      // Buscar produto do banco
      const { data: dbProduct, error } = await supabase
        .from('delivery_products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠️ Produto não encontrado no banco, removendo do estado local');
          setProducts(prev => prev.filter(p => p.id !== productId));
          throw new Error('Produto foi removido do banco de dados');
        }
        throw error;
      }
      
      // Atualizar estado local com dados do banco
      setProducts(prev => {
        const exists = prev.some(p => p.id === productId);
        if (exists) {
          return prev.map(p => p.id === productId ? dbProduct : p);
        } else {
          return [...prev, dbProduct];
        }
      });
      
      console.log('✅ Produto sincronizado:', dbProduct.name);
      return dbProduct;
      
    } catch (err) {
      console.error('❌ Erro ao forçar sincronização:', err);
      throw err;
    }
  }, []);
  const syncWithDatabase = useCallback(async () => {
    console.log('🔄 Sincronizando produtos com banco de dados...');
    console.log('📊 Estado atual dos produtos:', products.length);
    await fetchProducts();
    console.log('✅ Sincronização concluída');
  }, [fetchProducts, products]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Excluindo produto:', id);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'your_supabase_url_here' || 
          supabaseKey === 'your_supabase_anon_key_here' ||
          supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - excluindo produto localmente');
        
        // Delete product locally in demo mode
        setProducts(prev => prev.filter(p => p.id !== id));
        console.log('✅ Produto excluído localmente');
        return;
      }
      
      const { error } = await supabase
        .from('delivery_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      console.log('✅ Produto excluído');
    } catch (err) {
      console.error('❌ Erro ao excluir produto:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }, []);

  // Configurar subscription em tempo real
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    // Verificar se Supabase está configurado
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'your_supabase_url_here' || 
        supabaseKey === 'your_supabase_anon_key_here' ||
        supabaseUrl.includes('placeholder')) {
      console.log('⚠️ Supabase não configurado - subscription em tempo real desabilitada');
    } else {
      console.log('🔄 Configurando subscription em tempo real para produtos...');
      
      channel = supabase
        .channel('delivery_products_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_products'
          },
          (payload) => {
            console.log('📡 Mudança detectada na tabela delivery_products:', payload);
            
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new) {
                  console.log('➕ Produto adicionado:', payload.new);
                  setProducts(prev => {
                    // Verificar se o produto já existe para evitar duplicatas
                    const exists = prev.some(p => p.id === payload.new.id);
                    if (exists) return prev;
                    return [...prev, payload.new as DeliveryProduct];
                  });
                }
                break;
                
              case 'UPDATE':
                if (payload.new) {
                  console.log('✏️ Produto atualizado:', payload.new);
                  setProducts(prev => 
                    prev.map(p => 
                      p.id === payload.new.id ? payload.new as DeliveryProduct : p
                    )
                  );
                }
                break;
                
              case 'DELETE':
                if (payload.old) {
                  console.log('🗑️ Produto removido:', payload.old);
                  setProducts(prev => 
                    prev.filter(p => p.id !== payload.old.id)
                  );
                }
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da subscription:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscription em tempo real ativa para produtos');
          }
        });
    }

    // Cleanup function
    return () => {
      if (channel) {
        console.log('🔌 Desconectando subscription em tempo real...');
        channel.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
    debugProduct,
    forceSync,
    syncWithDatabase,
    fixProduct
  };
};