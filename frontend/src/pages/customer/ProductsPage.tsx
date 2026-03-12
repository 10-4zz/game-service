import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { apiGet } from '../../lib/api';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { Product } from '../../types';

export function CustomerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await apiGet<Product[]>('/api/customer/products');
      setProducts(data);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="服务项目列表" description="浏览可下单项目，查看单价和服务说明。" />
      <div className="grid gap-4 xl:grid-cols-2">
        {products.map((product) => (
          <Card
            key={product.id}
            title={`${product.game_name} / ${product.service_name}`}
            extra={<Link to={`/customer/orders/new?productId=${product.id}`} className="btn-primary">去下单</Link>}
          >
            <div className="space-y-2 text-sm text-slate-600">
              <p>单价：<span className="font-medium text-ink">{formatCurrency(product.unit_price)}</span></p>
              <p>平台抽成比例：<span className="font-medium text-ink">{formatPercent(product.commission_rate)}</span></p>
              <p>说明：{product.description || '暂无说明'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
