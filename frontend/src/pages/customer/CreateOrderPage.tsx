import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiGet, apiPost } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { Product } from '../../types';

export function CustomerCreateOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchParams] = useSearchParams();
  const [productId, setProductId] = useState(searchParams.get('productId') ?? '');
  const [durationHours, setDurationHours] = useState('1');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    async function load() {
      const data = await apiGet<Product[]>('/api/customer/products');
      setProducts(data);
    }

    void load();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.id) === productId),
    [productId, products]
  );

  const duration = Number(durationHours) || 0;
  const total = selectedProduct ? Number((selectedProduct.unit_price * duration).toFixed(2)) : 0;
  const commission = selectedProduct ? Number((total * selectedProduct.commission_rate).toFixed(2)) : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await apiPost('/api/customer/orders', {
      product_id: Number(productId),
      duration_hours: duration,
      remark
    });
    window.alert('订单创建成功');
    setRemark('');
  }

  if (products.length === 0) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="下单中心" description="选择服务、时长并自动计算总额。" />

      <Card title="创建订单">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="label">服务项目</label>
            <select className="field" value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">请选择服务项目</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.game_name} / {product.service_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">时长（小时）</label>
            <input className="field" type="number" min="1" step="0.5" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">备注</label>
            <input className="field" value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="可填写段位、目标或语音需求" />
          </div>

          <div className="md:col-span-2 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">单价</p>
              <p className="mt-2 text-lg font-semibold text-ink">{selectedProduct ? formatCurrency(selectedProduct.unit_price) : '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">总额</p>
              <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">预计平台抽成</p>
              <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(commission)}</p>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">提交订单</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
