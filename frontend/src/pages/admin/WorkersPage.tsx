import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiGet, apiPost } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { WorkerSummary } from '../../types';

const initialForm = {
  username: '',
  password: '',
  display_name: ''
};

export function AdminWorkersPage() {
  const [rows, setRows] = useState<WorkerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [searchParams] = useSearchParams();
  const workerIdFilter = searchParams.get('workerId');

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<WorkerSummary[]>('/api/admin/workers');
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await apiPost('/api/admin/workers', form);
    window.alert('打手创建成功');
    setForm(initialForm);
    await load();
  }

  const filtered = workerIdFilter ? rows.filter((item) => String(item.id) === workerIdFilter) : rows;

  return (
    <div className="space-y-6">
      <PageHeader title="打手管理" description="新增打手账号，查看接单与结算情况。" />

      <Card title="新增打手">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">用户名</label>
            <input className="field" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
          </div>
          <div>
            <label className="label">密码</label>
            <input className="field" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
          </div>
          <div>
            <label className="label">显示名称</label>
            <input className="field" value={form.display_name} onChange={(event) => setForm((prev) => ({ ...prev, display_name: event.target.value }))} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">创建打手</button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={filtered}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'worker',
              title: '打手',
              render: (row) => (
                <div>
                  <div className="font-medium text-ink">{row.display_name}</div>
                  <div className="text-xs text-slate-500">{row.username}</div>
                </div>
              )
            },
            { key: 'orders', title: '订单数', render: (row) => row.order_count },
            { key: 'income', title: '总收入', render: (row) => formatCurrency(row.total_income) },
            { key: 'settled', title: '已结算', render: (row) => formatCurrency(row.settled_amount) },
            { key: 'unsettled', title: '未结算', render: (row) => formatCurrency(row.unsettled_amount) },
            { key: 'created', title: '创建时间', render: (row) => formatDateTime(row.created_at) },
            {
              key: 'links',
              title: '查看',
              render: (row) => (
                <div className="flex gap-2 text-xs">
                  <Link className="btn-secondary px-3 py-2" to={`/admin/orders?workerId=${row.id}`}>
                    订单
                  </Link>
                  <Link className="btn-secondary px-3 py-2" to={`/admin/settlements?workerId=${row.id}`}>
                    结算
                  </Link>
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
