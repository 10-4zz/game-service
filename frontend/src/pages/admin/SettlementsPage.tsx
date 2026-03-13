import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Settlement, WorkerSummary } from '../../types';

export function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState('');
  const [remark, setRemark] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const filterWorkerId = searchParams.get('workerId');

  async function load() {
    setLoading(true);
    try {
      const [settlementData, workerData] = await Promise.all([
        apiGet<Settlement[]>('/api/admin/settlements'),
        apiGet<WorkerSummary[]>('/api/admin/workers')
      ]);
      setSettlements(settlementData);
      setWorkers(workerData);
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

  async function handleDelete(settlement: Settlement) {
    const confirmed = window.confirm(
      `确认删除结算记录 #${settlement.id} 吗？删除后会把关联订单恢复为待结算状态。`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(settlement.id);
    try {
      await apiDelete(`/api/admin/settlements/${settlement.id}`);
      window.alert('结算记录删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredSettlements = useMemo(
    () => (filterWorkerId ? settlements.filter((item) => String(item.worker_id) === filterWorkerId) : settlements),
    [filterWorkerId, settlements]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="结算管理" description="查看工资结算记录；订单通常会在双方确认完成后自动结算，这里也支持管理员手动补结算。" />

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
                    onClick={() => void handleDelete(row)}
                    disabled={deletingId === row.id}
                  >
                    {deletingId === row.id ? '删除中...' : '删除'}
                  </button>
                )
              }
            ]}
          />
        </>
      )}
    </div>
  );
}
