export type Role = 'admin' | 'worker' | 'customer';

export type OrderStatus =
  | 'pending_recharge'
  | 'pending_assignment'
  | 'in_progress'
  | 'completed'
  | 'settled'
  | 'cancelled';

export type RechargeStatus = 'pending' | 'approved' | 'rejected';

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: ApiErrorShape;
}

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  displayName: string;
}

export interface DashboardStat {
  label: string;
  value: string;
}

export interface AdminDashboardData {
  platformBalance: number;
  cumulativeRecharge: number;
  userCount: number;
  workerCount: number;
  orderCount: number;
  settledAmount: number;
  unsettledAmount: number;
}

export interface UserSummary {
  id: number;
  username: string;
  display_name: string;
  created_at: string;
  balance: number;
  total_recharged: number;
  order_count: number;
}

export interface WorkerSummary {
  id: number;
  username: string;
  display_name: string;
  created_at: string;
  order_count: number;
  total_income: number;
  settled_amount: number;
  unsettled_amount: number;
}

export interface Product {
  id: number;
  game_name: string;
  service_name: string;
  unit_price: number;
  commission_rate: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RechargeRequest {
  id: number;
  user_id?: number;
  user_name?: string;
  amount: number;
  payment_method: 'alipay' | 'wechat';
  voucher_url: string | null;
  remark: string | null;
  review_remark?: string | null;
  status: RechargeStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_no: string;
  customer_id: number;
  worker_id: number | null;
  product_id: number;
  settlement_id: number | null;
  order_time: string;
  duration_hours: number;
  unit_price: number;
  total_amount: number;
  commission_amount: number;
  worker_income: number;
  status: OrderStatus;
  remark: string | null;
  created_at: string;
  customer_name: string;
  worker_name: string | null;
  game_name: string;
  service_name: string;
  settlement_time?: string | null;
}

export interface Settlement {
  id: number;
  worker_id: number;
  worker_name?: string;
  amount: number;
  settlement_time: string;
  remark: string | null;
  created_at: string;
  orders_count?: number;
}

export interface WorkerDashboardData {
  totalIncome: number;
  settledAmount: number;
  unsettledAmount: number;
  orderCount: number;
}

export interface CustomerDashboardData {
  balance: number;
  cumulativeRecharge: number;
  rechargeStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  orderCount: number;
  inProgressCount: number;
}
