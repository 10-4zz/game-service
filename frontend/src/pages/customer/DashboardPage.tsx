import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { CustomerDashboardData } from '../../types';

export function CustomerDashboardPage() {
  const [data, setData] = useState<CustomerDashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const result = await apiGet<CustomerDashboardData>('/api/customer/dashboard');
      setData(result);
    }

    void load();
  }, []);

  if (!data) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="用户首页" description="查看余额、充值入账状态和当前订单数量。" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="当前余额" value={formatCurrency(data.balance)} />
        <StatCard title="累计充值" value={formatCurrency(data.cumulativeRecharge)} />
        <StatCard title="我的订单" value={String(data.orderCount)} />
        <StatCard title="进行中订单" value={String(data.inProgressCount)} />
      </div>
      <Card title="充值记录状态">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="待处理" value={String(data.rechargeStatus.pending)} />
          <StatCard title="已入账" value={String(data.rechargeStatus.approved)} />
          <StatCard title="已拒绝" value={String(data.rechargeStatus.rejected)} />
        </div>
      </Card>
    </div>
  );
}
