import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantTable, TableSale, TableSaleItem } from '../types/table-sales';

export const useTableSales = (storeId: 1 | 2, currentRegister?: any, addCashEntry?: any) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    occupied: 0,
    waitingBill: 0
  });

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const saleItemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Carregando mesas da loja ${storeId}...`);

      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          ${salesTableName}!current_sale_id(
            id,
            sale_number,
            customer_name,
            customer_count,
            total_amount,
            status,
            opened_at
          )
        `)
        .eq('is_active', true)
        .order('number');

      if (error) {
        console.error(`❌ Erro ao carregar mesas da loja ${storeId}:`, error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mesas carregadas da loja ${storeId}`);

      // Process tables data
      const processedTables = (data || []).map(table => ({
        ...table,
        current_sale: table[salesTableName] || null
      }));

      setTables(processedTables);

      // Calculate stats
      const newStats = {
        total: processedTables.length,
        free: processedTables.filter(t => t.status === 'livre').length,
        occupied: processedTables.filter(t => t.status === 'ocupada').length,
        waitingBill: processedTables.filter(t => t.status === 'aguardando_conta').length
      };

      setStats(newStats);

    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const createTableSale = async (tableId: string, customerName: string, customerCount: number) => {
    try {
      console.log(`🆕 Criando venda para mesa da loja ${storeId}:`, { tableId, customerName, customerCount });

      const { data, error } = await supabase
        .from(salesTableName)
        .insert([{
          table_id: tableId,
          operator_name: 'Sistema',
          customer_name: customerName || null,
          customer_count: customerCount,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          notes: null
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar venda da mesa loja ${storeId}:`, error);
        throw error;
      }

      console.log(`✅ Venda criada para mesa da loja ${storeId}:`, data);

      // Update table status to occupied
      await updateTableStatus(tableId, 'ocupada');

      // Refresh tables
      await fetchTables();

      return data;
    } catch (err) {
      console.error(`❌ Erro ao criar venda da mesa loja ${storeId}:`, err);
      throw err;
    }
  };

  const updateTableStatus = async (tableId: string, status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    try {
      console.log(`🔄 Atualizando status da mesa loja ${storeId}:`, { tableId, status });

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // If setting to free, clear current sale
      if (status === 'livre') {
        updateData.current_sale_id = null;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', tableId);

      if (error) {
        console.error(`❌ Erro ao atualizar status da mesa loja ${storeId}:`, error);
        throw error;
      }

      console.log(`✅ Status da mesa atualizado na loja ${storeId}`);

      // Refresh tables
      await fetchTables();
    } catch (err) {
      console.error(`❌ Erro ao atualizar status da mesa loja ${storeId}:`, err);
      throw err;
    }
  };

  const getSaleDetails = async (saleId: string): Promise<TableSale | null> => {
    try {
      console.log(`🔍 Buscando detalhes da venda loja ${storeId}:`, saleId);

      const { data, error } = await supabase
        .from(salesTableName)
        .select(`
          *,
          ${saleItemsTableName}(*)
        `)
        .eq('id', saleId)
        .single();

      if (error) {
        console.error(`❌ Erro ao buscar detalhes da venda loja ${storeId}:`, error);
        throw error;
      }

      console.log(`✅ Detalhes da venda carregados loja ${storeId}:`, data);

      return {
        ...data,
        items: data[saleItemsTableName] || []
      };
    } catch (err) {
      console.error(`❌ Erro ao buscar detalhes da venda loja ${storeId}:`, err);
      return null;
    }
  };

  const addItemToSale = async (saleId: string, item: Omit<TableSaleItem, 'id' | 'sale_id' | 'created_at'>) => {
    try {
      console.log(`➕ Adicionando item à venda loja ${storeId}:`, { saleId, item });

      const { data, error } = await supabase
        .from(saleItemsTableName)
        .insert([{
          sale_id: saleId,
          ...item
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao adicionar item loja ${storeId}:`, error);
        throw error;
      }

      console.log(`✅ Item adicionado à venda loja ${storeId}:`, data);

      // Update sale total
      await updateSaleTotal(saleId);

      return data;
    } catch (err) {
      console.error(`❌ Erro ao adicionar item loja ${storeId}:`, err);
      throw err;
    }
  };

  const deleteItemFromSale = async (itemId: string, saleId: string) => {
    try {
      console.log(`🗑️ Excluindo item da venda loja ${storeId}:`, { itemId, saleId });

      const { error } = await supabase
        .from(saleItemsTableName)
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error(`❌ Erro ao excluir item loja ${storeId}:`, error);
        throw error;
      }

      console.log(`✅ Item excluído da venda loja ${storeId}`);

      // Update sale total
      await updateSaleTotal(saleId);
    } catch (err) {
      console.error(`❌ Erro ao excluir item loja ${storeId}:`, err);
      throw err;
    }
  };

  const updateSaleTotal = async (saleId: string) => {
    try {
      // Get all items for this sale
      const { data: items, error: itemsError } = await supabase
        .from(saleItemsTableName)
        .select('subtotal')
        .eq('sale_id', saleId);

      if (itemsError) {
        console.error(`❌ Erro ao buscar itens para atualizar total loja ${storeId}:`, itemsError);
        throw itemsError;
      }

      const newTotal = (items || []).reduce((sum, item) => sum + item.subtotal, 0);

      // Update sale total
      const { error: updateError } = await supabase
        .from(salesTableName)
        .update({
          subtotal: newTotal,
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (updateError) {
        console.error(`❌ Erro ao atualizar total da venda loja ${storeId}:`, updateError);
        throw updateError;
      }

      console.log(`✅ Total da venda atualizado loja ${storeId}:`, newTotal);
    } catch (err) {
      console.error(`❌ Erro ao atualizar total da venda loja ${storeId}:`, err);
      throw err;
    }
  };

  const closeSale = async (saleId: string, paymentType: string, changeAmount: number = 0) => {
    try {
      console.log(`💳 Fechando venda da mesa loja ${storeId}:`, { saleId, paymentType, changeAmount });

      // Update sale status to closed
      const { error: saleError } = await supabase
        .from(salesTableName)
        .update({
          payment_type: paymentType,
          change_amount: changeAmount,
          status: 'fechada',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (saleError) {
        console.error(`❌ Erro ao fechar venda loja ${storeId}:`, saleError);
        throw saleError;
      }

      // Get table ID to update status
      const { data: saleData, error: getSaleError } = await supabase
        .from(salesTableName)
        .select('table_id')
        .eq('id', saleId)
        .single();

      if (getSaleError) {
        console.error(`❌ Erro ao buscar dados da venda loja ${storeId}:`, getSaleError);
        throw getSaleError;
      }

      // Update table status to free
      await updateTableStatus(saleData.table_id, 'livre');

      console.log(`✅ Venda fechada e mesa liberada loja ${storeId}`);

      // Refresh tables
      await fetchTables();
    } catch (err) {
      console.error(`❌ Erro ao fechar venda loja ${storeId}:`, err);
      throw err;
    }
  };

  const cancelSale = async (saleId: string, reason: string) => {
    try {
      console.log(`❌ Cancelando venda da mesa loja ${storeId}:`, { saleId, reason });

      // Update sale status to cancelled
      const { error: saleError } = await supabase
        .from(salesTableName)
        .update({
          status: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (saleError) {
        console.error(`❌ Erro ao cancelar venda loja ${storeId}:`, saleError);
        throw saleError;
      }

      // Get table ID to update status
      const { data: saleData, error: getSaleError } = await supabase
        .from(salesTableName)
        .select('table_id')
        .eq('id', saleId)
        .single();

      if (getSaleError) {
        console.error(`❌ Erro ao buscar dados da venda para cancelar loja ${storeId}:`, getSaleError);
        throw getSaleError;
      }

      // Update table status to free
      await updateTableStatus(saleData.table_id, 'livre');

      console.log(`✅ Venda cancelada e mesa liberada loja ${storeId}`);

      // Refresh tables
      await fetchTables();
    } catch (err) {
      console.error(`❌ Erro ao cancelar venda loja ${storeId}:`, err);
      throw err;
    }
  };

  const refetch = async () => {
    await fetchTables();
  };

  // Load tables on mount
  useEffect(() => {
    fetchTables();
  }, [storeId]);

  return {
    tables,
    loading,
    error,
    stats,
    createTableSale,
    closeSale,
    getSaleDetails,
    updateTableStatus,
    refetch,
    addItemToSale,
    deleteItemFromSale,
    cancelSale
  };
};