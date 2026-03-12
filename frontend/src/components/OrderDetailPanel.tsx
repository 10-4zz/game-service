import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '../lib/format';
import type { Order } from '../types';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

export function OrderDetailPanel({
  order,
  backTo
}: {
  order: Order;
  backTo: string;
}) {
  const items = [
    ['订单编号', order.order_no],
    ['用户姓名', order.customer_name],
    ['打手姓名', order.worker_name || '待分配'],
    ['游戏项目', `${order.game_name} / ${order.service_name}`],
    ['订单时间', formatDateTime(order.order_time)],
    ['时长', `${order.duration_hours} 小时`],
    ['单价', formatCurrency(order.unit_price)],
    ['总额', formatCurrency(order.total_amount)],
    ['抽成', formatCurrency(order.commission_amount)],
    ['实际收入', formatCurrency(order.worker_income)],
    ['创建时间', formatDateTime(order.created_at)],
    ['结算时间', formatDateTime(order.settlement_time)]
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">订单详情</h1>
          <p className="mt-1 text-sm text-slate-700">查看订单价格构成、状态和结算信息。</p>
        </div>
        <Link to={backTo} className="btn-secondary">
          返回列表
        </Link>
      </div>

      <Card
        title="订单状态"
        extra={<StatusBadge status={order.status} type="order" />}
      >
        <p className="text-sm text-slate-700">{order.remark || '暂无备注。'}</p>
      </Card>

      <Card title="基础信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
              <p className="mt-2 text-sm font-medium text-ink">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
