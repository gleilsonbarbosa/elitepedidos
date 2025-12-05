import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PDVSale, PDVSaleItem } from '../types/pdv';
import { usePDVCashRegister } from './usePDVCashRegister';

export const usePDVSales = () => {
  const [sales, setSales] = useState<PDVSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentRegister, isOpen: isCashRegisterOpen } = usePDVCashRegister();

  const createSale = useCallback(async (
    saleData: Omit<PDVSale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>,
    items: Omit<PDVSaleItem, 'id' | 'sale_id' | 'created_at'>[]
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!isCashRegisterOpen || !currentRegister) {
        throw new Error('Não é possível finalizar venda sem um caixa aberto');
      }

      const saleWithRegister = {
        ...saleData,
        cash_register_id: currentRegister.id
      };

      const { data: sale, error: saleError } = await supabase
        .from('pdv_sales')
        .insert([saleWithRegister])
        .select()
        .single();

      if (saleError) throw saleError;
      if (!sale) throw new Error('Falha ao criar venda');

      const saleItems = items.map(item => ({
        ...item,
        sale_id: sale.id
      }));

      const { error: itemsError } = await supabase
        .from('pdv_sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      return sale;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar venda';
      setError(errorMessage);
      console.error('❌ Sale creation failed:', errorMessage, err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentRegister, isCashRegisterOpen]);

  const cancelSale = useCallback(async (saleId: string, reason: string, operatorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('pdv_sales')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: operatorId,
          cancel_reason: reason
        })
        .eq('id', saleId);

      if (error) throw error;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao cancelar venda';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sales,
    loading,
    error,
    createSale,
    cancelSale
  };
};
