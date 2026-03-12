import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { orderStatusLabelMap } from '../../lib/constants';
import { apiGet, apiPost, apiPut } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Order, Product, UserSummary, WorkerSummary, OrderStatus } from '../../types';

interface OrderFormState {
  customer_id: string;
  worker_id: string;
  product_id: string;
  duration_hours: string;
  order_time: string;
  commission_amount: string;
  status: OrderStatus;
  remark: string;
}

const initialForm: OrderFormState = {
  customer_id: '',
  worker_id: '',
  product_id: '',
  duration_hours: '1',
  order_time: '',
  commission_amount: '',
  status: 'pending_assignment',
  remark: ''
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [workers, setWorkers] = useState<WorkerSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [form, setForm] = useState<OrderFormState>(initialForm);
  const [searchParams] = useSearchParams();
  const customerIdFilter = searchParams.get('customerId');
  const workerIdFilter = searchParams.get('workerId');
  const statusFilter = searchParams.get('status') ?? 'all';

  async function load() {
    setLoading(true);
    try {
      const [ordersData, usersData, workersData, productsData] = await Promise.all([
        apiGet<Order[]>('/api/admin/orders'),
        apiGet<UserSummary[]>('/api/admin/users'),
        apiGet<WorkerSummary[]>('/api/admin/workers'),
        apiGet<Product[]>('/api/admin/products')
      ]);
      setOrders(ordersData);
      setUsers(usersData);
      setWorkers(workersData);
      setProducts(productsData);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(order: Order) {
    setEditingOrderId(order.id);
    setForm({
      customer_id: String(order.customer_id),
      worker_id: order.worker_id ? String(order.worker_id) : '',
      product_id: String(order.product_id),
      duration_hours: String(order.duration_hours),
      order_time: order.order_time.slice(0, 16),
      commission_amount: String(order.commission_amount),
      status: order.status,
      remark: order.remark || ''
    });
  }

  function resetForm() {
    setEditingOrderId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      customer_id: Number(form.customer_id),
      worker_id: form.worker_id ? Number(form.worker_id) : null,
      product_id: Number(form.product_id),
      duration_hours: Number(form.duration_hours),
      order_time: form.order_time || undefined,
      commission_amount: form.commission_amount ? Number(form.commission_amount) : undefined,
      status: form.status,
      remark: form.remark
    };

    if (editingOrderId) {
      await apiPut(`/api/admin/orders/${editingOrderId}`, payload);
      window.alert('订单更新成功');
    } else {
      await apiPost('/api/admin/orders', payload);
      window.alert('订单创建成功');
    }

    resetForm();
    await load();
  }

  const filteredOrders = useMemo(
    () =>
      orders.filter((item) => {
        const matchesCustomer = customerIdFilter ? String(item.customer_id) === customerIdFilter : true;
        const matchesWorker = workerIdFilter ? String(item.worker_id) === workerIdFilter : true;
        const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        return matchesCustomer && matchesWorker && matchesStatus;
      }),
    [customerIdFilter, orders, statusFilter, workerIdFilter]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="订单管理" description="老板可创建订单、指派打手、更新状态与查看详情。" />

      <Card title={editingOrderId ? '编辑订单' : '创建订单'} extra={editingOrderId ? <button type="button" className="btn-secondary" onClick={resetForm}>取消编辑</button> : null}>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">客户</label>
            <select className="field" value={form.customer_id} onChange={(event) => setForm((prev) => ({ ...prev, customer_id: event.target.value }))}>
              <option value="">请选择客户</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">打手</label>
            <select className="field" value={form.worker_id} onChange={(event) => setForm((prev) => ({ ...prev, worker_id: event.target.value }))}>
              <option value="">暂不分配</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">服务项目</label>
            <select className="field" value={form.product_id} onChange={(event) => setForm((prev) => ({ ...prev, product_id: event.target.value }))}>
              <option value="">请选择项目</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.game_name} / {product.service_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select className="field" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as OrderStatus }))}>
              {Object.entries(orderStatusLabelMap)
                .filter(([status]) => status !== 'pending_recharge' && status !== 'settled')
                .map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">时长（小时）</label>
            <input className="field" type="number" min="1" step="0.5" value={form.duration_hours} onChange={(event) => setForm((prev) => ({ ...prev, duration_hours: event.target.value }))} />
          </div>
          <div>
            <label className="label">抽成金额</label>
            <input className="field" type="number" min="0" step="0.01" value={form.commission_amount} onChange={(event) => setForm((prev) => ({ ...prev, commission_amount: event.target.value }))} />
          </div>
          <div>
            <label className="label">订单时间</label>
            <input className="field" type="datetime-local" value={form.order_time} onChange={(event) => setForm((prev) => ({ ...prev, order_time: event.target.value }))} />
          </div>
          <div>
            <label className="label">备注</label>
            <input className="field" value={form.remark} onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))} />
          </div>
          <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={resetForm}>
              清空
            </button>
            <button type="submit" className="btn-primary">
              {editingOrderId ? '保存订单' : '创建订单'}
            </button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingView />
      ) : (
        <DataTable
          data={filteredOrders}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'order',
              title: '订单',
              render: (row) => (
                <div>
                  <div className="font-medium text-ink">{row.order_no}</div>
                  <div className="text-xs text-slate-600">{row.game_name} / {row.service_name}</div>
                </div>
              )
            },
            { key: 'customer', title: '用户', render: (row) => row.customer_name },
            { key: 'worker', title: '打手', render: (row) => row.worker_name || '待分配' },
            { key: 'amount', title: '总额', render: (row) => formatCurrency(row.total_amount) },
            { key: 'income', title: '实际收入', render: (row) => formatCurrency(row.worker_income) },
            { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} type="order" /> },
            { key: 'time', title: '订单时间', render: (row) => formatDateTime(row.order_time) },
            {
              key: 'actions',
              title: '操作',
              render: (row) => (
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => startEdit(row)}>
                    编辑
                  </button>
                  <Link to={`/admin/orders/${row.id}`} className="btn-secondary px-3 py-2 text-xs">
                    详情
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
