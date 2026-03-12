export type Role = 'admin' | 'worker' | 'customer';

export type OrderStatus =
  | 'pending_recharge'
  | 'pending_assignment'
  | 'in_progress'
  | 'completed'
  | 'settled'
  | 'cancelled';

export type RechargeStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  displayName: string;
}

export interface JwtPayload extends AuthUser {
  iat: number;
  exp: number;
}

export interface AppEnv {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    FRONTEND_ORIGIN?: string;
  };
  Variables: {
    authUser: AuthUser | null;
  };
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  display_name: string;
  is_active: number;
  created_at: string;
}

export interface ProductRow {
  id: number;
  game_name: string;
  service_name: string;
  unit_price: number;
  commission_rate: number;
  description: string | null;
  is_active: number;
  created_at: string;
}

export interface OrderDetailRow {
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
  settlement_time: string | null;
}
