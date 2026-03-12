import { useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { paymentMethodLabelMap } from '../../lib/constants';
import { apiDelete, apiGet } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { RechargeRequest } from '../../types';

export function CustomerRechargeRecordsPage() {
  const [rows, setRows] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<RechargeRequest[]>('/api/customer/recharge-requests');
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(row: RechargeRequest) {
    const confirmed = window.confirm(`确认删除这条充值申请吗？`);
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    try {
      await apiDelete(`/api/customer/recharge-requests/${row.id}`);
      window.alert('充值申请删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="我的充值记录" description="查看所有充值申请及审核状态。" />
      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'amount', title: '金额', render: (row) => formatCurrency(row.amount) },
            { key: 'payment', title: '支付方式', render: (row) => paymentMethodLabelMap[row.payment_method] },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="recharge" /> },
            { key: 'remark', title: '备注', render: (row) => row.remark || '-' },
            { key: 'review', title: '审核备注', render: (row) => row.review_remark || '-' },
            { key: 'created', title: '申请时间', render: (row) => formatDateTime(row.created_at) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <button
                  type="button"
                  className="btn-danger px-3 py-2 text-xs"
                  onClick={() => void handleDelete(row)}
                  disabled={deletingId === row.id || row.status === 'approved'}
                  title={row.status === 'approved' ? '已通过的充值申请不能删除' : '删除充值申请'}
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
