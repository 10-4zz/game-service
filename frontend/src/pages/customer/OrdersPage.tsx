import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Order } from '../../types';

export function CustomerOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await apiGet<Order[]>('/api/customer/orders');
      setRows(data);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="我的订单" description="查看订单状态、已分配打手和价格构成。" />
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
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="order" /> },
            { key: 'time', title: '订单时间', render: (row) => formatDateTime(row.order_time) },
            {
              key: 'detail',
              title: '详情',
              render: (row) => (
                <Link to={`/customer/orders/${row.id}`} className="btn-secondary px-3 py-2 text-xs">
                  查看
                </Link>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
