export interface Promotion {
  id: string;
  product_id: string;
  product_name: string;
  original_price: number;
  promotional_price: number;
  start_time: string; // ISO string
  end_time: string; // ISO string
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionFormData {
  product_id: string;
  promotional_price: number;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
}

export interface ActivePromotion extends Promotion {
  time_remaining: number; // milliseconds
  is_expired: boolean;
}