import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { apiGet } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import type { AdminDashboardData } from '../../types';

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await apiGet<AdminDashboardData>('/api/admin/dashboard');
        setData(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载失败');
      }
    }

    void load();
  }, []);

  if (error) {
    return <Card title="加载失败">{error}</Card>;
  }

  if (!data) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="老板仪表盘"
        description="查看平台当前资金、订单和结算总览。"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="平台余额" value={formatCurrency(data.platformBalance)} />
        <StatCard title="累计充值" value={formatCurrency(data.cumulativeRecharge)} />
        <StatCard title="用户总数" value={String(data.userCount)} />
        <StatCard title="打手总数" value={String(data.workerCount)} />
        <StatCard title="订单总数" value={String(data.orderCount)} />
        <StatCard title="已结算金额" value={formatCurrency(data.settledAmount)} />
        <StatCard title="未结算金额" value={formatCurrency(data.unsettledAmount)} />
      </div>
    </div>
  );
}
