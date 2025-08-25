import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantTable, TableSale, TableCartItem } from '../types/table-sales';

export const useTableSales = (storeId: 1 | 2) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const itemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  // Fetch tables
  const fetchTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Create new table sale
  const createTableSale = async (
    tableId: string, 
    customerName?: string, 
    customerCount: number = 1
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from(salesTableName)
        .insert({
          table_id: tableId,
          operator_name: 'Operador',
          customer_name: customerName || '',
          customer_count: customerCount,
          status: 'aberta'
        })
        .select()
        .single();

      if (error) throw error;

      // Update table status to occupied
      await supabase
        .from(tableName)
        .update({ 
          status: 'ocupada',
          current_sale_id: data.id
        })
        .eq('id', tableId);

      await fetchTables();
      return data.id;
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      throw err;
    }
  };

  // Add item to sale
  const addItemToSale = async (
    saleId: string,
    item: {
      product_code: string;
      product_name: string;
      quantity: number;
      weight_kg?: number;
      unit_price?: number;
      price_per_gram?: number;
      discount_amount: number;
      subtotal: number;
      notes?: string;
    }
  ) => {
    try {
      const { error } = await supabase
        .from(itemsTableName)
        .insert({
          sale_id: saleId,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.quantity,
          weight_kg: item.weight_kg,
          unit_price: item.unit_price,
          price_per_gram: item.price_per_gram,
          discount_amount: item.discount_amount,
          subtotal: item.subtotal,
          notes: item.notes
        });

      if (error) throw error;

      // Update sale totals
      await updateSaleTotals(saleId);
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      throw err;
    }
  };

  // Update sale totals
  const updateSaleTotals = async (saleId: string) => {
    try {
      const { data: items, error } = await supabase
        .from(itemsTableName)
        .select('subtotal')
        .eq('sale_id', saleId);

      if (error) throw error;

      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

      const { error: updateError } = await supabase
        .from(salesTableName)
        .update({
          subtotal: subtotal,
          total_amount: subtotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);
      
      if (updateError) throw updateError;
    } catch (err) {
      console.error('Erro ao atualizar totais:', err);
      throw err;
    }
  };

  // Delete item from sale
  const deleteItemFromSale = async (itemId: string, saleId: string) => {
    try {
      const { error } = await supabase
        .from(itemsTableName)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update sale totals after deleting item
      await updateSaleTotals(saleId);
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      throw err;
    }
  };
  // Close sale
  const closeSale = async (
    saleId: string,
    paymentType: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'voucher' | 'misto',
    changeAmount: number = 0
  ) => {
    try {
      const { error } = await supabase
        .from(salesTableName)
        .update({
          status: 'fechada',
          payment_type: paymentType,
          change_amount: changeAmount,
          closed_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (error) throw error;

      // Update table status to cleaning
      await supabase
        .from(tableName)
        .update({ 
          status: 'limpeza',
          current_sale_id: null
        })
        .eq('current_sale_id', saleId);

      await fetchTables();
    } catch (err) {
      console.error('Erro ao fechar venda:', err);
      throw err;
    }
  };

  // Get sale details
  const getSaleDetails = async (saleId: string): Promise<TableSale | null> => {
    try {
      const { data: sale, error: saleError } = await supabase
        .from(salesTableName)
        .select('*')
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      const { data: items, error: itemsError } = await supabase
        .from(itemsTableName)
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at');

      if (itemsError) throw itemsError;

      return {
        ...sale,
        items: items || []
      };
    } catch (err) {
      console.error('Erro ao carregar detalhes da venda:', err);
      return null;
    }
  };

  // Update table status
  const updateTableStatus = async (
    tableId: string, 
    status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza'
  ) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      await fetchTables();
    } catch (err) {
      console.error('Erro ao atualizar status da mesa:', err);
      throw err;
    }
  };

  // Refetch data
  const refetch = () => {
    fetchTables();
  };

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  // Calculate statistics
  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'livre').length,
    occupied: tables.filter(t => t.status === 'ocupada').length,
    waitingBill: tables.filter(t => t.status === 'aguardando_conta').length,
    cleaning: tables.filter(t => t.status === 'limpeza').length
  };

  return {
    tables,
    loading,
    error,
    stats,
    createTableSale,
    addItemToSale,
    deleteItemFromSale,
    closeSale,
    getSaleDetails,
    updateTableStatus,
    refetch
  };
};