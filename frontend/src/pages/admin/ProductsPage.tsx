import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiGet, apiPost, apiPut } from '../../lib/api';
import { formatCurrency, formatDateTime, formatPercent } from '../../lib/format';
import type { Product } from '../../types';

interface ProductFormState {
  game_name: string;
  service_name: string;
  unit_price: string;
  commission_rate: string;
  description: string;
  is_active: boolean;
}

const initialForm: ProductFormState = {
  game_name: '',
  service_name: '',
  unit_price: '',
  commission_rate: '0.2',
  description: '',
  is_active: true
};

export function AdminProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialForm);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Product[]>('/api/admin/products');
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

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      game_name: product.game_name,
      service_name: product.service_name,
      unit_price: String(product.unit_price),
      commission_rate: String(product.commission_rate),
      description: product.description || '',
      is_active: product.is_active
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      game_name: form.game_name,
      service_name: form.service_name,
      unit_price: Number(form.unit_price),
      commission_rate: Number(form.commission_rate),
      description: form.description,
      is_active: form.is_active
    };

    if (editingId) {
      await apiPut(`/api/admin/products/${editingId}`, payload);
      window.alert('服务项目更新成功');
    } else {
      await apiPost('/api/admin/products', payload);
      window.alert('服务项目创建成功');
    }

    resetForm();
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="服务项目管理" description="管理前台可展示和可下单的服务项目。" />

      <Card title={editingId ? '编辑服务项目' : '新增服务项目'} extra={editingId ? <button type="button" className="btn-secondary" onClick={resetForm}>取消编辑</button> : null}>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleSubmit}>
          <div>
            <label className="label">游戏名称</label>
            <input className="field" value={form.game_name} onChange={(event) => setForm((prev) => ({ ...prev, game_name: event.target.value }))} />
          </div>
          <div>
            <label className="label">服务名称</label>
            <input className="field" value={form.service_name} onChange={(event) => setForm((prev) => ({ ...prev, service_name: event.target.value }))} />
          </div>
          <div>
            <label className="label">单价</label>
            <input className="field" type="number" min="0" step="0.01" value={form.unit_price} onChange={(event) => setForm((prev) => ({ ...prev, unit_price: event.target.value }))} />
          </div>
          <div>
            <label className="label">抽成比例</label>
            <input className="field" type="number" min="0" max="0.99" step="0.01" value={form.commission_rate} onChange={(event) => setForm((prev) => ({ ...prev, commission_rate: event.target.value }))} />
          </div>
          <div className="xl:col-span-2">
            <label className="label">说明</label>
            <input className="field" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
            启用该服务
          </label>
          <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={resetForm}>清空</button>
            <button type="submit" className="btn-primary">{editingId ? '保存修改' : '新增项目'}</button>
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
            {
              key: 'service',
              title: '服务项目',
              render: (row) => (
                <div>
                  <div className="font-medium text-ink">{row.game_name}</div>
                  <div className="text-xs text-slate-600">{row.service_name}</div>
                </div>
              )
            },
            { key: 'price', title: '单价', render: (row) => formatCurrency(row.unit_price) },
            { key: 'rate', title: '抽成比例', render: (row) => formatPercent(row.commission_rate) },
            { key: 'active', title: '状态', render: (row) => (row.is_active ? '已启用' : '已停用') },
            { key: 'created', title: '创建时间', render: (row) => formatDateTime(row.created_at) },
            {
              key: 'action',
              title: '操作',
              render: (row) => (
                <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => startEdit(row)}>
                  编辑
                </button>
              )
            }
          ]}
        />
      )}
    </div>
  );
}
