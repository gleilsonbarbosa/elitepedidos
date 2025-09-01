export interface DeliveryOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_neighborhood: string;
  customer_complement?: string;
  payment_method: 'money' | 'pix' | 'card';
  change_for?: number;
  items: DeliveryOrderItem[];
  total_price: number;
  delivery_fee: number;
  estimated_delivery_minutes: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
}

export interface DeliveryOrderItem {
  product_name: string;
  product_image?: string;
  selected_size?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  observations?: string;
  complements: DeliveryOrderComplement[];
}

export interface DeliveryOrderComplement {
  name: string;
  price: number;
}