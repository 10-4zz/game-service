import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { apiDelete, apiGet, apiPut } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { RefundRequest } from '../../types';

export function AdminRefundRequestsPage() {
  const [rows, setRows] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<RefundRequest[]>('/api/admin/refund-requests');
      setRows(data);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(id: number, status: 'approved' | 'rejected') {
    const reviewRemark = window.prompt(`请输入${status === 'approved' ? '通过' : '拒绝'}备注，可留空：`) ?? '';
    try {
      await apiPut(`/api/admin/refund-requests/${id}/review`, {
        status,
        review_remark: reviewRemark
      });
      window.alert('退款申请处理成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '处理失败');
    }
  }

  async function handleDelete(row: RefundRequest) {
    const confirmed = window.confirm(
      row.status === 'approved'
        ? `确认删除退款记录 #${row.id} 吗？删除后会把这笔退款金额恢复回客户余额。`
        : `确认删除退款记录 #${row.id} 吗？`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    try {
      await apiDelete(`/api/admin/refund-requests/${row.id}`);
      window.alert('退款记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredRows = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)),
    [rows, statusFilter]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="退款申请管理" description="客户提交退款申请后，管理员线下退款并在平台审核通过，系统会同步扣减客户余额。" />

      <Card title="筛选">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label className="label">审核状态</label>
            <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">全部</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" className="btn-secondary" onClick={() => setStatusFilter('all')}>
              重置筛选
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={filteredRows}
          rowKey={(row) => row.id}
          columns={[
            { key: 'user', title: '客户', render: (row) => row.user_name || `#${row.user_id}` },
            { key: 'amount', title: '退款金额', render: (row) => formatCurrency(row.amount) },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="recharge" /> },
            { key: 'remark', title: '申请备注', render: (row) => row.remark || '-' },
            { key: 'review', title: '审核备注', render: (row) => row.review_remark || '-' },
            { key: 'created', title: '申请时间', render: (row) => formatDateTime(row.created_at) },
            { key: 'reviewed', title: '审核时间', render: (row) => formatDateTime(row.reviewed_at) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <div className="flex gap-2">
                  {row.status === 'pending' ? (
                    <>
                      <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => void review(row.id, 'approved')}>
                        通过
                      </button>
                      <button type="button" className="btn-danger px-3 py-2 text-xs" onClick={() => void review(row.id, 'rejected')}>
                        拒绝
                      </button>
                    </>
                  ) : (
                    <span className="px-2 py-2 text-xs text-slate-600">{row.reviewer_name || '-'}</span>
                  )}
                  <button
                    type="button"
                    className="btn-danger px-3 py-2 text-xs"
                    onClick={() => void handleDelete(row)}
                    disabled={deletingId === row.id}
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
