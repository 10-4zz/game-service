import { useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiDelete, apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Settlement } from '../../types';

export function WorkerSettlementsPage() {
  const [rows, setRows] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Settlement[]>('/api/worker/settlements');
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(row: Settlement) {
    const confirmed = window.confirm(
      `确认删除结算记录 #${row.id} 吗？删除后会把关联订单恢复为待结算状态。`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    try {
      await apiDelete(`/api/worker/settlements/${row.id}`);
      window.alert('结算记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="工资结算" description="查看自己的结算金额、时间与备注。" />
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'amount', title: '结算金额', render: (row) => formatCurrency(row.amount) },
            { key: 'time', title: '结算时间', render: (row) => formatDateTime(row.settlement_time) },
            { key: 'remark', title: '备注', render: (row) => row.remark || '-' },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <button
                  type="button"
                  className="btn-danger px-3 py-2 text-xs"
                  onClick={() => void handleDelete(row)}
                  disabled={deletingId === row.id}
                >
                  {deletingId === row.id ? '删除中...' : '删除'}
                </button>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
