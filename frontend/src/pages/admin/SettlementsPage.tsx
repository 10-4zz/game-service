import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { apiDelete, apiGet, apiPost, apiPut } from '../../lib/api';
import { withdrawMethodLabelMap } from '../../lib/constants';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Settlement, WorkerSummary, WorkerWithdrawRequest } from '../../types';

export function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WorkerWithdrawRequest[]>([]);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState('');
  const [remark, setRemark] = useState('');
  const [deletingSettlementId, setDeletingSettlementId] = useState<number | null>(null);
  const [deletingWithdrawId, setDeletingWithdrawId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const filterWorkerId = searchParams.get('workerId');

  async function load() {
    setLoading(true);
    try {
      const [settlementData, workerData, withdrawData] = await Promise.all([
        apiGet<Settlement[]>('/api/admin/settlements'),
        apiGet<WorkerSummary[]>('/api/admin/workers'),
        apiGet<WorkerWithdrawRequest[]>('/api/admin/worker-withdraw-requests')
      ]);
      setSettlements(settlementData);
      setWorkers(workerData);
      setWithdrawRequests(withdrawData);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await apiPost('/api/admin/settlements', {
      worker_id: Number(workerId),
      remark
    });
    window.alert('结算成功');
    setRemark('');
    await load();
  }

  async function handleDeleteSettlement(settlement: Settlement) {
    const confirmed = window.confirm(
      `确认删除结算记录 #${settlement.id} 吗？删除后会把关联订单恢复为待结算状态。`
    );
    if (!confirmed) {
      return;
    }

    setDeletingSettlementId(settlement.id);
    try {
      await apiDelete(`/api/admin/settlements/${settlement.id}`);
      window.alert('结算记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingSettlementId(null);
    }
  }

  async function handleReviewWithdraw(id: number, status: 'approved' | 'rejected') {
    const reviewRemark = window.prompt(`请输入${status === 'approved' ? '通过' : '拒绝'}备注，可留空：`) ?? '';
    try {
      await apiPut(`/api/admin/worker-withdraw-requests/${id}/review`, {
        status,
        review_remark: reviewRemark
      });
      window.alert('提现申请处理成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '处理失败');
    }
  }

  async function handleDeleteWithdraw(row: WorkerWithdrawRequest) {
    const confirmed = window.confirm(`确认删除提现记录 #${row.id} 吗？删除后可提现额度会重新释放。`);
    if (!confirmed) {
      return;
    }

    setDeletingWithdrawId(row.id);
    try {
      await apiDelete(`/api/admin/worker-withdraw-requests/${row.id}`);
      window.alert('提现记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingWithdrawId(null);
    }
  }

  const filteredSettlements = useMemo(
    () => (filterWorkerId ? settlements.filter((item) => String(item.worker_id) === filterWorkerId) : settlements),
    [filterWorkerId, settlements]
  );

  const filteredWithdrawRequests = useMemo(
    () => (filterWorkerId ? withdrawRequests.filter((item) => String(item.worker_id) === filterWorkerId) : withdrawRequests),
    [filterWorkerId, withdrawRequests]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="结算管理" description="查看工资结算记录、补结算订单，并审核打手提现申请。" />

      <Card title="发起结算">
        <form className="grid gap-4 md:grid-cols-[1fr_2fr_auto]" onSubmit={handleSubmit}>
          <div>
            <label className="label">选择打手</label>
            <select className="field" value={workerId} onChange={(event) => setWorkerId(event.target.value)}>
              <option value="">请选择打手</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">结算备注</label>
            <input className="field" value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="例如：本周第一批工资结算" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">发起结算</button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingView />
      ) : (
        <>
          <Card title="打手结算概览">
            <DataTable
              data={workers}
              rowKey={(row) => row.id}
              columns={[
                { key: 'worker', title: '打手', render: (row) => row.display_name },
                { key: 'income', title: '总收入', render: (row) => formatCurrency(row.total_income) },
                { key: 'settled', title: '已结算', render: (row) => formatCurrency(row.settled_amount) },
                { key: 'unsettled', title: '未结算', render: (row) => formatCurrency(row.unsettled_amount) }
              ]}
              pageSize={5}
            />
          </Card>

          <Card title="工资结算记录">
            <DataTable
              data={filteredSettlements}
              rowKey={(row) => row.id}
              columns={[
                { key: 'worker', title: '打手', render: (row) => row.worker_name || `#${row.worker_id}` },
                { key: 'amount', title: '金额', render: (row) => formatCurrency(row.amount) },
                { key: 'orders', title: '关联订单', render: (row) => row.orders_count ?? '-' },
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

          <Card title="打手提现申请">
            <DataTable
              data={filteredWithdrawRequests}
              rowKey={(row) => row.id}
              columns={[
                { key: 'worker', title: '打手', render: (row) => row.worker_name || `#${row.worker_id}` },
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
                    <div className="flex gap-2">
                      {row.status === 'pending' ? (
                        <>
                          <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => void handleReviewWithdraw(row.id, 'approved')}>
                            通过
                          </button>
                          <button type="button" className="btn-danger px-3 py-2 text-xs" onClick={() => void handleReviewWithdraw(row.id, 'rejected')}>
                            拒绝
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-2 text-xs text-slate-600">{row.reviewer_name || '-'}</span>
                      )}
                      <button
                        type="button"
                        className="btn-danger px-3 py-2 text-xs"
                        onClick={() => void handleDeleteWithdraw(row)}
                        disabled={deletingWithdrawId === row.id}
                      >
                        {deletingWithdrawId === row.id ? '删除中...' : '删除'}
                      </button>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
