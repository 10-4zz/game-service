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

export function WorkerOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Order[]>('/api/worker/orders');
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
      await apiDelete(`/api/worker/orders/${order.id}`);
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
      <PageHeader title="陪玩记录" description="仅展示分配给自己的订单。" />
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'order', title: '订单编号', render: (row) => row.order_no },
            { key: 'customer', title: '客户', render: (row) => row.customer_name },
            { key: 'service', title: '服务', render: (row) => `${row.game_name} / ${row.service_name}` },
            { key: 'income', title: '实际收入', render: (row) => formatCurrency(row.worker_income) },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="order" /> },
            { key: 'time', title: '订单时间', render: (row) => formatDateTime(row.order_time) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <div className="flex gap-2">
                  <Link to={`/worker/orders/${row.id}`} className="btn-secondary px-3 py-2 text-xs">
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
