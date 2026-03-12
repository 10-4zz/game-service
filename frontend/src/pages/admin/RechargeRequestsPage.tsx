import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { paymentMethodLabelMap } from '../../lib/constants';
import { apiGet, apiPut } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { RechargeRequest } from '../../types';

export function AdminRechargeRequestsPage() {
  const [rows, setRows] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchParams] = useSearchParams();
  const customerIdFilter = searchParams.get('customerId');

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<RechargeRequest[]>('/api/admin/recharge-requests');
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
    await apiPut(`/api/admin/recharge-requests/${id}/review`, {
      status,
      review_remark: reviewRemark
    });
    window.alert('处理成功');
    await load();
  }

  const filtered = rows.filter((item) => {
    const matchesCustomer = customerIdFilter ? String(item.user_id) === customerIdFilter : true;
    const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
    const matchesDate = dateFilter ? item.created_at.startsWith(dateFilter) : true;
    return matchesCustomer && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="充值申请管理" description="审核客户充值申请，审核通过后自动入账。" />

      <Card title="筛选">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">审核状态</label>
            <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">全部</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div>
            <label className="label">申请日期</label>
            <input className="field" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </div>
          <div className="flex items-end">
            <button type="button" className="btn-secondary" onClick={() => { setStatusFilter('all'); setDateFilter(''); }}>
              重置筛选
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={filtered}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'user',
              title: '用户',
              render: (row) => (
                <div>
                  <div className="font-medium text-ink">{row.user_name}</div>
                  <div className="text-xs text-slate-600">ID #{row.user_id}</div>
                </div>
              )
            },
            {
              key: 'amount',
              title: '金额',
              render: (row) => formatCurrency(row.amount)
            },
            {
              key: 'payment',
              title: '支付方式',
              render: (row) => paymentMethodLabelMap[row.payment_method]
            },
            {
              key: 'status',
              title: '状态',
              render: (row) => <StatusBadge status={row.status} type="recharge" />
            },
            {
              key: 'remark',
              title: '备注',
              render: (row) => row.remark || '-'
            },
            {
              key: 'time',
              title: '申请时间',
              render: (row) => formatDateTime(row.created_at)
            },
            {
              key: 'action',
              title: '操作',
              render: (row) =>
                row.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => void review(row.id, 'approved')}>
                      通过
                    </button>
                    <button type="button" className="btn-danger px-3 py-2 text-xs" onClick={() => void review(row.id, 'rejected')}>
                      拒绝
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600">{row.reviewer_name || '-'}</span>
                )
            }
          ]}
        />
      )}
    </div>
  );
}
