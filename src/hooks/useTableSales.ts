import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantTable, TableSale, TableCartItem } from '../types/table-sales';

interface UseTableSalesReturn {
  tables: RestaurantTable[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    free: number;
    occupied: number;
    waitingBill: number;
    cleaning: number;
  };
  createTableSale: (tableId: string, customerName: string, customerCount: number) => Promise<void>;
  closeSale: (saleId: string, paymentType: string, changeAmount?: number) => Promise<void>;
  getSaleDetails: (saleId: string) => Promise<TableSale | null>;
  updateTableStatus: (tableId: string, status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => Promise<void>;
  refetch: () => Promise<void>;
  addItemToSale: (saleId: string, item: TableCartItem) => Promise<void>;
  deleteItemFromSale: (itemId: string, saleId: string) => Promise<void>;
}

export const useTableSales = (
  storeId: 1 | 2,
  currentRegister?: any,
  addCashEntry?: (entry: any) => Promise<void>
): UseTableSalesReturn => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:current_sale_id(
            id,
            sale_number,
            customer_name,
            customer_count,
            subtotal,
            discount_amount,
            total_amount,
            payment_type,
            change_amount,
            status,
            opened_at,
            closed_at,
            ${itemsTableName}!sale_id(*)
          )
        `)
        .order('number');

      if (error) throw error;

      // Process the data to flatten the current_sale relationship
      const processedTables = (data || []).map(table => ({
        ...table,
        current_sale: Array.isArray(table.current_sale) && table.current_sale.length > 0 
          ? table.current_sale[0] 
          : table.current_sale
      }));

      setTables(processedTables);
      return processedTables;
    } catch (err) {
      console.error('Erro ao buscar mesas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [tableName, salesTableName, itemsTableName]);

  const createTableSale = async (tableId: string, customerName: string, customerCount: number) => {
    try {
      const { data, error } = await supabase
        .from(salesTableName)
        .insert([{
          table_id: tableId,
          operator_name: 'Sistema',
          customer_name: customerName,
          customer_count: customerCount,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          status: 'aberta',
          cash_register_id: currentRegister?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Update table status to occupied and link the sale
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: 'ocupada',
          current_sale_id: data.id
        })
        .eq('id', tableId);

      if (updateError) throw updateError;

      await fetchTables();
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      throw err;
    }
  };

  const closeSale = async (saleId: string, paymentType: string, changeAmount: number = 0) => {
    try {
      // Get the table associated with this sale - use maybeSingle to handle case where no table is found
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .eq('current_sale_id', saleId)
        .maybeSingle();

      if (tableError) throw tableError;

      // Check if table was found
      if (!tableData) {
        console.warn('⚠️ Mesa não encontrada para a venda:', saleId);
        // Continue with sale closure even if table is not found
      }

      // Update sale status to closed
      const { data: updatedSale, error: updateError } = await supabase
        .from(salesTableName)
        .update({
          payment_type: paymentType,
          change_amount: changeAmount,
          status: 'fechada',
          closed_at: new Date().toISOString()
        })
        .eq('id', saleId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update table status only if table was found
      if (tableData) {
        const { error: tableUpdateError } = await supabase
          .from(tableName)
          .update({
            status: 'limpeza',
            current_sale_id: null
          })
          .eq('id', tableData.id);

        if (tableUpdateError) throw tableUpdateError;
      }

      await fetchTables();
    } catch (err) {
      console.error('Erro ao fechar venda:', err);
      throw err;
    }
  };

  const getSaleDetails = async (saleId: string): Promise<TableSale | null> => {
    try {
      const { data, error } = await supabase
        .from(salesTableName)
        .select(`
          *,
          items:${itemsTableName}!sale_id(*)
        `)
        .eq('id', saleId)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Erro ao buscar detalhes da venda:', err);
      return null;
    }
  };

  const updateTableStatus = async (tableId: string, status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    try {
      const updateData: any = { status };
      
      // If setting to free, also clear current sale
      if (status === 'livre') {
        updateData.current_sale_id = null;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', tableId);

      if (error) throw error;

      await fetchTables();
    } catch (err) {
      console.error('Erro ao atualizar status da mesa:', err);
      throw err;
    }
  };

  const addItemToSale = async (saleId: string, item: TableCartItem) => {
    try {
      // Add item to sale
      const { error: itemError } = await supabase
        .from(itemsTableName)
        .insert([{
          sale_id: saleId,
          ...item
        }]);

      if (itemError) throw itemError;

      // Recalculate sale totals
      await recalculateSaleTotal(saleId);
      await fetchTables();
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      throw err;
    }
  };

  const deleteItemFromSale = async (itemId: string, saleId: string) => {
    try {
      // Delete the item
      const { error: deleteError } = await supabase
        .from(itemsTableName)
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      // Recalculate sale totals
      await recalculateSaleTotal(saleId);
      await fetchTables();
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      throw err;
    }
  };

  const recalculateSaleTotal = async (saleId: string) => {
    try {
      // Get all items for this sale
      const { data: items, error: itemsError } = await supabase
        .from(itemsTableName)
        .select('*')
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      // Calculate totals
      const subtotal = (items || []).reduce((sum, item) => sum + item.subtotal, 0);
      
      // Update sale totals
      const { error: updateError } = await supabase
        .from(salesTableName)
        .update({
          subtotal: subtotal,
          total_amount: subtotal // No discount for now
        })
        .eq('id', saleId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Erro ao recalcular total:', err);
      throw err;
    }
  };

  const calculateStats = (tables: RestaurantTable[]) => {
    return {
      total: tables.length,
      free: tables.filter(t => t.status === 'livre').length,
      occupied: tables.filter(t => t.status === 'ocupada').length,
      waitingBill: tables.filter(t => t.status === 'aguardando_conta').length,
      cleaning: tables.filter(t => t.status === 'limpeza').length
    };
  };

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    loading,
    error,
    stats: calculateStats(tables),
    createTableSale,
    closeSale,
    getSaleDetails,
    updateTableStatus,
    refetch: fetchTables,
    addItemToSale,
    deleteItemFromSale
  };
};