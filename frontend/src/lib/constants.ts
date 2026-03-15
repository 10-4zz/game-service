import type { OrderStatus, RechargeStatus, Role, WithdrawMethod } from '../types';

export const orderStatusLabelMap: Record<OrderStatus, string> = {
  pending_recharge: '待补余额',
  pending_assignment: '待分配',
  in_progress: '进行中',
  completed: '待双方确认',
  settled: '已结算',
  cancelled: '已取消'
};

export const rechargeStatusLabelMap: Record<RechargeStatus, string> = {
  pending: '待处理',
  approved: '已入账',
  rejected: '已拒绝'
};

export const paymentMethodLabelMap: Record<'alipay' | 'wechat', string> = {
  alipay: '支付宝',
  wechat: '微信'
};

export const withdrawMethodLabelMap: Record<WithdrawMethod, string> = {
  alipay: '支付宝',
  wechat: '微信',
  bank: '银行卡'
};

export const deletableOrderStatuses: OrderStatus[] = ['settled', 'cancelled'];

export function canDeleteOrder(status: OrderStatus) {
  return deletableOrderStatuses.includes(status);
}

export interface NavItem {
  to: string;
  label: string;
}

export const navItemsByRole: Record<Role, NavItem[]> = {
  admin: [
    { to: '/admin/dashboard', label: '仪表盘' },
    { to: '/admin/recharges', label: '充值申请' },
    { to: '/admin/recharge-records', label: '充值记录' },
    { to: '/admin/refunds', label: '退款申请' },
    { to: '/admin/users', label: '用户管理' },
    { to: '/admin/workers', label: '打手管理' },
    { to: '/admin/orders', label: '订单管理' },
    { to: '/admin/settlements', label: '结算管理' },
    { to: '/admin/products', label: '服务项目' }
  ],
  worker: [
    { to: '/worker/dashboard', label: '个人首页' },
    { to: '/worker/orders', label: '陪玩记录' },
    { to: '/worker/settlements', label: '结算/提现' }
  ],
  customer: [
    { to: '/customer/dashboard', label: '用户首页' },
    { to: '/customer/recharge', label: '扫码充值' },
    { to: '/customer/recharge-records', label: '充值记录' },
    { to: '/customer/refunds', label: '申请退款' },
    { to: '/customer/products', label: '服务项目' },
    { to: '/customer/orders/new', label: '下单中心' },
    { to: '/customer/orders', label: '我的订单' }
  ]
};

export const homePathByRole: Record<Role, string> = {
  admin: '/admin/dashboard',
  worker: '/worker/dashboard',
  customer: '/customer/dashboard'
};

export const loginPathByRole: Record<Role, string> = {
  admin: '/admin/login',
  worker: '/worker/login',
  customer: '/customer/login'
};

export const roleLabelMap: Record<Role, string> = {
  admin: '管理员',
  worker: '打手',
  customer: '客户'
};

export function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }
  if (pathname.startsWith('/worker')) {
    return 'worker';
  }
  if (pathname.startsWith('/customer')) {
    return 'customer';
  }
  return null;
}

export function loginPathFromPath(pathname: string) {
  const role = roleFromPath(pathname);
  return role ? loginPathByRole[role] : loginPathByRole.customer;
}
