import { orderStatusLabelMap, rechargeStatusLabelMap } from '../lib/constants';
import type { OrderStatus, RechargeStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | RechargeStatus;
  type: 'order' | 'recharge';
}

const colorMap: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  pending_recharge: 'bg-amber-50 text-amber-700 ring-amber-200',
  pending_assignment: 'bg-orange-50 text-orange-700 ring-orange-200',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-200',
  completed: 'bg-lime-50 text-lime-700 ring-lime-200',
  settled: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200'
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const label =
    type === 'order'
      ? orderStatusLabelMap[status as OrderStatus]
      : rechargeStatusLabelMap[status as RechargeStatus];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colorMap[status]}`}
    >
      {label}
    </span>
  );
}
