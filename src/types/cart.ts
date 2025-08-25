import { Product, ProductSize, SelectedComplement } from './product';

export interface CartItem {
  id: string;
  product: Product;
  selectedSize?: ProductSize;
  selectedComplements: SelectedComplement[];
  quantity: number;
  unit_price: number;
  totalPrice: number;
  observations?: string;
}

export interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemsCount: number;
  totalQuantity: number;
}

export interface CartDiscount {
  type: 'percentage' | 'amount' | 'none';
  value: number;
  description?: string;
}

export interface CartState {
  items: CartItem[];
  discount: CartDiscount;
  deliveryInfo?: {
    neighborhood: string;
    fee: number;
    estimatedTime: number;
  };
  customerInfo?: {
    name: string;
    phone: string;
    address: string;
    complement?: string;
  };
  paymentMethod?: 'money' | 'pix' | 'card';
  changeFor?: number;
}