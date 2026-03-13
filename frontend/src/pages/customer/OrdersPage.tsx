import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { canDeleteOrder } from '../../lib/constants';
import { apiDelete, apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Order } from '../../types';

export function CustomerOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Order[]>('/api/customer/orders');
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(order: Order) {
    const confirmed = window.confirm(`确认删除订单「${order.order_no}」吗？仅已结算或已取消订单允许删除。`);
    if (!confirmed) {
      return;
    }

    setDeletingId(order.id);
    try {
      await apiDelete(`/api/customer/orders/${order.id}`);
      window.alert('订单删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="我的订单" description="查看订单状态、打手分配和双方确认进度。" />
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'order', title: '订单编号', render: (row) => row.order_no },
            { key: 'service', title: '服务项目', render: (row) => `${row.game_name} / ${row.service_name}` },
            { key: 'worker', title: '打手', render: (row) => row.worker_name || '待分配' },
            { key: 'amount', title: '总额', render: (row) => formatCurrency(row.total_amount) },
            {
              key: 'confirm',
              title: '确认进度',
              render: (row) => `${row.customer_completed ? '客户已确认' : '客户未确认'} / ${row.worker_completed ? '打手已确认' : '打手未确认'}`
            },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="order" /> },
            { key: 'time', title: '订单时间', render: (row) => formatDateTime(row.order_time) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <div className="flex gap-2">
                  <Link to={`/customer/orders/${row.id}`} className="btn-secondary px-3 py-2 text-xs">
                    查看
                  </Link>
                  <button
                    type="button"
                    className="btn-danger px-3 py-2 text-xs"
                    onClick={() => void handleDelete(row)}
                    disabled={deletingId === row.id || !canDeleteOrder(row.status)}
                    title={canDeleteOrder(row.status) ? '删除订单' : '仅已结算或已取消订单可删除'}
                  >
                    {deletingId === row.id ? '删除中...' : '删除'}
                  </button>
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
