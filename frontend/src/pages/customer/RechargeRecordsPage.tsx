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
    const confirmed = window.confirm(
      row.status === 'approved'
        ? '确认删除这条已入账充值记录吗？如果当前余额不足以回滚，本次删除会失败。'
        : '确认删除这条充值记录吗？'
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    try {
      await apiDelete(`/api/customer/recharge-requests/${row.id}`);
      window.alert('充值记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="我的充值记录" description="查看所有扫码充值记录和入账状态。" />
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
            { key: 'review', title: '处理备注', render: (row) => row.review_remark || '-' },
            { key: 'created', title: '创建时间', render: (row) => formatDateTime(row.created_at) },
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
