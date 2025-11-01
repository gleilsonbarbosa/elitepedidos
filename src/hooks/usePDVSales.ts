@@ .. @@
 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '../lib/supabase';
 import { PDVProduct, PDVSale, PDVSaleItem, PDVOperator, PDVCartItem } from '../types/pdv';
+import { usePDVCashRegister } from './usePDVCashRegister';
 
 export const usePDVProducts = () => {
   const [products, setProducts] = useState<PDV}
}
Product[]>([]);
@@ .. @@
 export const usePDVSales = () => {
   const [sales, setSales] = useState<PDVSale[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
+  const { currentRegister, isOpen: isCashRegisterOpen } = usePDVCashRegister();
 
  // Helper function to validate and get a valid operator ID
  const getValidOperatorId = async (operatorId?: string): Promise<string> => {
    // First, try to validate the provided operator ID
    if (operatorId) {
      const { data: operator, error } = await supabase
        .from('pdv_operators')
        .select('id')
        .eq('id', operatorId)
        .single();
      
      if (!error && operator) {
        return operatorId;
      }
      
      // Validate and get a valid operator ID
      const validOperatorId = await getValidOperatorId(saleData.operator_id);
    }
    
    // If no valid operator ID provided, try to find an admin operator
    const { data: adminOperator, error: adminError } = await supabase
      .from('pdv_operators')
      .select('id')
      .eq('name', 'ADMIN')
      .eq('is_active', true)
      .single();
    
    if (!adminError && adminOperator) {
      return adminOperator.id;
    }
    
    // If no admin found, try to get any active operator
    const { data: anyOperator, error: anyError } = await supabase
      .from('pdv_operators')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (!anyError && anyOperator) {
      return anyOperator.id;
    }
    
    throw new Error('Nenhum operador válido encontrado. Verifique se existem operadores cadastrados no sistema.');
  };

   const createSale = useCallback(async (
     saleData: Omit<PDVSale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>,
@@ -118,6 +120,12 @@
        channel: saleData.channel || 'pdv',
        operator_id: validOperatorId
     try {
       setLoading(true);
+      
+      // Check if cash register is open
+      if (!isCashRegisterOpen || !currentRegister) {
+        console.error('❌ Não é possível finalizar venda sem um caixa aberto');
+        throw new Error('Não é possível finalizar venda sem um caixa aberto');
+      }
 
       // Set channel to pdv if not specified
       const saleWithChannel = {
@@ -125,6 +133,9 @@
         channel: saleData.channel || 'pdv'
       };
       
+      // Associate with current cash register
+      saleWithChannel.cash_register_id = currentRegister.id;
+      
       if (debug) {
         console.log('🔍 Sale data:', saleWithChannel);
         console.log('🔍 Sale items:', items);
@@ -196,7 +207,7 @@
       console.error('❌ Sale creation failed:', errorMessage);
       throw new Error(errorMessage);
     } finally {
       setLoading(false);
     }
-  }, []);
+  }, [currentRegister, isCashRegisterOpen]);
 
   const cancelSale = useCallback(async (saleId: string, reason: string, operatorId: string) => {
     try {