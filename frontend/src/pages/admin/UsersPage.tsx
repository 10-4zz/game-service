import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { UserSummary } from '../../types';

const initialForm = {
  username: '',
  password: '',
  display_name: ''
};

export function AdminUsersPage() {
  const [rows, setRows] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const customerIdFilter = searchParams.get('customerId');

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<UserSummary[]>('/api/admin/users');
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
    await apiPost('/api/admin/users', form);
    window.alert('用户创建成功');
    setForm(initialForm);
    await load();
  }

  async function handleDelete(row: UserSummary) {
    const confirmed = window.confirm(`确认删除用户「${row.display_name}」吗？该操作会停用账号并从列表中隐藏。`);
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    try {
      await apiDelete(`/api/admin/users/${row.id}`);
      window.alert('用户删除成功');
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = customerIdFilter
    ? rows.filter((item) => String(item.id) === customerIdFilter)
    : rows;

  return (
    <div className="space-y-6">
      <PageHeader title="用户管理" description="新增客户账号，查看余额、充值和订单数据。" />

      <Card title="新增用户">
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
            <button type="submit" className="btn-primary w-full">创建用户</button>
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
              key: 'user',
              title: '用户',
              render: (row) => (
                <div>
                  <div className="font-medium text-ink">{row.display_name}</div>
                  <div className="text-xs text-slate-600">{row.username}</div>
                </div>
              )
            },
            { key: 'balance', title: '余额', render: (row) => formatCurrency(row.balance) },
            { key: 'recharge', title: '累计充值', render: (row) => formatCurrency(row.total_recharged) },
            { key: 'orders', title: '订单数', render: (row) => row.order_count },
            { key: 'created', title: '创建时间', render: (row) => formatDateTime(row.created_at) },
            {
              key: 'links',
              title: '操作',
              render: (row) => (
                <div className="flex gap-2 text-xs">
                  <Link className="btn-secondary px-3 py-2" to={`/admin/orders?customerId=${row.id}`}>
                    订单
                  </Link>
                  <Link className="btn-secondary px-3 py-2" to={`/admin/recharges?customerId=${row.id}`}>
                    充值
                  </Link>
                  <button
                    type="button"
                    className="btn-danger px-3 py-2"
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
