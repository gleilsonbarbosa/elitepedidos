export interface CashbackTransaction {
  id: string;
  customer_id: string;
  amount: number;
  cashback_amount: number;
  type: 'purchase' | 'redemption' | 'adjustment';
  status: 'approved' | 'pending' | 'rejected' | 'used';
  comment?: string;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerBalance {
  customer_id: string;
  name?: string;
  available_balance: number;
  expiring_amount: number;
  expiration_date?: string;
}