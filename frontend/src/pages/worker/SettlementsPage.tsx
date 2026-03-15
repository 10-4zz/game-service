import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { withdrawMethodLabelMap } from '../../lib/constants';
import type { Settlement, WorkerDashboardData, WorkerWithdrawRequest, WithdrawMethod } from '../../types';

export function WorkerSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WorkerWithdrawRequest[]>([]);
  const [dashboard, setDashboard] = useState<WorkerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingSettlementId, setDeletingSettlementId] = useState<number | null>(null);
  const [deletingWithdrawId, setDeletingWithdrawId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('alipay');
  const [accountName, setAccountName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [remark, setRemark] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [settlementData, withdrawData, dashboardData] = await Promise.all([
        apiGet<Settlement[]>('/api/worker/settlements'),
        apiGet<WorkerWithdrawRequest[]>('/api/worker/withdraw-requests'),
        apiGet<WorkerDashboardData>('/api/worker/dashboard')
      ]);
      setSettlements(settlementData);
      setWithdrawRequests(withdrawData);
      setDashboard(dashboardData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDeleteSettlement(row: Settlement) {
    const confirmed = window.confirm(
      `确认删除结算记录 #${row.id} 吗？删除后会把关联订单恢复为待结算状态。`
    );
    if (!confirmed) {
      return;
    }

    setDeletingSettlementId(row.id);
    try {
      await apiDelete(`/api/worker/settlements/${row.id}`);
      window.alert('结算记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingSettlementId(null);
    }
  }

  async function handleDeleteWithdraw(row: WorkerWithdrawRequest) {
    const confirmed = window.confirm(`确认删除提现记录 #${row.id} 吗？已通过的记录不能删除。`);
    if (!confirmed) {
      return;
    }

    setDeletingWithdrawId(row.id);
    try {
      await apiDelete(`/api/worker/withdraw-requests/${row.id}`);
      window.alert('提现记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingWithdrawId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/api/worker/withdraw-requests', {
        amount: Number(amount),
        withdraw_method: withdrawMethod,
        account_name: accountName,
        account_no: accountNo,
        remark
      });
      window.alert('提现申请已提交');
      setAmount('');
      setAccountName('');
      setAccountNo('');
      setRemark('');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !dashboard) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="工资结算与提现" description="查看已结算收入、可提现金额，并提交提现申请。" />

      <Card title="提现概览">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-600">已提现</p>
            <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(dashboard.withdrawnAmount)}</p>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-600">待审核提现</p>
            <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(dashboard.pendingWithdrawAmount)}</p>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-600">当前可提现</p>
            <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(dashboard.availableWithdrawAmount)}</p>
          </div>
        </div>
      </Card>

      <Card title="提交提现申请">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleSubmit}>
          <div>
            <label className="label">提现金额</label>
            <input className="field" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div>
            <label className="label">提现方式</label>
            <select className="field" value={withdrawMethod} onChange={(event) => setWithdrawMethod(event.target.value as WithdrawMethod)}>
              {Object.entries(withdrawMethodLabelMap).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">收款姓名</label>
            <input className="field" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
          </div>
          <div>
            <label className="label">收款账号</label>
            <input className="field" value={accountNo} onChange={(event) => setAccountNo(event.target.value)} />
          </div>
          <div>
            <label className="label">备注</label>
            <input className="field" value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="例如：本周一结算提现" />
          </div>
          <div className="xl:col-span-5 flex justify-end">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '提交提现申请'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="提现记录">
        <DataTable
          data={withdrawRequests}
          rowKey={(row) => row.id}
          columns={[
            { key: 'amount', title: '提现金额', render: (row) => formatCurrency(row.amount) },
            { key: 'method', title: '提现方式', render: (row) => withdrawMethodLabelMap[row.withdraw_method] },
            { key: 'account', title: '收款信息', render: (row) => `${row.account_name} / ${row.account_no}` },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="recharge" /> },
            { key: 'remark', title: '申请备注', render: (row) => row.remark || '-' },
            { key: 'review', title: '审核备注', render: (row) => row.review_remark || '-' },
            { key: 'created', title: '申请时间', render: (row) => formatDateTime(row.created_at) },
            { key: 'reviewed', title: '审核时间', render: (row) => formatDateTime(row.reviewed_at) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <button
                  type="button"
                  className="btn-danger px-3 py-2 text-xs"
                  onClick={() => void handleDeleteWithdraw(row)}
                  disabled={deletingWithdrawId === row.id || row.status === 'approved'}
                  title={row.status === 'approved' ? '已通过的提现记录不能删除' : '删除提现记录'}
                >
                  {deletingWithdrawId === row.id ? '删除中...' : '删除'}
                </button>
              )
            }
          ]}
        />
      </Card>

      <Card title="工资结算记录">
        <DataTable
          data={settlements}
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
                  onClick={() => void handleDeleteSettlement(row)}
                  disabled={deletingSettlementId === row.id}
                >
                  {deletingSettlementId === row.id ? '删除中...' : '删除'}
                </button>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
