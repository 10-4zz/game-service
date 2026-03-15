import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { RefundRequest } from '../../types';

export function CustomerRefundRequestsPage() {
  const [rows, setRows] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<RefundRequest[]>('/api/customer/refund-requests');
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/api/customer/refund-requests', {
        amount: Number(amount),
        remark
      });
      window.alert('退款申请已提交');
      setAmount('');
      setRemark('');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(row: RefundRequest) {
    const confirmed = window.confirm(`确认删除退款记录 #${row.id} 吗？`);
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    try {
      await apiDelete(`/api/customer/refund-requests/${row.id}`);
      window.alert('退款记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="申请退款" description="提交平台余额退款申请，管理员线下退款后会在平台审核通过并扣减余额。" />

      <Card title="退款申请表">
        <form className="grid gap-4 md:grid-cols-[1fr_2fr_auto]" onSubmit={handleSubmit}>
          <div>
            <label className="label">退款金额</label>
            <input className="field" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div>
            <label className="label">退款备注</label>
            <input className="field" value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="例如：本周暂时不用，申请退回余额" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={rows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'amount', title: '退款金额', render: (row) => formatCurrency(row.amount) },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="recharge" /> },
            { key: 'remark', title: '申请备注', render: (row) => row.remark || '-' },
            { key: 'review_remark', title: '审核备注', render: (row) => row.review_remark || '-' },
            { key: 'created', title: '申请时间', render: (row) => formatDateTime(row.created_at) },
            { key: 'reviewed', title: '审核时间', render: (row) => formatDateTime(row.reviewed_at) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <button
                  type="button"
                  className="btn-danger px-3 py-2 text-xs"
                  onClick={() => void handleDelete(row)}
                  disabled={deletingId === row.id || row.status === 'approved'}
                  title={row.status === 'approved' ? '已通过的退款记录仅管理员可删除' : '删除退款记录'}
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
