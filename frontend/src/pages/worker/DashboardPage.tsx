import { useEffect, useState } from 'react';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { WorkerDashboardData } from '../../types';

export function WorkerDashboardPage() {
  const [data, setData] = useState<WorkerDashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const result = await apiGet<WorkerDashboardData>('/api/worker/dashboard');
      setData(result);
    }

    void load();
  }, []);

  if (!data) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="打手个人首页" description="查看自己的订单收入和结算进度；订单在双方确认完成后会自动进入结算。" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="总收入" value={formatCurrency(data.totalIncome)} />
        <StatCard title="已结算" value={formatCurrency(data.settledAmount)} />
        <StatCard title="未结算" value={formatCurrency(data.unsettledAmount)} />
        <StatCard title="已提现" value={formatCurrency(data.withdrawnAmount)} />
        <StatCard title="待审核提现" value={formatCurrency(data.pendingWithdrawAmount)} />
        <StatCard title="可提现金额" value={formatCurrency(data.availableWithdrawAmount)} />
        <StatCard title="订单总数" value={String(data.orderCount)} />
      </div>
    </div>
  );
}
