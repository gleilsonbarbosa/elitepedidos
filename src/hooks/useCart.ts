import { useState, useCallback } from 'react';
import { CartItem, Product, ProductSize, SelectedComplement } from '../types/product';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = useCallback((
    product: Product, 
    selectedSize?: ProductSize, 
    quantity: number = 1,
    observations?: string,
    selectedComplements: SelectedComplement[] = [],
    replaceItemId?: string
  ) => {
    const basePrice = selectedSize ? selectedSize.price : product.price;
    const complementsPrice = selectedComplements.reduce((total, selected) => total + selected.complement.price, 0);
    const unitPrice = basePrice + complementsPrice;
    const totalPrice = unitPrice * quantity;
    
    const newItem: CartItem = {
      id: `${product.id}-${selectedSize?.id || 'default'}-${Date.now()}`,
      product,
      selectedSize,
      selectedComplements,
      quantity,
      unit_price: unitPrice,
      totalPrice,
      observations
    };

    console.log('🛒 Adicionando ao carrinho:', {
      product: product.name,
      quantity,
      unitPrice,
      totalPrice,
      complementsCount: selectedComplements.length
    });

    if (replaceItemId) {
      // Modo edição: substituir item na mesma posição
      setItems(prev => prev.map(item => 
        item.id === replaceItemId ? newItem : item
      ));
    } else {
      // Modo normal: adicionar ao final
      setItems(prev => [...prev, newItem]);
    }
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    console.log('🗑️ Removendo do carrinho:', itemId);
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    console.log('🔄 Atualizando quantidade:', { itemId, quantity });

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newTotalPrice = item.unit_price * quantity;
        return {
          ...item,
          quantity,
          totalPrice: newTotalPrice
        };
      }
      return item;
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    console.log('🧹 Limpando carrinho');
    setItems([]);
    setIsOpen(false);
  }, []);

  const getTotalPrice = useCallback(() => {
    const total = items.reduce((total, item) => total + item.totalPrice, 0);
    console.log('💰 Total do carrinho:', total);
    return total;
  }, [items]);

  const getTotalItems = useCallback(() => {
    const total = items.reduce((total, item) => total + item.quantity, 0);
    return total;
  }, [items]);

  const getItemsCount = useCallback(() => {
    return items.length;
  }, [items]);

  const updateItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate total price if quantity or unit_price changed
        if (updates.quantity !== undefined || updates.unit_price !== undefined) {
          updatedItem.totalPrice = updatedItem.unit_price * updatedItem.quantity;
        }
        
        return updatedItem;
      }
      return item;
    }));
  }, []);

  const findItemById = useCallback((itemId: string) => {
    return items.find(item => item.id === itemId);
  }, [items]);

  const hasItems = useCallback(() => {
    return items.length > 0;
  }, [items]);

  return {
    items,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getItemsCount,
    updateItem,
    findItemById,
    hasItems
  };
};